import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
import datetime
from datetime import timezone

from backend.app.main import app
from backend.features.user_auth.domain.models import UserSummary
from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user

def override_get_current_user():
    return UserSummary(
        user_id=uuid4(),
        email="test@example.com",
        display_name="Test User",
        subscription_tier="free",
        soul_color_hex="#e2e8f0",
        lite_mode_enabled=False
    )

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(autouse=True)
def overrides():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def mock_db_session():
    mock_db = AsyncMock()
    app.dependency_overrides[get_write_session] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_write_session, None)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_start_session(client, mock_db_session):
    with patch("backend.features.study_sessions.api.router.service.start_session", new_callable=AsyncMock) as mock_start:
        from backend.features.study_sessions.domain.models import SessionStatus

        mock_session = MagicMock()
        mock_session.id = uuid4()
        mock_session.user_id = uuid4()
        mock_session.title = "Study"
        mock_session.status = SessionStatus.ACTIVE.value
        mock_session.duration_seconds = 0
        mock_session.last_seen_at = datetime.datetime.now(timezone.utc)
        mock_session.created_at = datetime.datetime.now(timezone.utc)
        mock_session.updated_at = datetime.datetime.now(timezone.utc)
        mock_session.task_id = None

        mock_start.return_value = (mock_session, True)

        response = await client.post("/api/v1/sessions/start", json={"title": "Study"})
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_heartbeat(client, mock_db_session):
    with patch("backend.features.study_sessions.api.router.service.process_heartbeat", new_callable=AsyncMock) as mock_heartbeat:
        from backend.features.study_sessions.domain.models import SessionHeartbeatResponse, SessionStatus
        mock_heartbeat.return_value = SessionHeartbeatResponse(session_id=uuid4(), status=SessionStatus.ACTIVE.value, server_time=datetime.datetime.now(timezone.utc))

        response = await client.post(f"/api/v1/sessions/{uuid4()}/heartbeat")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_pause_session(client, mock_db_session):
    with patch("backend.features.study_sessions.api.router.service.pause_session", new_callable=AsyncMock) as mock_pause:
        from backend.features.study_sessions.domain.models import PauseResponse, SessionStatus
        mock_pause.return_value = PauseResponse(session_id=uuid4(), status=SessionStatus.PAUSED.value, paused_at=datetime.datetime.now(timezone.utc), pause_count=1)

        response = await client.post(f"/api/v1/sessions/{uuid4()}/pause")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_resume_session(client, mock_db_session):
    with patch("backend.features.study_sessions.api.router.service.resume_session", new_callable=AsyncMock) as mock_resume:
        from backend.features.study_sessions.domain.models import ResumeResponse, SessionStatus
        mock_resume.return_value = ResumeResponse(session_id=uuid4(), status=SessionStatus.ACTIVE.value, resumed_at=datetime.datetime.now(timezone.utc), pause_duration_seconds=10, total_paused_seconds=10)

        response = await client.post(f"/api/v1/sessions/{uuid4()}/resume")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_end_session(client, mock_db_session):
    with patch("backend.features.study_sessions.api.router.service.end_session", new_callable=AsyncMock) as mock_end:
        with patch("backend.features.study_sessions.api.router.BackgroundTasks.add_task"):
            from backend.features.study_sessions.domain.models import EndResponse, SessionStatus
            mock_end.return_value = EndResponse(session_id=uuid4(), status=SessionStatus.COMPLETED.value, actual_duration_seconds=1200, ended_at=datetime.datetime.now(timezone.utc), task_id=None, pause_count=0, total_paused_seconds=0)

            response = await client.post(f"/api/v1/sessions/{uuid4()}/end")
            assert response.status_code == 200
