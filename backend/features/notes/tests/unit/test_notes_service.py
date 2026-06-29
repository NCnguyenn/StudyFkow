import sys
import os

# Clean sys.path to prevent double-importing backend modules
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
sys.path = [p for p in sys.path if not p.endswith("backend") and not p.endswith("backend/features") and "backend\\features" not in p and "backend/features" not in p]
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

import pytest
from uuid import uuid4
from datetime import datetime, UTC
from unittest.mock import AsyncMock, MagicMock
from backend.features.notes.application.service import (
    get_workspace_data,
    create_folder,
    delete_folder,
    create_note,
    delete_note,
)
from backend.features.notes.domain.schemas import NoteFolderCreate, NoteCreate

@pytest.mark.asyncio
async def test_get_workspace_data():
    db = AsyncMock()
    user_id = uuid4()
    
    # Mock result for folders
    mock_folders_res = MagicMock()
    mock_folders_res.scalars.return_value.all.return_value = []
    
    # Mock result for notes
    mock_notes_res = MagicMock()
    mock_notes_res.scalars.return_value.all.return_value = []
    
    db.execute.side_effect = [mock_folders_res, mock_notes_res]
    
    result = await get_workspace_data(db, user_id)
    assert "folders" in result
    assert "notes" in result
    assert result["folders"] == []
    assert result["notes"] == []

@pytest.mark.asyncio
async def test_create_folder():
    db = AsyncMock()
    user_id = uuid4()
    
    folder_data = NoteFolderCreate(name="New Folder", parent_id=None)
    
    # No parent folder lookup since parent_id is None
    result = await create_folder(db, user_id, folder_data)
    
    assert result.name == "New Folder"
    assert result.user_id == user_id
    db.add.assert_called_once()
    db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_delete_folder():
    db = AsyncMock()
    user_id = uuid4()
    folder_id = uuid4()
    
    # Mock finding folder
    mock_folder = MagicMock()
    mock_folder.id = folder_id
    mock_folder.user_id = user_id
    mock_folder.deleted_at = None
    
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_folder
    db.execute.return_value = mock_res
    
    await delete_folder(db, user_id, folder_id)
    
    assert mock_folder.deleted_at is not None
    db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_create_note():
    db = AsyncMock()
    user_id = uuid4()
    
    note_data = NoteCreate(
        title="Untitled Note",
        folder_id=None,
        content_json={},
        tag_ids=[],
        subject_ids=[],
        task_ids=[]
    )
    
    result = await create_note(db, user_id, note_data)
    
    assert result.title == "Untitled Note"
    assert result.user_id == user_id
    db.add.assert_called_once()
    db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_delete_note():
    db = AsyncMock()
    user_id = uuid4()
    note_id = uuid4()
    
    # Mock finding note
    mock_note = MagicMock()
    mock_note.id = note_id
    mock_note.user_id = user_id
    mock_note.deleted_at = None
    
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_note
    db.execute.return_value = mock_res
    
    await delete_note(db, user_id, note_id)
    
    assert mock_note.deleted_at is not None
    db.commit.assert_called_once()
