from typing import List, Tuple
from app.services.embedding import embedding_service
from app.services.bm25 import bm25_index
from app.config import settings


class HybridSearchService:
    def __init__(self):
        self._qdrant_client = None

    def _get_qdrant(self):
        if self._qdrant_client is None:
            from qdrant_client import QdrantClient
            self._qdrant_client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
            )
        return self._qdrant_client

    async def search(
        self,
        query: str,
        filters: dict | None = None,
        top_k: int = 10,
    ) -> list[dict]:
        import time
        import uuid

        query_id = str(uuid.uuid4())
        start = time.time()

        query_vector = embedding_service.encode_query(query)

        qdrant = self._get_qdrant()

        qdrant_filter = None
        if filters:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            should_conditions = []
            if filters.get("doc_type"):
                for dt in filters["doc_type"]:
                    should_conditions.append(
                        FieldCondition(key="doc_type", match=MatchValue(value=dt))
                    )
            if should_conditions:
                qdrant_filter = Filter(should=should_conditions)

        dense_hits = qdrant.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vector,
            limit=settings.dense_top_k,
            query_filter=qdrant_filter,
        )

        dense_scores = {h.id: h.score for h in dense_hits}
        dense_payloads = {h.id: h.payload for h in dense_hits}
        dense_ids = set(dense_scores.keys())

        bm25_hits = bm25_index.search(query, top_k=settings.sparse_top_k)
        bm25_scores = dict(bm25_hits)
        bm25_ids = set(bm25_scores.keys())

        all_ids = dense_ids | bm25_ids

        rrf_scores = {}
        dense_ranked = {doc_id: rank for rank, doc_id in enumerate(sorted(dense_ids, key=lambda x: dense_scores.get(x, 0), reverse=True))}
        bm25_ranked = {doc_id: rank for rank, doc_id in enumerate(sorted(bm25_ids, key=lambda x: bm25_scores.get(x, 0), reverse=True))}

        for doc_id in all_ids:
            dense_rank = dense_ranked.get(doc_id, len(dense_ids))
            bm25_rank = bm25_ranked.get(doc_id, len(bm25_ids))

            dense_rrf = 1.0 / (60 + dense_rank)
            sparse_rrf = 1.0 / (60 + bm25_rank)

            rrf_scores[doc_id] = settings.rrf_alpha * dense_rrf + (1 - settings.rrf_alpha) * sparse_rrf

        sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        # Fetch payloads for any sparse-only hits that were not in dense search results
        missing_ids = [doc_id for doc_id, _ in sorted_results if doc_id not in dense_payloads]
        if missing_ids:
            try:
                retrieved = qdrant.retrieve(
                    collection_name=settings.qdrant_collection,
                    ids=missing_ids,
                    with_payload=True,
                    with_vectors=False,
                )
                for point in retrieved:
                    dense_payloads[point.id] = point.payload
            except Exception as e:
                import logging
                logging.getLogger(__name__).error("Failed to retrieve missing payloads from Qdrant: %s", e)

        results = []
        for doc_id, score in sorted_results:
            payload = dense_payloads.get(doc_id) or {}
            results.append({
                "chunk_id": doc_id,
                "text": payload.get("text", ""),
                "score": round(score, 4),
                "doc_name": payload.get("doc_name", ""),
                "doc_type": payload.get("doc_type", "other"),
                "page": payload.get("page", 0),
                "company": payload.get("company", ""),
                "date": payload.get("date", ""),
            })

        latency_ms = round((time.time() - start) * 1000, 2)

        return {
            "results": results,
            "latency_ms": latency_ms,
            "query_id": query_id,
        }


hybrid_search_service = HybridSearchService()