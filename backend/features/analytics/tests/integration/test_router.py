import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4

from backend.app.main import app
from backend.features.user_auth.domain.models import UserSummary
from backend.app.core.database import get_write_session, get_read_session
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

@pytest.fixture(autouse=True)
def overrides():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def mock_db_session():
    mock_db = AsyncMock()
    app.dependency_overrides[get_write_session] = lambda: mock_db
    app.dependency_overrides[get_read_session] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_write_session, None)
    app.dependency_overrides.pop(get_read_session, None)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
@patch("backend.features.analytics.api.router.service.get_summary")
async def test_get_summary(mock_get_summary, client, mock_db_session):
    from backend.features.analytics.domain import AnalyticsSummary, TaskMastery
    mock_get_summary.return_value = AnalyticsSummary(
        total_minutes_today=20.0,
        total_minutes_this_week=60.0,
        current_streak_days=1,
        total_sessions_completed=3,
        daily_trend=[],
        task_breakdown=[],
        task_mastery=TaskMastery(on_time=1, late=0, incomplete=0),
        subject_balance=[]
    )

    response = await client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    assert response.json()["total_minutes_today"] == 20.0

@pytest.mark.asyncio
@patch("backend.features.analytics.api.router.service.get_active_insights")
async def test_get_active_insights(mock_get_insights, client, mock_db_session):
    from backend.features.analytics.domain import InsightResponse
    mock_get_insights.return_value = [
        InsightResponse(id=str(uuid4()), insight_type="RULE_BASED", content="Test", feedback_score=0)
    ]

    response = await client.get("/api/v1/insights")
    assert response.status_code == 200
    assert len(response.json()) == 1

@pytest.mark.asyncio
@patch("backend.features.analytics.api.router.service.update_insight_feedback")
async def test_update_insight_feedback(mock_update, client, mock_db_session):
    response = await client.post(f"/api/v1/insights/{uuid4()}/feedback", json={"score": 1, "dismiss": True})
    assert response.status_code == 200

@pytest.mark.asyncio
@patch("backend.features.analytics.api.router.service.get_summary")
@patch("backend.features.analytics.api.router.generate_llm_insight.delay")
async def test_generate_llm_insight(mock_delay, mock_get_summary, client, mock_db_session):
    from backend.features.analytics.domain import AnalyticsSummary, TaskMastery
    mock_get_summary.return_value = AnalyticsSummary(
        total_minutes_today=20.0,
        total_minutes_this_week=60.0,
        current_streak_days=1,
        total_sessions_completed=10,
        daily_trend=[],
        task_breakdown=[],
        task_mastery=TaskMastery(on_time=1, late=0, incomplete=0),
        subject_balance=[]
    )

    response = await client.post("/api/v1/insights/generate-llm")
    assert response.status_code == 202
    assert response.json()["success"] is True
