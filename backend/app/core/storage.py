import os
from app.config import settings

class LocalStorage:
    def upload(self, file_content: bytes, doc_id: str, filename: str):
        path = os.path.join(settings.local_storage_path, doc_id)
        os.makedirs(path, exist_ok=True)
        file_path = os.path.join(path, filename)
        with open(file_path, "wb") as f:
            f.write(file_content)
            
    def download(self, doc_id: str, filename: str) -> bytes:
        file_path = os.path.join(settings.local_storage_path, doc_id, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            return f.read()

class GCSStorage:
    def __init__(self):
        self._bucket = None
        
    def _get_bucket(self):
        if self._bucket is None:
            from google.cloud import storage
            client = storage.Client(project=settings.firebase_project_id)
            self._bucket = client.bucket(settings.gcs_bucket)
        return self._bucket
        
    def upload(self, file_content: bytes, doc_id: str, filename: str):
        bucket = self._get_bucket()
        blob = bucket.blob(f"pdfs/{doc_id}/{filename}")
        blob.upload_from_string(file_content)
        
    def download(self, doc_id: str, filename: str) -> bytes:
        bucket = self._get_bucket()
        blob = bucket.blob(f"pdfs/{doc_id}/{filename}")
        if not blob.exists():
            raise FileNotFoundError(f"File not found in GCS: pdfs/{doc_id}/{filename}")
        return blob.download_as_bytes()

def get_storage():
    if settings.storage_provider == "local":
        return LocalStorage()
    return GCSStorage()