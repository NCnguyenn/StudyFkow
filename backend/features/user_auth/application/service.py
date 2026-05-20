from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Mapping
import os
from uuid import UUID

# Password Hashing setup with Argon2id
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT Configuration (Fallbacks to hardcoded for demo/mock)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def get_password_hash(password: str) -> str:
    """Hashes a password using Argon2id"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2id hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: Mapping[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates an Access Token with 15 minutes default expiry"""
    to_encode = dict(data)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Mapping[str, Any]) -> str:
    """Generates a Refresh Token with a default 7-day expiry"""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = dict(data)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict[str, Any]:
    """Decodes a JWT and returns the payload"""
    return dict(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..infrastructure.repository import UserRepository
from ..infrastructure.orm import UserModel
from ..domain.models import UserRegistrationRequest, UserLoginRequest, UserPreferencesUpdate, UserSummary

async def register_user(request: UserRegistrationRequest, db: AsyncSession) -> UserModel:
    existing = await UserRepository.get_by_email(request.email, db)
    if existing:
        raise ValueError("Email already registered")

    hashed_password = get_password_hash(request.password)
    user = UserModel(
        email=request.email,
        hashed_password=hashed_password,
        display_name=request.display_name,
        timezone=request.timezone,
    )
    user = await UserRepository.create(user, db)
    await db.commit()
    return user

async def authenticate_user(request: UserLoginRequest, db: AsyncSession) -> Optional[UserModel]:
    user = await UserRepository.get_by_email(request.email, db)
    if not user:
        return None
    if not verify_password(request.password, user.hashed_password):
        return None
    return user

async def update_user_preferences(user_id: UUID, prefs: UserPreferencesUpdate, db: AsyncSession) -> UserSummary:
    user = await db.get(UserModel, user_id)
    if not user:
        raise ValueError("User not found")
        
    if prefs.display_name is not None:
        user.display_name = prefs.display_name
    if prefs.soul_color_hex is not None:
        user.soul_color_hex = prefs.soul_color_hex
    if prefs.lite_mode_enabled is not None:
        user.lite_mode_enabled = prefs.lite_mode_enabled
        
    await db.commit()
    await db.refresh(user)
    
    return UserSummary(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        subscription_tier=user.subscription_tier,
        soul_color_hex=getattr(user, "soul_color_hex", "#e2e8f0"),
        lite_mode_enabled=getattr(user, "lite_mode_enabled", False)
    )

async def export_user_data(user_id: UUID, db: AsyncSession) -> dict:
    from backend.features.task_management.infrastructure.orm import TaskModel
    from backend.features.study_sessions.infrastructure.orm import SessionModel

    user = await db.get(UserModel, user_id)
    if not user:
        raise ValueError("User not found")

    tasks_result = await db.execute(select(TaskModel).where(TaskModel.user_id == user_id))
    tasks = tasks_result.scalars().all()
    
    sessions_result = await db.execute(select(SessionModel).where(SessionModel.user_id == user_id))
    sessions = sessions_result.scalars().all()
    
    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "timezone": user.timezone,
            "soul_color_hex": getattr(user, "soul_color_hex", "#e2e8f0"),
            "lite_mode_enabled": getattr(user, "lite_mode_enabled", False)
        },
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "completion_status": getattr(t, "completion_status", "INCOMPLETE")
            } for t in tasks
        ],
        "study_sessions": [
            {
                "id": str(s.id),
                "status": s.status,
                "duration_seconds": s.duration_seconds,
                "created_at": s.created_at.isoformat() if s.created_at else None
            } for s in sessions
        ]
    }
