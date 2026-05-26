from fastapi import APIRouter, Depends
from app.models.search import SearchRequest, SearchResponse
from app.services.search import hybrid_search_service
from app.core.auth import optional_auth
from app.core.database import get_firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
import uuid

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    user: dict | None = Depends(optional_auth),
):
    filter_dict = None
    if request.filters:
        filter_dict = request.filters.model_dump(exclude_none=True)

    result = await hybrid_search_service.search(
        query=request.query,
        filters=filter_dict,
        top_k=request.top_k,
    )

    if user:
        db = get_firestore()
        query_id = result["query_id"]
        queries_ref = (
            db.collection("users")
            .document(user["uid"])
            .collection("queries")
            .document(query_id)
        )
        queries_ref.set({
            "text": request.query,
            "filters": filter_dict or {},
            "result_count": len(result["results"]),
            "top_result_doc": result["results"][0]["doc_name"] if result["results"] else "",
            "starred": False,
            "created_at": SERVER_TIMESTAMP,
        })

    return SearchResponse(**result)