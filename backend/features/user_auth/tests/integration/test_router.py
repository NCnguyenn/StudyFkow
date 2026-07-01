import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

from backend.app.main import app
from backend.features.user_auth.infrastructure.orm import UserModel
from backend.features.user_auth.domain.models import UserSummary
from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user
from backend.features.user_auth.application.service import get_password_hash

# Mock DB Session
@pytest.fixture
def mock_db_session():
    mock_db = AsyncMock()
    app.dependency_overrides[get_write_session] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_write_session, None)

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
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_register(client, mock_db_session):
    with patch("backend.features.user_auth.api.router.register_user") as mock_register_user:
        mock_user = MagicMock()
        mock_user.id = uuid4()
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test"
        mock_user.subscription_tier = "free"
        mock_register_user.return_value = mock_user

        payload = {
            "email": "test@example.com",
            "password": "securepassword",
            "display_name": "Test",
            "timezone": "UTC"
        }

        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 201
        assert response.json()["success"] is True
        assert response.json()["data"]["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_login(client, mock_db_session):
    with patch("backend.features.user_auth.api.router.authenticate_user") as mock_auth_user:
        mock_user = MagicMock()
        mock_user.id = uuid4()
        mock_user.email = "test@example.com"
        mock_user.subscription_tier = "free"
        mock_auth_user.return_value = mock_user

        payload = {
            "email": "test@example.com",
            "password": "securepassword"
        }

        response = await client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 200
        assert "access_token" in response.json()["data"]
        assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_invalid(client, mock_db_session):
    with patch("backend.features.user_auth.api.router.authenticate_user") as mock_auth_user:
        mock_auth_user.return_value = None

        payload = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }

        response = await client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh(client):
    from backend.features.user_auth.application.service import create_refresh_token

    refresh_token = create_refresh_token({"sub": str(uuid4())})
    client.cookies.set("refresh_token", refresh_token)

    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 200
    assert "access_token" in response.json()["data"]

@pytest.mark.asyncio
async def test_logout(client):
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 204

@pytest.mark.asyncio
async def test_update_preferences(client, mock_db_session):
    with patch("backend.features.user_auth.api.router.update_user_preferences") as mock_update:
        mock_update.return_value = UserSummary(
            user_id=uuid4(),
            email="test@example.com",
            display_name="New Name",
            subscription_tier="free",
            soul_color_hex="#ff0000",
            lite_mode_enabled=True
        )

        payload = {
            "display_name": "New Name",
            "soul_color_hex": "#ff0000",
            "lite_mode_enabled": True
        }

        response = await client.put("/api/v1/auth/preferences", json=payload)

        assert response.status_code == 200
        assert response.json()["data"]["display_name"] == "New Name"

@pytest.mark.asyncio
async def test_export_data(client, mock_db_session):
    with patch("backend.features.user_auth.api.router.export_user_data") as mock_export:
        mock_export.return_value = {"user": {"email": "test@example.com"}, "tasks": [], "study_sessions": []}

        response = await client.get("/api/v1/auth/export")

        assert response.status_code == 200
        assert response.json()["data"]["user"]["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_get_llm_settings(client, mock_db_session):
    mock_result = MagicMock()
    mock_user = MagicMock()
    mock_user.llm_provider = "openai"
    mock_user.llm_api_key = "sk-test"
    mock_result.scalars().first.return_value = mock_user
    mock_db_session.execute.return_value = mock_result

    response = await client.get("/api/v1/auth/settings/llm")

    assert response.status_code == 200
    assert response.json()["data"]["provider"] == "openai"

@pytest.mark.asyncio
async def test_update_llm_settings(client, mock_db_session):
    payload = {
        "provider": "GEMINI",
        "api_key": "sk-ant-test"
    }

    response = await client.put("/api/v1/auth/settings/llm", json=payload)

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "updated"
