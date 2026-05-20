from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_read_session
from ..domain.models import UserSummary
from ..application.service import decode_token
from ..infrastructure.orm import UserModel

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_read_session)
) -> UserSummary:
    """Dependency to extract and validate the JWT Bearer token and return the fresh UserSummary from DB."""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = decode_token(token)
        # Handle both "user_id" and "sub" for backward compatibility
        user_id_str = payload.get("sub") or payload.get("user_id")
        if not user_id_str:
            raise credentials_exception
            
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError, Exception):
        raise credentials_exception

    # Fetch fresh user data from database to ensure preferences are up to date
    user = await db.get(UserModel, user_id)
    if not user:
        raise credentials_exception

    return UserSummary(
        user_id=user.id,
        email=user.email,
        display_name=getattr(user, "display_name", "Explorer"),
        subscription_tier=getattr(user, "subscription_tier", "free"),
        soul_color_hex=getattr(user, "soul_color_hex", "#e2e8f0"),
        lite_mode_enabled=getattr(user, "lite_mode_enabled", False)
    )


async def get_current_user_ws(
    token: str = Query(..., description="JWT access token (used by EventSource / WebSocket clients that cannot set headers)"),
    db: AsyncSession = Depends(get_read_session),
) -> "UserSummary":
    """
    JWT dependency for SSE / WebSocket endpoints.

    The browser's native EventSource API cannot attach custom HTTP headers, so
    the token is passed as a query parameter instead of the Authorization header.
    Re-uses the same decode_token / DB-lookup logic as get_current_user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub") or payload.get("user_id")
        if not user_id_str:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError, Exception):
        raise credentials_exception

    user = await db.get(UserModel, user_id)
    if not user:
        raise credentials_exception

    return UserSummary(
        user_id=user.id,
        email=user.email,
        display_name=getattr(user, "display_name", "Explorer"),
        subscription_tier=getattr(user, "subscription_tier", "free"),
        soul_color_hex=getattr(user, "soul_color_hex", "#e2e8f0"),
        lite_mode_enabled=getattr(user, "lite_mode_enabled", False),
    )
