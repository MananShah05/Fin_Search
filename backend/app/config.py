from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    firebase_credentials_path: str = "./service-account.json"
    firebase_project_id: str = ""
    firebase_api_key: str = ""

    qdrant_mode: str = "local"  # "local" (no Docker) or "server" (Docker/cloud)
    qdrant_path: str = "./qdrant_data"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "finsearch_chunks"

    storage_provider: str = "local"  # "local" or "gcs"
    local_storage_path: str = "./data/pdfs"
    gcs_bucket: str = "finsearch-pdfs"

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    chunk_size: int = 512
    chunk_overlap: int = 64
    dense_top_k: int = 50
    sparse_top_k: int = 50
    rrf_alpha: float = 0.6
    final_top_k: int = 10

    api_prefix: str = "/api/v1"
    log_level: str = "info"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()