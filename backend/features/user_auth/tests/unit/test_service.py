import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from backend.features.user_auth.application.service import (
    register_user,
    authenticate_user,
    update_user_preferences,
    export_user_data,
    get_password_hash
)
from backend.features.user_auth.domain.models import UserRegistrationRequest, UserLoginRequest, UserPreferencesUpdate
from backend.features.user_auth.infrastructure.orm import UserModel

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.UserRepository")
async def test_register_user_success(mock_repo):
    db_mock = AsyncMock()
    mock_repo.get_by_email = AsyncMock(return_value=None)

    mock_user = UserModel(
        id=uuid4(),
        email="test@example.com",
        display_name="Test User",
        timezone="UTC",
        subscription_tier="free"
    )
    mock_repo.create = AsyncMock(return_value=mock_user)

    req = UserRegistrationRequest(
        email="test@example.com",
        password="securepassword",
        display_name="Test User",
        timezone="UTC"
    )

    result = await register_user(req, db_mock)
    assert result.email == "test@example.com"
    mock_repo.get_by_email.assert_called_once_with("test@example.com", db_mock)
    mock_repo.create.assert_called_once()
    db_mock.commit.assert_called_once()

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.UserRepository")
async def test_register_user_existing_email(mock_repo):
    db_mock = AsyncMock()
    mock_repo.get_by_email = AsyncMock(return_value=UserModel(id=uuid4(), email="test@example.com"))

    req = UserRegistrationRequest(
        email="test@example.com",
        password="securepassword",
        display_name="Test User",
        timezone="UTC"
    )

    with pytest.raises(ValueError, match="Email already registered"):
        await register_user(req, db_mock)

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.UserRepository")
async def test_authenticate_user_success(mock_repo):
    db_mock = AsyncMock()

    hashed = get_password_hash("securepassword")
    mock_user = UserModel(
        id=uuid4(),
        email="test@example.com",
        hashed_password=hashed
    )
    mock_repo.get_by_email = AsyncMock(return_value=mock_user)

    req = UserLoginRequest(email="test@example.com", password="securepassword")

    result = await authenticate_user(req, db_mock)
    assert result is not None
    assert result.email == "test@example.com"

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.UserRepository")
async def test_authenticate_user_invalid_password(mock_repo):
    db_mock = AsyncMock()

    hashed = get_password_hash("securepassword")
    mock_user = UserModel(
        id=uuid4(),
        email="test@example.com",
        hashed_password=hashed
    )
    mock_repo.get_by_email = AsyncMock(return_value=mock_user)

    req = UserLoginRequest(email="test@example.com", password="wrongpassword")

    result = await authenticate_user(req, db_mock)
    assert result is None

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.UserRepository")
async def test_authenticate_user_not_found(mock_repo):
    db_mock = AsyncMock()
    mock_repo.get_by_email = AsyncMock(return_value=None)

    req = UserLoginRequest(email="notfound@example.com", password="password")

    result = await authenticate_user(req, db_mock)
    assert result is None

@pytest.mark.asyncio
async def test_update_user_preferences_success():
    db_mock = AsyncMock()
    user_id = uuid4()
    mock_user = UserModel(
        id=user_id,
        email="test@example.com",
        display_name="Old Name",
        subscription_tier="free"
    )
    db_mock.get.return_value = mock_user

    prefs = UserPreferencesUpdate(
        display_name="New Name",
        soul_color_hex="#ff0000",
        lite_mode_enabled=True
    )

    result = await update_user_preferences(user_id, prefs, db_mock)

    assert result.display_name == "New Name"
    assert result.soul_color_hex == "#ff0000"
    assert result.lite_mode_enabled is True
    db_mock.commit.assert_called_once()
    db_mock.refresh.assert_called_once_with(mock_user)

@pytest.mark.asyncio
async def test_update_user_preferences_not_found():
    db_mock = AsyncMock()
    db_mock.get.return_value = None

    prefs = UserPreferencesUpdate(display_name="New Name")

    with pytest.raises(ValueError, match="User not found"):
        await update_user_preferences(uuid4(), prefs, db_mock)

@pytest.mark.asyncio
@patch("backend.features.user_auth.application.service.select")
async def test_export_user_data(mock_select):
    db_mock = AsyncMock()
    user_id = uuid4()
    mock_user = UserModel(
        id=user_id,
        email="export@example.com",
        display_name="Export User",
        timezone="UTC"
    )
    db_mock.get.return_value = mock_user

    class MockResult:
        def scalars(self):
            class MockScalars:
                def all(self):
                    return []
            return MockScalars()

    db_mock.execute.return_value = MockResult()

    result = await export_user_data(user_id, db_mock)

    assert result["user"]["email"] == "export@example.com"
    assert "tasks" in result
    assert "study_sessions" in result
    assert db_mock.execute.call_count == 2
