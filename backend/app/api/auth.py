from fastapi import APIRouter, Depends
from app.core.auth import verify_token, verify_admin
from app.models.user import AuthVerifyResponse

router = APIRouter()


@router.get("/auth/me", response_model=AuthVerifyResponse)
async def get_current_user(user: dict = Depends(verify_token)):
    return AuthVerifyResponse(
        uid=user["uid"],
        email=user["email"],
        role=user["role"],
    )


@router.get("/auth/check-admin", response_model=AuthVerifyResponse)
async def check_admin(user: dict = Depends(verify_admin)):
    return AuthVerifyResponse(
        uid=user["uid"],
        email=user["email"],
        role=user["role"],
    )