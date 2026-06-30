from fastapi import APIRouter, HTTPException, Response, Request, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from datetime import datetime, timezone
import uuid

from backend.app.core.database import get_write_session
from .dependencies import get_current_user
from ..domain.models import UserRegistrationRequest, UserLoginRequest, TokenResponseData, UserSummary, LLMSettingsUpdate, UserPreferencesUpdate
from ..application.service import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    register_user,
    authenticate_user,
    update_user_preferences,
    export_user_data
)

router = APIRouter(prefix="/auth", tags=["auth"])

def _create_envelope(data: Any = None) -> dict:
    """Standard API envelope formatter."""
    return {
        "success": True,
        "data": data,
        "meta": {
            "trace_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "version": "v1"
        }
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: UserRegistrationRequest, db: AsyncSession = Depends(get_write_session)):
    try:
        user = await register_user(request, db)
        data = {
            "user_id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "subscription_tier": user.subscription_tier
        }
        return _create_envelope(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(request: UserLoginRequest, response: Response, db: AsyncSession = Depends(get_write_session)):
    user = await authenticate_user(request, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "subscription_tier": user.subscription_tier}
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set Refresh Token as an HTTP-only, Secure, SameSite=Strict cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60
    )
    
    data = TokenResponseData(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        token_type="Bearer"
    )
    
    return _create_envelope(data.model_dump())

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Refresh token missing"
        )
    
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid refresh token payload"
            )
            
        access_token = create_access_token(
            data={"sub": user_id, "email": "mock@example.com", "subscription_tier": "free"}
        )
        return _create_envelope({
            "access_token": access_token, 
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid refresh token"
        )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    # Clears the cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    return None

@router.put("/preferences", status_code=status.HTTP_200_OK)
async def update_preferences(
    request: UserPreferencesUpdate,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session)
):
    try:
        updated_user = await update_user_preferences(current_user.user_id, request, db)
        return _create_envelope(updated_user.model_dump(mode="json"))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/export", summary="Export all user data for GDPR", status_code=status.HTTP_200_OK)
async def export_data(
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session)
):
    try:
        data = await export_user_data(current_user.user_id, db)
        return _create_envelope(data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/settings/llm", status_code=status.HTTP_200_OK)
async def get_llm_settings(
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session)
):
    from sqlalchemy import select
    from ..infrastructure.orm import UserModel
    
    result = await db.execute(select(UserModel).where(UserModel.id == current_user.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return _create_envelope({
        "provider": user.llm_provider,
        "api_key": user.llm_api_key
    })

@router.put("/settings/llm", status_code=status.HTTP_200_OK)
async def update_llm_settings(
    request: LLMSettingsUpdate,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session)
):
    from sqlalchemy import update
    from ..infrastructure.orm import UserModel
    
    await db.execute(
        update(UserModel)
        .where(UserModel.id == current_user.user_id)
        .values(
            llm_provider=request.provider,
            llm_api_key=request.api_key
        )
    )
    await db.commit()
    return _create_envelope({"status": "updated"})
