from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import search, autocomplete, ingest, documents, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    from app.core.qdrant_init import ensure_collection, load_bm25_from_qdrant
    ensure_collection()
    load_bm25_from_qdrant()
    yield
    # --- Shutdown (nothing to clean up for now) ---


app = FastAPI(
    title="FinSearch API",
    description="Semantic search engine for financial reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix, tags=["auth"])
app.include_router(search.router, prefix=settings.api_prefix, tags=["search"])
app.include_router(autocomplete.router, prefix=settings.api_prefix, tags=["autocomplete"])
app.include_router(ingest.router, prefix=settings.api_prefix, tags=["ingest"])
app.include_router(documents.router, prefix=settings.api_prefix, tags=["documents"])


@app.get("/health")
async def health():
    return {"status": "ok"}