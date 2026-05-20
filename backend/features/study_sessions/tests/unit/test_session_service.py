import pytest
from uuid import uuid4
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from backend.features.study_sessions.domain.models import SessionStartRequest, SessionStatus
from backend.features.study_sessions.domain.exceptions import ActiveSessionExistsError
from backend.features.study_sessions.application.service import start_session
from backend.features.study_sessions.infrastructure.repository import StudySessionRepository
from backend.features.study_sessions.infrastructure.orm import SessionModel


@pytest.mark.asyncio
async def test_session_start_idempotency():
    """
    Test that starting a session with an existing client_session_id
    returns the existing session (idempotency) rather than creating a new one
    or raising an ActiveSessionExistsError.
    """
    existing_session = SessionModel(
        id=uuid4(),
        user_id=uuid4(),
        title="Existing Session",
        status="ACTIVE",
        duration_seconds=0,
        last_seen_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    with patch.object(StudySessionRepository, "get_by_client_session_id", new_callable=AsyncMock) as mock_get_by_client:
        mock_get_by_client.return_value = existing_session
        
        request = SessionStartRequest(client_session_id=existing_session.id, title="Test Topic")
        user_id = existing_session.user_id
        
        # Idempotent call - should return the existing session without raising ActiveSessionExistsError
        result, is_new = await start_session(user_id=user_id, request=request, db=AsyncMock())
        
        # Assert
        assert is_new is False
        assert result.id == existing_session.id
        assert result.title == existing_session.title
        mock_get_by_client.assert_called_once()


@pytest.mark.asyncio
async def test_session_start_fails_if_active_session_exists():
    """
    Test that a new session cannot be started if the user already has an
    ACTIVE or PAUSED session. It should raise ActiveSessionExistsError.
    """
    active_session = SessionModel(
        id=uuid4(),
        user_id=uuid4(),
        title="Another Session",
        status="ACTIVE",
        duration_seconds=0,
        last_seen_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    with patch.object(StudySessionRepository, "get_by_client_session_id", new_callable=AsyncMock) as mock_get_by_client, \
         patch.object(StudySessionRepository, "find_active_or_paused", new_callable=AsyncMock) as mock_find_active_or_paused:
        
        mock_get_by_client.return_value = None
        mock_find_active_or_paused.return_value = active_session
        
        request = SessionStartRequest(client_session_id=uuid4(), title="New Topic")
        user_id = active_session.user_id
        
        with pytest.raises(ActiveSessionExistsError):
            await start_session(user_id=user_id, request=request, db=AsyncMock())
            
        mock_get_by_client.assert_called_once()
        mock_find_active_or_paused.assert_called_once()
