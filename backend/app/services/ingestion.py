import uuid
import os
import tempfile
from typing import Dict, Any
from app.config import settings
from app.utils.chunking import sentence_aware_chunk
from app.services.embedding import embedding_service
from app.services.bm25 import bm25_index
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


class IngestionService:
    def __init__(self):
        self._qdrant_client = None
        self._firestore = None
        self._storage = None
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def _get_qdrant(self):
        if self._qdrant_client is None:
            from qdrant_client import QdrantClient
            self._qdrant_client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
            )
        return self._qdrant_client

    def _get_firestore(self):
        if self._firestore is None:
            from app.core.database import get_firestore
            self._firestore = get_firestore()
        return self._firestore

    def _get_storage(self):
        if self._storage is None:
            from app.core.storage import get_storage
            self._storage = get_storage()
        return self._storage

    async def ingest_pdf(self, file_content: bytes, filename: str, metadata: dict | None = None) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {
            "status": "processing",
            "chunks_processed": 0,
            "chunks_total": 0,
        }

        import pdfplumber
        import io

        metadata = metadata or {}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            full_text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    full_text += f"\n{page_text}"

            chunks = sentence_aware_chunk(
                full_text,
                chunk_size=settings.chunk_size,
                overlap=settings.chunk_overlap,
            )

            self._jobs[job_id]["chunks_total"] = len(chunks)

            doc_id = str(uuid.uuid4())
            chunk_ids = []
            chunk_texts = []

            for chunk_text, page_num in chunks:
                chunk_id = str(uuid.uuid4())
                chunk_ids.append(chunk_id)
                chunk_texts.append(chunk_text)

            embeddings = embedding_service.encode(chunk_texts)

            qdrant = self._get_qdrant()
            from qdrant_client.models import PointStruct

            points = []
            for i, (chunk_text, page_num) in enumerate(chunks):
                points.append(PointStruct(
                    id=chunk_ids[i],
                    vector=embeddings[i],
                    payload={
                        "doc_id": doc_id,
                        "doc_name": filename,
                        "doc_type": metadata.get("type", "other"),
                        "company": metadata.get("company", ""),
                        "date": metadata.get("date", ""),
                        "page": page_num,
                        "text": chunk_text,
                    },
                ))
                bm25_index.add_document(chunk_text, chunk_ids[i])
                self._jobs[job_id]["chunks_processed"] = i + 1

            qdrant.upsert(
                collection_name=settings.qdrant_collection,
                points=points,
            )

            bm25_index.build(bm25_index.corpus, bm25_index.doc_ids)

            firestore = self._get_firestore()
            doc_ref = firestore.collection("documents").document(doc_id)
            if settings.storage_provider == "local":
                storage_path = f"local://pdfs/{doc_id}/{filename}"
            else:
                storage_path = f"gs://{settings.gcs_bucket}/pdfs/{doc_id}/{filename}"

            doc_ref.set({
                "name": filename,
                "type": metadata.get("type", "other"),
                "company": metadata.get("company", ""),
                "date": metadata.get("date", ""),
                "chunk_count": len(chunks),
                "storage_path": storage_path,
                "status": "indexed",
                "ingested_at": SERVER_TIMESTAMP,
            })

            storage_client = self._get_storage()
            storage_client.upload(file_content, doc_id, filename)

            self._jobs[job_id]["status"] = "completed"

        except Exception as e:
            self._jobs[job_id]["status"] = "error"
            self._jobs[job_id]["error"] = str(e)
        finally:
            os.unlink(tmp_path)

        return job_id

    def get_job_status(self, job_id: str) -> dict | None:
        return self._jobs.get(job_id)

    async def get_corpus_stats(self) -> dict:
        qdrant = self._get_qdrant()
        firestore = self._get_firestore()

        collection_info = qdrant.get_collection(settings.qdrant_collection)
        chunk_count = collection_info.points_count

        docs = firestore.collection("documents").stream()
        doc_count = sum(1 for _ in docs)

        return {
            "document_count": doc_count,
            "chunk_count": chunk_count,
            "index_health": "healthy" if chunk_count > 0 else "empty",
        }


ingestion_service = IngestionService()