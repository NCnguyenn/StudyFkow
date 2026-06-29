import logging
from uuid import UUID
from typing import Optional
from datetime import datetime, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import load_only
from fastapi import HTTPException
from ..infrastructure.models import NoteFolderModel, NoteModel, NoteSubjectModel, NoteTaskModel, NoteTagMappingModel
from ..domain.schemas import NoteFolderCreate, NoteFolderUpdate, NoteCreate, NoteUpdate

logger = logging.getLogger(__name__)

_ALLOWED_NOTE_FIELDS: frozenset[str] = frozenset({
    "id", "title", "folder_id", "content_json", "content_markdown",
    "status", "note_type", "priority", "created_at", "updated_at",
})
_HEAVY_COLUMNS: frozenset[str] = frozenset({"content_json", "content_markdown"})
_DEFAULT_FIELDS: frozenset[str] = _ALLOWED_NOTE_FIELDS - _HEAVY_COLUMNS

async def get_workspace_data(
    db: AsyncSession, 
    user_id: UUID,
    folder_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0
) -> dict:
    """Fetch all active folders and notes for a user with lazy loading params."""
    folders_stmt = select(NoteFolderModel).where(
        NoteFolderModel.user_id == user_id,
        NoteFolderModel.deleted_at.is_(None)
    )
    if folder_id:
        folders_stmt = folders_stmt.where(NoteFolderModel.parent_id == folder_id)
    else:
        folders_stmt = folders_stmt.where(NoteFolderModel.parent_id.is_(None))
        
    folders_res = await db.execute(folders_stmt)
    folders = folders_res.scalars().all()
    
    notes_stmt = select(NoteModel).where(
        NoteModel.user_id == user_id,
        NoteModel.deleted_at.is_(None)
    )
    if folder_id:
        notes_stmt = notes_stmt.where(NoteModel.folder_id == folder_id)
    else:
        notes_stmt = notes_stmt.where(NoteModel.folder_id.is_(None))
    
    notes_stmt = notes_stmt.options(load_only(*[getattr(NoteModel, col) for col in _DEFAULT_FIELDS]))
    notes_stmt = notes_stmt.offset(offset).limit(limit)
    
    notes_res = await db.execute(notes_stmt)
    notes = notes_res.scalars().all()
    
    return {
        "folders": [
            {
                "id": f.id,
                "user_id": f.user_id,
                "name": f.name,
                "parent_id": f.parent_id,
                "created_at": f.created_at,
                "ui_metadata": f.ui_metadata,
                "deleted_at": f.deleted_at
            } for f in folders
        ],
        "notes": [
            {
                "id": n.id,
                "user_id": n.user_id,
                "folder_id": n.folder_id,
                "title": n.title,
                "created_at": n.created_at,
                "updated_at": n.updated_at,
                "deleted_at": n.deleted_at,
                "status": n.status,
                "note_type": n.note_type,
                "priority": n.priority
            } for n in notes
        ]
    }

async def create_folder(db: AsyncSession, user_id: UUID, folder_data: NoteFolderCreate):
    if folder_data.parent_id:
        parent_res = await db.execute(
            select(NoteFolderModel).where(
                NoteFolderModel.id == folder_data.parent_id, 
                NoteFolderModel.user_id == user_id,
                NoteFolderModel.deleted_at.is_(None),
            )
        )
        parent = parent_res.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent folder not found or does not belong to user")
            
    folder = NoteFolderModel(**folder_data.model_dump(), user_id=user_id)
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return folder

async def delete_folder(db: AsyncSession, user_id: UUID, folder_id: UUID):
    res = await db.execute(
        select(NoteFolderModel).where(
            NoteFolderModel.id == folder_id, 
            NoteFolderModel.user_id == user_id,
            NoteFolderModel.deleted_at.is_(None),
        )
    )
    folder = res.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    now = datetime.now(UTC)
    folder.deleted_at = now
    
    # Soft-delete all notes inside this folder
    await db.execute(
        update(NoteModel)
        .where(NoteModel.folder_id == folder_id, NoteModel.deleted_at.is_(None))
        .values(deleted_at=now)
    )
    
    await db.commit()

async def rename_folder(db: AsyncSession, user_id: UUID, folder_id: UUID, folder_data: NoteFolderUpdate):
    res = await db.execute(
        select(NoteFolderModel).where(
            NoteFolderModel.id == folder_id,
            NoteFolderModel.user_id == user_id,
            NoteFolderModel.deleted_at.is_(None),
        )
    )
    folder = res.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    update_data = folder_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(folder, key, value)
    
    await db.commit()
    await db.refresh(folder)
    return folder

async def create_note(db: AsyncSession, user_id: UUID, note_data: NoteCreate):
    note_dict = note_data.model_dump(exclude={"tag_ids", "subject_ids", "task_ids"})
    note = NoteModel(**note_dict, user_id=user_id)
    db.add(note)
    await db.flush()
    
    if note_data.tag_ids:
        for t_id in note_data.tag_ids:
            db.add(NoteTagMappingModel(note_id=note.id, tag_id=t_id))
    if note_data.subject_ids:
        for s_id in note_data.subject_ids:
            db.add(NoteSubjectModel(note_id=note.id, subject_id=s_id))
    if note_data.task_ids:
        for tk_id in note_data.task_ids:
            db.add(NoteTaskModel(note_id=note.id, task_id=tk_id))

    await db.commit()
    await db.refresh(note)
    return note

async def get_note_by_id(db: AsyncSession, user_id: UUID, note_id: UUID):
    res = await db.execute(
        select(NoteModel).where(
            NoteModel.id == note_id, 
            NoteModel.user_id == user_id,
            NoteModel.deleted_at.is_(None),
        )
    )
    note = res.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

async def update_note(db: AsyncSession, user_id: UUID, note_id: UUID, note_data: NoteUpdate):
    note = await get_note_by_id(db, user_id, note_id)
    
    update_data = note_data.model_dump(exclude_unset=True, exclude={"tag_ids", "subject_ids", "task_ids"})
    for key, value in update_data.items():
        setattr(note, key, value)
        
    await db.commit()
    await db.refresh(note)
    return note

async def delete_note(db: AsyncSession, user_id: UUID, note_id: UUID):
    note = await get_note_by_id(db, user_id, note_id)
    note.deleted_at = datetime.now(UTC)
    await db.commit()
