from fastapi import APIRouter, Query
from app.services.autocomplete import autocomplete_service

router = APIRouter()


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(default=5, ge=1, le=10),
):
    suggestions = autocomplete_service.suggest(q, max_results=limit)
    return {"suggestions": suggestions}