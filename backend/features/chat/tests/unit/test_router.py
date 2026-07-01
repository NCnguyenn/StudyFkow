import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4

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
@patch("backend.features.chat.api_router.ask_second_brain", new_callable=AsyncMock)
async def test_ask_chat(mock_ask, client, mock_db_session):
    mock_ask.return_value = "Mock RAG response"

    response = await client.post("/api/v1/chat/ask", json={"query": "Hello"})
    assert response.status_code == 200
    assert response.json()["answer"] == "Mock RAG response"
