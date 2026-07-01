import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4

from backend.app.main import app
from backend.features.user_auth.domain.models import UserSummary
from backend.features.user_auth.api.dependencies import get_current_user_ws

def override_get_current_user_ws():
    return UserSummary(
        user_id=uuid4(),
        email="test@example.com",
        display_name="Test User",
        subscription_tier="free",
        soul_color_hex="#e2e8f0",
        lite_mode_enabled=False
    )

app.dependency_overrides[get_current_user_ws] = override_get_current_user_ws

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
@patch("backend.features.realtime.api_router._event_generator")
async def test_stream_events(mock_generator, client):
    async def mock_gen(*args, **kwargs):
        yield "data: {\"type\": \"ping\"}\n\n"

    mock_generator.side_effect = mock_gen

    response = await client.get("/api/v1/realtime/stream")
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["Content-Type"]
