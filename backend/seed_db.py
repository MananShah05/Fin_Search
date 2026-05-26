import os
import sys
import uuid
from datetime import datetime

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.core.database import get_firestore
from app.services.embedding import embedding_service
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

# Sample financial text chunks matching suggested queries
SEED_DATA = [
    {
        "filename": "Apple_10K_2023.pdf",
        "company": "Apple Inc.",
        "date": "2023-10-27",
        "type": "10-K",
        "page": 34,
        "text": (
            "For the fiscal year ended September 30, 2023, Apple Inc. reported total net sales (revenue) "
            "of $383,285 million, representing a slight decrease compared to total net sales of $394,328 million "
            "in the fiscal year 2022. Net income for the fiscal year 2023 was $96,995 million, compared to $99,803 million "
            "in the prior year. The difference between gross revenue (net sales) and net income is primarily driven by cost "
            "of sales of $214,137 million, operating expenses of $54,847 million (comprising research and development expenses "
            "of $29,915 million and selling, general and administrative expenses of $24,932 million), and an income tax provision "
            "of $16,741 million."
        )
    },
    {
        "filename": "Microsoft_10K_2023.pdf",
        "company": "Microsoft Corp.",
        "date": "2023-07-27",
        "type": "10-K",
        "page": 45,
        "text": (
            "Microsoft Corporation's Cash Flow from Operations for the fiscal year ended June 30, 2023, was a robust "
            "$87,582 million, showing a strong cash generation engine from its productivity business and intelligent cloud. "
            "This represents a highly efficient operation compared to operating cash flows of $89,035 million in fiscal year 2022. "
            "The net cash provided by operating activities remains the primary source of cash used for investing activities of "
            "$22,680 million (including property and equipment additions) and financing activities of $63,907 million (comprising "
            "share repurchases and cash dividends)."
        )
    },
    {
        "filename": "Tesla_10K_2023.pdf",
        "company": "Tesla Inc.",
        "date": "2024-01-26",
        "type": "10-K",
        "page": 52,
        "text": (
            "Tesla Inc. reported total liabilities of $43,009 million and total stockholders' equity of $62,634 million "
            "as of December 31, 2023. This yields a debt to equity ratio (calculated as total liabilities divided by stockholders' equity) "
            "of approximately 0.69. This key financial leverage ratio indicates a highly conservative capital structure and strong long-term "
            "solvency position, leveraging less debt compared to equity to fund its massive gigafactory expansions, vehicle platform developments, "
            "and autonomous driving R&D."
        )
    }
]

def seed():
    print("--- DATABASE SEEDING START ---")
    
    # 1. Initialize Clients
    db = get_firestore()
    qdrant = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    
    # 2. Reset / Recreate Qdrant Collection
    print(f"Recreating Qdrant collection: {settings.qdrant_collection}...")
    existing = [c.name for c in qdrant.get_collections().collections]
    if settings.qdrant_collection in existing:
        qdrant.delete_collection(settings.qdrant_collection)
        
    qdrant.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=VectorParams(
            size=settings.embedding_dimension,
            distance=Distance.COSINE,
        ),
    )
    print("Qdrant collection created.")

    # 3. Clean Firestore Collection
    print("Cleaning Firestore 'documents' collection...")
    docs = db.collection("documents").stream()
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count += 1
    if deleted_count:
        print(f"Deleted {deleted_count} stale documents from Firestore.")
    
    # 4. Generate Embeddings & Insert
    print("Encoding passages and inserting points/documents...")
    points = []
    
    for item in SEED_DATA:
        doc_id = str(uuid.uuid4())
        chunk_id = str(uuid.uuid4())
        
        # Ingest to Firestore
        doc_ref = db.collection("documents").document(doc_id)
        doc_ref.set({
            "name": item["filename"],
            "type": item["type"],
            "company": item["company"],
            "date": item["date"],
            "chunk_count": 1,
            "storage_path": f"local://pdfs/{doc_id}/{item['filename']}",
            "status": "indexed",
            "ingested_at": datetime.utcnow(),
        })
        print(f"Inserted doc metadata for {item['filename']} (ID: {doc_id})")
        
        # Generate embedding
        vector = embedding_service.encode_query(item["text"])
        
        # Create Point
        points.append(PointStruct(
            id=chunk_id,
            vector=vector,
            payload={
                "doc_id": doc_id,
                "doc_name": item["filename"],
                "doc_type": item["type"],
                "company": item["company"],
                "date": item["date"],
                "page": item["page"],
                "text": item["text"],
            }
        ))
        
    # Upsert Qdrant Points
    qdrant.upsert(
        collection_name=settings.qdrant_collection,
        points=points,
    )
    print(f"Successfully loaded {len(points)} vectors into Qdrant.")
    print("--- DATABASE SEEDING COMPLETED ---")

if __name__ == "__main__":
    seed()
