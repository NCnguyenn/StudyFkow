import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from backend.features.study_sessions.application.service import process_heartbeat, pause_session, resume_session, end_session, get_session_by_id
from backend.features.study_sessions.domain.exceptions import SessionNotFoundError, SessionNotActiveError, SessionAlreadyEndedError, SessionNotPausedError
from backend.features.study_sessions.infrastructure.orm import SessionModel
from backend.features.study_sessions.domain.models import SessionStatus

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_process_heartbeat(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.ACTIVE.value,
        title="Test", duration_seconds=0, last_seen_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)
    mock_repo_cls.update_last_seen = AsyncMock()
    mock_repo_cls.get_total_paused_seconds = AsyncMock(return_value=0)
    mock_repo_cls.get_pause_count = AsyncMock(return_value=0)

    result = await process_heartbeat(session_id, user_id, db_mock)

    assert result.session_id == session_id
    mock_repo_cls.update_last_seen.assert_called_once()
    db_mock.commit.assert_called_once()

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_pause_session(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.ACTIVE.value,
        title="Test", duration_seconds=0, created_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc)
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)
    mock_repo_cls.get_pause_count = AsyncMock(return_value=0)
    mock_repo_cls.update_status_and_last_seen = AsyncMock()
    mock_repo_cls.record_pause = AsyncMock()

    result = await pause_session(session_id, user_id, db_mock)

    assert result.status == SessionStatus.PAUSED
    mock_repo_cls.update_status_and_last_seen.assert_called_once()
    mock_repo_cls.record_pause.assert_called_once()
    db_mock.commit.assert_called_once()

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_pause_session_already_paused(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.PAUSED.value
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)

    with pytest.raises(SessionNotActiveError):
        await pause_session(session_id, user_id, db_mock)

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_resume_session(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.PAUSED.value,
        title="Test", duration_seconds=0, created_at=datetime.now(timezone.utc)
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)
    class MockPause:
        def __init__(self):
            self.id = uuid4()
            self.resumed_at = None
            self.created_at = datetime.now(timezone.utc)
    mock_repo_cls.get_open_pause = AsyncMock(return_value=MockPause())
    mock_repo_cls.update_status_and_last_seen = AsyncMock()
    mock_repo_cls.record_resume = AsyncMock()
    mock_repo_cls.get_total_paused_seconds = AsyncMock(return_value=0)

    result = await resume_session(session_id, user_id, db_mock)

    assert result.status == SessionStatus.ACTIVE
    mock_repo_cls.update_status_and_last_seen.assert_called_once()
    mock_repo_cls.record_resume.assert_called_once()
    db_mock.commit.assert_called_once()

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_end_session(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.ACTIVE.value,
        title="Test", duration_seconds=0, created_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc)
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)
    mock_repo_cls.get_open_pause = AsyncMock(return_value=None)
    mock_repo_cls.get_total_paused_seconds = AsyncMock(return_value=0)
    mock_repo_cls.get_pause_count = AsyncMock(return_value=0)
    mock_repo_cls.end_session = AsyncMock()

    result = await end_session(session_id, user_id, db_mock)

    assert result.status == SessionStatus.COMPLETED
    mock_repo_cls.end_session.assert_called_once()
    db_mock.commit.assert_called_once()

@pytest.mark.asyncio
@patch("backend.features.study_sessions.application.service.StudySessionRepository")
async def test_get_session_by_id(mock_repo_cls):
    db_mock = AsyncMock()
    user_id = uuid4()
    session_id = uuid4()

    mock_session = SessionModel(
        id=session_id, user_id=user_id, status=SessionStatus.ACTIVE.value,
        title="Test", duration_seconds=0, created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc), last_seen_at=datetime.now(timezone.utc),
        task_id=None
    )

    mock_repo_cls.get_by_id = AsyncMock(return_value=mock_session)

    result = await get_session_by_id(session_id, user_id, db_mock)

    assert result.id == session_id
    assert result.status == SessionStatus.ACTIVE
