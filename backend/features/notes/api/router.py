from uuid import UUID
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user
from ..application import service
from ..domain.schemas import (
    NoteFolderCreate, NoteFolderRead, NoteFolderUpdate,
    NoteCreate, NoteRead, NoteUpdate, PaginatedNotesResponse
)

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("/workspace")
async def get_workspace(
    folder_id: Optional[UUID] = Query(default=None, description="Fetch items for a specific folder"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Fetch folders and notes for the workspace load with optional pagination."""
    return await service.get_workspace_data(
        db=db, 
        user_id=current_user.user_id, 
        folder_id=folder_id, 
        limit=limit, 
        offset=offset
    )

@router.post("/folders", response_model=NoteFolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: NoteFolderCreate,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Create a new folder."""
    return await service.create_folder(db=db, user_id=current_user.user_id, folder_data=folder_data)

@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Delete a folder."""
    await service.delete_folder(db=db, user_id=current_user.user_id, folder_id=folder_id)

@router.patch("/folders/{folder_id}", response_model=NoteFolderRead)
async def update_folder(
    folder_id: UUID,
    folder_data: NoteFolderUpdate,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Rename or move a folder."""
    return await service.rename_folder(db=db, user_id=current_user.user_id, folder_id=folder_id, folder_data=folder_data)

@router.post("/", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Create a new note."""
    return await service.create_note(db=db, user_id=current_user.user_id, note_data=note_data)

@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Fetch single note details."""
    return await service.get_note_by_id(db=db, user_id=current_user.user_id, note_id=note_id)

@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Update note content or metadata."""
    return await service.update_note(db=db, user_id=current_user.user_id, note_id=note_id, note_data=note_data)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Delete a note."""
    await service.delete_note(db=db, user_id=current_user.user_id, note_id=note_id)
