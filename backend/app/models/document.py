from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentModel(BaseModel):
    id: str = ""
    name: str
    type: str = "other"
    company: str = ""
    date: str = ""
    chunk_count: int = 0
    storage_path: str = ""
    status: str = "pending"
    ingested_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: str
    name: str
    type: str
    company: str
    date: str
    chunk_count: int
    status: str
    ingested_at: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class IngestResponse(BaseModel):
    job_id: str
    status: str
    message: str


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str
    chunks_processed: int
    chunks_total: int


class CorpusStats(BaseModel):
    document_count: int
    chunk_count: int
    index_health: str