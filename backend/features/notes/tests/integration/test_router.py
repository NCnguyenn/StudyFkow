import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

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
async def test_get_workspace(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.get_workspace_data", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"folders": [], "notes": []}
        response = await client.get("/api/v1/notes/workspace")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_folder(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.create_folder", new_callable=AsyncMock) as mock_create:
        from backend.features.notes.domain.schemas import NoteFolderRead
        mock_create.return_value = NoteFolderRead(id=uuid4(), user_id=uuid4(), name="Test", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc), folder_id=None, is_archived=False)
        response = await client.post("/api/v1/notes/folders", json={"name": "Test Folder"})
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_delete_folder(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.delete_folder", new_callable=AsyncMock) as mock_delete:
        response = await client.delete(f"/api/v1/notes/folders/{uuid4()}")
        assert response.status_code == 204

@pytest.mark.asyncio
async def test_update_folder(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.rename_folder", new_callable=AsyncMock) as mock_update:
        from backend.features.notes.domain.schemas import NoteFolderRead
        mock_update.return_value = NoteFolderRead(id=uuid4(), user_id=uuid4(), name="Renamed", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc), folder_id=None, is_archived=False)
        response = await client.patch(f"/api/v1/notes/folders/{uuid4()}", json={"name": "Renamed"})
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_note(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.create_note", new_callable=AsyncMock) as mock_create:
        from backend.features.notes.domain.schemas import NoteRead
        mock_create.return_value = NoteRead(id=uuid4(), user_id=uuid4(), title="Test Note", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc), is_archived=False, content_json={})
        response = await client.post("/api/v1/notes/", json={"title": "Test Note"})
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_get_note(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.get_note_by_id", new_callable=AsyncMock) as mock_get:
        from backend.features.notes.domain.schemas import NoteRead
        mock_get.return_value = NoteRead(id=uuid4(), user_id=uuid4(), title="Test Note", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc), is_archived=False, content_json={})
        response = await client.get(f"/api/v1/notes/{uuid4()}")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_update_note(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.update_note", new_callable=AsyncMock) as mock_update:
        from backend.features.notes.domain.schemas import NoteRead
        mock_update.return_value = NoteRead(id=uuid4(), user_id=uuid4(), title="Updated Note", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc), is_archived=False, content_json={})
        response = await client.patch(f"/api/v1/notes/{uuid4()}", json={"title": "Updated Note"})
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_delete_note(client, mock_db_session):
    with patch("backend.features.notes.api.router.service.delete_note", new_callable=AsyncMock) as mock_delete:
        response = await client.delete(f"/api/v1/notes/{uuid4()}")
        assert response.status_code == 204
