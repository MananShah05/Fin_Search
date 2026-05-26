import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer(auto_error=False)
_app_initialized = False


def _init_firebase():
    global _app_initialized
    if not _app_initialized:
        try:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred, {
                "projectId": settings.firebase_project_id,
            })
        except Exception:
            try:
                firebase_admin.initialize_app()
            except Exception:
                pass
        _app_initialized = True


async def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    _init_firebase()
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "role": "analyst",
        }
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")


async def verify_admin(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict:
    user = await verify_token(credentials)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def optional_auth(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict | None:
    if credentials is None:
        return None
    try:
        return await verify_token(credentials)
    except HTTPException:
        return None