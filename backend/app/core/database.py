import os
from google.oauth2 import service_account
from google.cloud import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from app.config import settings

_db = None


def get_firestore() -> firestore.Client:
    global _db
    if _db is None:
        cred_path = settings.firebase_credentials_path
        if not os.path.isabs(cred_path):
            cred_path = os.path.abspath(cred_path)
            
        if os.path.exists(cred_path):
            credentials = service_account.Credentials.from_service_account_file(cred_path)
            _db = firestore.Client(project=settings.firebase_project_id, credentials=credentials)
        else:
            _db = firestore.Client(project=settings.firebase_project_id)
    return _db