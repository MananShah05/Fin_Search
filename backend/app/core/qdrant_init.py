"""
Ensures the Qdrant collection exists on application startup.
Called once during FastAPI lifespan so searches/ingestion never hit a
'collection not found' error on a fresh Qdrant instance.
"""
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def ensure_collection() -> None:
    """Create the finsearch_chunks collection if it does not already exist."""
    client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)

    existing = [c.name for c in client.get_collections().collections]

    if settings.qdrant_collection in existing:
        logger.info("Qdrant collection '%s' already exists — skipping creation.", settings.qdrant_collection)
        return

    client.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=VectorParams(
            size=settings.embedding_dimension,
            distance=Distance.COSINE,
        ),
    )
    logger.info("Created Qdrant collection '%s' (dim=%d, cosine).", settings.qdrant_collection, settings.embedding_dimension)


def load_bm25_from_qdrant() -> None:
    """Scroll through all points in Qdrant and populate the BM25 index."""
    from app.services.bm25 import bm25_index
    client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)

    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in existing:
        logger.info("Qdrant collection '%s' does not exist — skipping BM25 load.", settings.qdrant_collection)
        return

    logger.info("Initializing in-memory BM25 index from Qdrant...")
    
    offset = None
    corpus = []
    doc_ids = []

    while True:
        points, next_offset = client.scroll(
            collection_name=settings.qdrant_collection,
            limit=100,
            with_payload=True,
            with_vectors=False,
            offset=offset,
        )
        for point in points:
            text = point.payload.get("text") if point.payload else None
            if text:
                corpus.append(text)
                doc_ids.append(str(point.id))
        
        offset = next_offset
        if offset is None:
            break

    if corpus:
        bm25_index.build(corpus, doc_ids)
        logger.info("Successfully loaded %d chunks into BM25 sparse index from Qdrant.", len(corpus))
    else:
        logger.info("No chunks found in Qdrant. BM25 sparse index is empty.")
