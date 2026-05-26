from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class SearchFilter(BaseModel):
    doc_type: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    filters: Optional[SearchFilter] = None
    top_k: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    chunk_id: str
    text: str
    score: float
    doc_name: str
    doc_type: str
    page: int
    company: str
    date: str


class SearchResponse(BaseModel):
    results: List[SearchResult]
    latency_ms: float
    query_id: str