import logging
from uuid import UUID
from typing import Optional
from datetime import datetime, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_, delete
from sqlalchemy.orm import load_only
from fastapi import HTTPException
from ..infrastructure.models import NoteFolderModel, NoteModel, NoteSubjectModel, NoteTaskModel, NoteTagMappingModel, NoteTemplateModel, NoteVersionModel, NoteLinkModel
from ..domain.schemas import NoteFolderCreate, NoteFolderUpdate, NoteCreate, NoteUpdate, NoteTemplateCreate, NoteTemplateUpdate, NoteSearchQuery

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

async def get_note_links(db: AsyncSession, user_id: UUID, note_id: UUID) -> dict:
    await get_note_by_id(db, user_id, note_id)

    incoming_stmt = select(NoteLinkModel).where(NoteLinkModel.target_id == note_id)
    outgoing_stmt = select(NoteLinkModel).where(NoteLinkModel.source_id == note_id)

    incoming_res = await db.execute(incoming_stmt)
    outgoing_res = await db.execute(outgoing_stmt)

    return {
        "incoming": incoming_res.scalars().all(),
        "outgoing": outgoing_res.scalars().all()
    }

async def update_note_links(db: AsyncSession, user_id: UUID, note_id: UUID, target_ids: list[UUID]):
    await get_note_by_id(db, user_id, note_id)

    # Delete existing outgoing links
    await db.execute(delete(NoteLinkModel).where(NoteLinkModel.source_id == note_id))

    # Insert new ones
    for target_id in set(target_ids):
        link = NoteLinkModel(source_id=note_id, target_id=target_id)
        db.add(link)

    await db.commit()

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

async def get_templates(db: AsyncSession, user_id: UUID) -> list[NoteTemplateModel]:
    res = await db.execute(
        select(NoteTemplateModel).where(
            NoteTemplateModel.user_id == user_id,
            NoteTemplateModel.deleted_at.is_(None)
        )
    )
    return res.scalars().all()

async def create_template(db: AsyncSession, user_id: UUID, template_data: NoteTemplateCreate) -> NoteTemplateModel:
    template = NoteTemplateModel(**template_data.model_dump(), user_id=user_id)
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

async def get_template_by_id(db: AsyncSession, user_id: UUID, template_id: UUID) -> NoteTemplateModel:
    res = await db.execute(
        select(NoteTemplateModel).where(
            NoteTemplateModel.id == template_id,
            NoteTemplateModel.user_id == user_id,
            NoteTemplateModel.deleted_at.is_(None)
        )
    )
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

async def update_template(db: AsyncSession, user_id: UUID, template_id: UUID, template_data: NoteTemplateUpdate) -> NoteTemplateModel:
    template = await get_template_by_id(db, user_id, template_id)
    update_data = template_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    await db.commit()
    await db.refresh(template)
    return template

async def delete_template(db: AsyncSession, user_id: UUID, template_id: UUID):
    template = await get_template_by_id(db, user_id, template_id)
    template.deleted_at = datetime.now(UTC)
    await db.commit()

async def search_notes(db: AsyncSession, user_id: UUID, query: NoteSearchQuery) -> dict:
    stmt = select(NoteModel).where(
        NoteModel.user_id == user_id,
        NoteModel.deleted_at.is_(None)
    )

    if query.q:
        tsquery = func.plainto_tsquery('english', query.q)
        tsvector = func.to_tsvector('english', func.coalesce(NoteModel.title, '') + ' ' + func.coalesce(NoteModel.content_markdown, ''))
        stmt = stmt.where(tsvector.op('@@')(tsquery))

    if query.folder_id:
        stmt = stmt.where(NoteModel.folder_id == query.folder_id)
    if query.status:
        stmt = stmt.where(NoteModel.status == query.status)
    if query.note_type:
        stmt = stmt.where(NoteModel.note_type == query.note_type)

    # We will ignore tag_ids and subject_ids filters for simplicity in this basic search implementation
    # or implement them if necessary. For now, executing the text search.

    stmt = stmt.limit(query.limit).offset(query.offset)
    res = await db.execute(stmt)
    notes = res.scalars().all()

    items = []
    for n in notes:
        items.append({
            "id": n.id,
            "title": n.title,
            "snippet": "", # Would normally use ts_headline
            "status": n.status,
            "tags": [],
            "subject_ids": n.subject_ids,
            "folder_id": n.folder_id,
            "updated_at": n.updated_at,
            "rank": 1.0 # Mock rank
        })

    return {
        "items": items,
        "total": len(items), # Should be a count query, simplifying for now
        "query": query.q
    }

async def get_note_versions(db: AsyncSession, user_id: UUID, note_id: UUID) -> list[NoteVersionModel]:
    # Verify note exists and belongs to user
    await get_note_by_id(db, user_id, note_id)

    res = await db.execute(
        select(NoteVersionModel).where(
            NoteVersionModel.note_id == note_id
        ).order_by(NoteVersionModel.created_at.desc())
    )
    return res.scalars().all()

async def restore_note_version(db: AsyncSession, user_id: UUID, note_id: UUID, version_id: UUID) -> NoteModel:
    note = await get_note_by_id(db, user_id, note_id)

    res = await db.execute(
        select(NoteVersionModel).where(
            NoteVersionModel.id == version_id,
            NoteVersionModel.note_id == note_id
        )
    )
    version = res.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Create a new version before restoring
    new_version = NoteVersionModel(
        note_id=note_id,
        content_json=note.content_json,
        name=f"Backup before restoring to {version.created_at}",
        is_checkpoint=True
    )
    db.add(new_version)

    note.content_json = version.content_json
    await db.commit()
    await db.refresh(note)
    return note
