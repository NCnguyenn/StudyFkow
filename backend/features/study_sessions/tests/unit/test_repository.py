import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

from backend.features.study_sessions.infrastructure.repository import StudySessionRepository
from backend.features.study_sessions.infrastructure.orm import SessionModel, SessionPauseModel
from backend.features.study_sessions.domain.models import SessionStatus
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_repository_get_by_id():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_session = SessionModel(id=uuid4(), user_id=uuid4(), status=SessionStatus.ACTIVE.value)
    mock_result.scalar_one_or_none.return_value = mock_session
    mock_result.scalars().first.return_value = mock_session
    mock_db.execute.return_value = mock_result

    result = await StudySessionRepository.get_by_id(mock_session.id, mock_session.user_id, mock_db)
    assert result == mock_session

@pytest.mark.asyncio
async def test_repository_get_by_client_session_id():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_session = SessionModel(id=uuid4(), user_id=uuid4())
    mock_result.scalar_one_or_none.return_value = mock_session
    mock_result.scalars().first.return_value = mock_session
    mock_db.execute.return_value = mock_result

    # client_session_id in our repository maps to the `id` field since there's no actual client_session_id
    result = await StudySessionRepository.get_by_client_session_id(mock_session.id, mock_session.user_id, mock_db)
    assert result == mock_session

@pytest.mark.asyncio
async def test_repository_create():
    mock_db = AsyncMock()
    session = SessionModel(id=uuid4(), user_id=uuid4())

    result = await StudySessionRepository.create(session, mock_db)
    assert result == session
    mock_db.add.assert_called_once_with(session)

@pytest.mark.asyncio
async def test_repository_update_last_seen():
    mock_db = AsyncMock()
    now = datetime.now(timezone.utc)

    await StudySessionRepository.update_last_seen(uuid4(), uuid4(), now, mock_db)
    mock_db.execute.assert_called_once()

@pytest.mark.asyncio
async def test_repository_update_status_and_last_seen():
    mock_db = AsyncMock()
    now = datetime.now(timezone.utc)

    await StudySessionRepository.update_status_and_last_seen(uuid4(), uuid4(), SessionStatus.PAUSED.value, now, db=mock_db, duration_delta=0)
    assert mock_db.execute.call_count == 1

@pytest.mark.asyncio
async def test_repository_end_session():
    mock_db = AsyncMock()
    now = datetime.now(timezone.utc)

    await StudySessionRepository.end_session(uuid4(), uuid4(), now, 1200, mock_db)
    mock_db.execute.assert_called_once()

@pytest.mark.asyncio
async def test_repository_record_pause():
    mock_db = AsyncMock()

    await StudySessionRepository.record_pause(uuid4(), mock_db)
    mock_db.add.assert_called_once()

@pytest.mark.asyncio
async def test_repository_get_open_pause():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_pause = SessionPauseModel(id=uuid4(), session_id=uuid4())
    mock_result.scalars().first.return_value = mock_pause
    mock_db.execute.return_value = mock_result

    result = await StudySessionRepository.get_open_pause(mock_pause.session_id, mock_db)
    assert result == mock_pause

@pytest.mark.asyncio
async def test_repository_record_resume():
    mock_db = AsyncMock()

    await StudySessionRepository.record_resume(uuid4(), 60, mock_db)
    mock_db.execute.assert_called_once()

@pytest.mark.asyncio
async def test_repository_get_pause_count():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 2
    mock_result.scalar.return_value = 2
    mock_db.execute.return_value = mock_result

    result = await StudySessionRepository.get_pause_count(uuid4(), mock_db)
    assert result == 2

@pytest.mark.asyncio
async def test_repository_get_total_paused_seconds():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = 120
    mock_result.scalar.return_value = 120
    mock_db.execute.return_value = mock_result

    result = await StudySessionRepository.get_total_paused_seconds(uuid4(), mock_db)
    assert result == 120
