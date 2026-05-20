from abc import ABC, abstractmethod
from uuid import UUID
from datetime import datetime

from .models import (
    SessionStartRequest,
    SessionResponse,
    SessionStatus
)


class SessionRepository(ABC):
    """
    Abstract repository interface for Study Sessions.
    """

    @abstractmethod
    async def create(self, data: SessionStartRequest, user_id: UUID, session) -> SessionResponse:
        """Create a new study session."""
        ...

    @abstractmethod
    async def get_by_id(self, id: UUID, user_id: UUID, session) -> SessionResponse | None:
        """Get a session by ID for a specific user."""
        ...

    @abstractmethod
    async def get_by_client_session_id(self, client_session_id: UUID, user_id: UUID, session) -> SessionResponse | None:
        """Lookup a session by its client-provided idempotency key."""
        ...

    @abstractmethod
    async def get_active_or_paused_session(self, user_id: UUID, session) -> SessionResponse | None:
        """Get the user's currently ACTIVE or PAUSED session, if any."""
        ...

    @abstractmethod
    async def update_last_seen(self, id: UUID, user_id: UUID, timestamp: datetime, session) -> None:
        """Update the last_seen_at timestamp for heartbeat."""
        ...

    @abstractmethod
    async def list_active(self, user_id: UUID, cursor: str | None, limit: int, session) -> list[SessionResponse]:
        """List active sessions (not fully implemented in contract but required by template)."""
        ...

    @abstractmethod
    async def soft_delete(self, id: UUID, user_id: UUID, session) -> bool:
        """Soft delete a session."""
        ...
