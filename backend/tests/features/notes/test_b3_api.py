import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, UTC

from backend.features.notes.domain.schemas import (
    NoteTemplateCreate, NoteSearchQuery, NoteLinksUpdateRequest
)
from backend.features.notes.application import service

@pytest.fixture
def mock_db_session():
    return AsyncMock()

@pytest.fixture
def mock_user_id():
    return uuid4()

@pytest.mark.asyncio
async def test_get_templates(mock_db_session, mock_user_id):
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_res
    res = await service.get_templates(mock_db_session, mock_user_id)
    assert res == []

@pytest.mark.asyncio
async def test_create_template(mock_db_session, mock_user_id):
    template_data = NoteTemplateCreate(name="Test Template", content_json={})
    res = await service.create_template(mock_db_session, mock_user_id, template_data)
    assert res.name == "Test Template"
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_search_notes(mock_db_session, mock_user_id):
    query = NoteSearchQuery(q="test query", limit=10, offset=0)

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_res

    res = await service.search_notes(mock_db_session, mock_user_id, query)
    assert res["query"] == "test query"
    assert res["items"] == []
    assert res["total"] == 0

@pytest.mark.asyncio
@patch("backend.features.notes.application.service.get_note_by_id")
async def test_get_versions(mock_get_note, mock_db_session, mock_user_id):
    note_id = uuid4()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_res

    res = await service.get_note_versions(mock_db_session, mock_user_id, note_id)
    mock_get_note.assert_called_once_with(mock_db_session, mock_user_id, note_id)
    assert res == []

@pytest.mark.asyncio
@patch("backend.features.notes.application.service.get_note_by_id")
async def test_restore_version(mock_get_note, mock_db_session, mock_user_id):
    note_id = uuid4()
    version_id = uuid4()

    mock_note = MagicMock()
    mock_get_note.return_value = mock_note

    mock_version = MagicMock()
    mock_version.content_json = {"restored": True}
    mock_version.created_at = datetime.now(UTC)

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_version
    mock_db_session.execute.return_value = mock_res

    res = await service.restore_note_version(mock_db_session, mock_user_id, note_id, version_id)

    assert mock_note.content_json == {"restored": True}
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(mock_note)

@pytest.mark.asyncio
@patch("backend.features.notes.application.service.get_note_by_id")
async def test_get_links(mock_get_note, mock_db_session, mock_user_id):
    note_id = uuid4()

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_res

    res = await service.get_note_links(mock_db_session, mock_user_id, note_id)
    assert res == {"incoming": [], "outgoing": []}
    mock_get_note.assert_called_once_with(mock_db_session, mock_user_id, note_id)

@pytest.mark.asyncio
@patch("backend.features.notes.application.service.get_note_by_id")
async def test_update_links(mock_get_note, mock_db_session, mock_user_id):
    note_id = uuid4()
    target_ids = [uuid4(), uuid4()]

    await service.update_note_links(mock_db_session, mock_user_id, note_id, target_ids)

    mock_get_note.assert_called_once_with(mock_db_session, mock_user_id, note_id)
    mock_db_session.execute.assert_called_once()
    assert mock_db_session.add.call_count == 2
    mock_db_session.commit.assert_called_once()
