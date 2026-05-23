import re
import json
import logging
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import load_only
from fastapi import HTTPException
from ..infrastructure.models import NoteFolderModel, NoteModel, NoteLinkModel
from ..domain.schemas import NoteFolderCreate, NoteFolderUpdate, NoteCreate, NoteUpdate, PaginatedNotesResponse, NoteListItem, NoteFolderRead

logger = logging.getLogger(__name__)

# Regex to find [[Note Title]] wikilinks inside serialized JSON content
_WIKILINK_RE = re.compile(r'\[\[(.+?)\]\]')

# Whitelist of column names the caller may request via sparse fieldsets.
# Excludes `user_id` (internal) and any future audit fields.
_ALLOWED_NOTE_FIELDS: frozenset[str] = frozenset({
    "id", "title", "folder_id", "subject_id", "task_id",
    "content_json", "content_markdown", "created_at", "updated_at",
})

# Heavy columns deferred unless explicitly requested
_HEAVY_COLUMNS: frozenset[str] = frozenset({"content_json", "content_markdown"})

# Default lightweight columns loaded when no `fields` param is given
_DEFAULT_FIELDS: frozenset[str] = _ALLOWED_NOTE_FIELDS - _HEAVY_COLUMNS

async def get_workspace_data(db: AsyncSession, user_id: UUID) -> dict:
    """Fetch all folders and notes for a user in just two queries."""
    folders_res = await db.execute(select(NoteFolderModel).where(NoteFolderModel.user_id == user_id))
    folders = folders_res.scalars().all()
    
    notes_res = await db.execute(select(NoteModel).where(NoteModel.user_id == user_id))
    notes = notes_res.scalars().all()
    
    return {
        "folders": [NoteFolderRead.model_validate(f).model_dump(mode="json") for f in folders],
        "notes": [NoteListItem.model_validate(n).model_dump(mode="json") for n in notes]
    }

async def get_notes_list(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    fields: Optional[str] = None,
) -> PaginatedNotesResponse:
    """
    Paginated note list with optional sparse fieldsets.

    Sparse fieldset logic:
      - Default: load all columns EXCEPT the heavy blobs (content_json, content_markdown).
      - If `fields` is provided (e.g. "id,title,updated_at"), only those columns are
        fetched via load_only(). Unknown field names raise HTTP 400.
      - The SQLAlchemy PK (id) is always loaded regardless of the requested fields.
    """
    # --- 1. Resolve which fields to load ---
    if fields:
        requested = {f.strip() for f in fields.split(",") if f.strip()}
        unknown = requested - _ALLOWED_NOTE_FIELDS
        if unknown:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown field(s) requested: {', '.join(sorted(unknown))}. "
                       f"Allowed: {', '.join(sorted(_ALLOWED_NOTE_FIELDS))}",
            )
        cols_to_load = requested
    else:
        # Default: everything except heavy blobs
        cols_to_load = _DEFAULT_FIELDS

    load_options = load_only(*[getattr(NoteModel, col) for col in cols_to_load])

    # --- 2. Count query (cheap, no blob fetching) ---
    count_stmt = (
        select(func.count(NoteModel.id))
        .where(NoteModel.user_id == user_id)
    )
    total: int = (await db.execute(count_stmt)).scalar_one()

    # --- 3. Data query with load_only + pagination ---
    data_stmt = (
        select(NoteModel)
        .where(NoteModel.user_id == user_id)
        .options(load_options)
        .order_by(NoteModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = (await db.execute(data_stmt)).scalars().all()

    return PaginatedNotesResponse(
        items=[NoteListItem.model_validate(row) for row in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


async def create_folder(db: AsyncSession, user_id: UUID, folder_data: NoteFolderCreate):
    # Validate parent folder belongs to the user if provided
    if folder_data.parent_id:
        parent_res = await db.execute(
            select(NoteFolderModel).where(
                NoteFolderModel.id == folder_data.parent_id, 
                NoteFolderModel.user_id == user_id
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
            NoteFolderModel.user_id == user_id
        )
    )
    folder = res.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    await db.delete(folder)
    await db.commit()

async def rename_folder(db: AsyncSession, user_id: UUID, folder_id: UUID, folder_data: NoteFolderUpdate):
    res = await db.execute(
        select(NoteFolderModel).where(
            NoteFolderModel.id == folder_id,
            NoteFolderModel.user_id == user_id
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
    note = NoteModel(**note_data.model_dump(), user_id=user_id)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

async def get_note_by_id(db: AsyncSession, user_id: UUID, note_id: UUID):
    res = await db.execute(
        select(NoteModel).where(
            NoteModel.id == note_id, 
            NoteModel.user_id == user_id
        )
    )
    note = res.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

async def update_note(db: AsyncSession, user_id: UUID, note_id: UUID, note_data: NoteUpdate):
    note = await get_note_by_id(db, user_id, note_id)
    
    update_data = note_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
        
    await db.commit()
    await db.refresh(note)

    # Rebuild [[wikilinks]] after persisting content
    await _rebuild_note_links(db, user_id, note)

    return note


# ---------------------------------------------------------------------------
# Zettelkasten link engine
# ---------------------------------------------------------------------------

def _parse_wikilinks(content_json: dict) -> list[str]:
    """Extract unique note titles from bidirectionalLink AST nodes."""
    seen: set[str] = set()
    result: list[str] = []

    def traverse(node):
        if not isinstance(node, dict):
            return
        if node.get("type") == "bidirectionalLink":
            title = node.get("attrs", {}).get("title")
            if title and isinstance(title, str):
                t = title.strip()
                if t and t not in seen:
                    seen.add(t)
                    result.append(t)
        
        content = node.get("content")
        if isinstance(content, list):
            for child in content:
                traverse(child)

    traverse(content_json)
    return result


async def _rebuild_note_links(
    db: AsyncSession, user_id: UUID, note: NoteModel
) -> None:
    """Delete old links for this note, then insert fresh ones from content."""
    from sqlalchemy.exc import IntegrityError
    
    try:
        # 1. Delete all existing outgoing links from this source
        await db.execute(
            delete(NoteLinkModel).where(NoteLinkModel.source_id == note.id)
        )

        # 2. Parse [[wikilinks]] from the note content
        content = note.content_json if isinstance(note.content_json, dict) else {}
        titles = _parse_wikilinks(content)
        if not titles:
            await db.commit()
            return

        # 3. Find matching notes by title (scoped to user)
        target_res = await db.execute(
            select(NoteModel.id, NoteModel.title)
            .where(NoteModel.user_id == user_id, NoteModel.title.in_(titles))
        )
        target_rows = target_res.all()

        # 4. Insert new links (skip self-links)
        seen_targets = set()
        for row in target_rows:
            if row.id != note.id and row.id not in seen_targets:
                seen_targets.add(row.id)
                db.add(NoteLinkModel(source_id=note.id, target_id=row.id))

        await db.commit()
        logger.info(
            "note_links_rebuilt: note_id=%s, parsed=%d, linked=%d",
            str(note.id), len(titles), len(seen_targets),
        )
    except IntegrityError as exc:
        await db.rollback()
        logger.error(
            "IntegrityError in _rebuild_note_links for note_id=%s: %s",
            str(note.id), str(exc)
        )
    except Exception as exc:
        await db.rollback()
        logger.error(
            "Error in _rebuild_note_links for note_id=%s: %s",
            str(note.id), str(exc)
        )


async def get_knowledge_graph(db: AsyncSession, user_id: UUID) -> dict:
    """
    Build a multi-layer force-directed graph payload.
    Returns {nodes: [{id, name, val, group, color}], links: [{source, target}]}.

    Node groups:
      'subject' — hubs (val 20), colored by subject.color
      'task'    — secondary nodes (val 10)
      'note'    — leaf nodes (val 5)

    Architecture note: TaskModel and SubjectModel are imported from the
    task_management infrastructure layer (read-only). This avoids circular
    imports because we never import from their domain/application layers.
    """
    # Lazy cross-slice import — infrastructure read only, no circular risk
    from backend.features.task_management.infrastructure.orm import (
        SubjectModel,
        TaskModel,
    )

    # ── 1. Fetch all three entity sets in parallel-style sequential queries ──

    subjects_res = await db.execute(
        select(SubjectModel.id, SubjectModel.title, SubjectModel.color)
        .where(SubjectModel.user_id == user_id)
    )
    subject_rows = subjects_res.all()
    subject_id_set = {row.id for row in subject_rows}

    tasks_res = await db.execute(
        select(TaskModel.id, TaskModel.title, TaskModel.subject_id)
        .where(TaskModel.user_id == user_id, TaskModel.is_deleted == False)  # noqa: E712
    )
    task_rows = tasks_res.all()
    task_id_set = {row.id for row in task_rows}

    notes_res = await db.execute(
        select(NoteModel.id, NoteModel.title, NoteModel.task_id, NoteModel.subject_id)
        .where(NoteModel.user_id == user_id)
    )
    note_rows = notes_res.all()
    note_id_set = {row.id for row in note_rows}

    # ── 2. Build nodes ───────────────────────────────────────────────────────

    subject_nodes = [
        {
            "id": str(row.id),
            "name": str(row.title or "Untitled"),
            "val": 20,
            "group": "subject",
            "color": row.color or "#8b5cf6",
        }
        for row in subject_rows
    ]

    task_nodes = [
        {
            "id": str(row.id),
            "name": str(row.title or "Untitled"),
            "val": 10,
            "group": "task",
            "color": "#6366f1",
        }
        for row in task_rows
    ]

    note_nodes = [
        {
            "id": str(row.id),
            "name": str(row.title or "Untitled"),
            "val": 5,
            "group": "note",
            "color": "#94a3b8",
        }
        for row in note_rows
    ]

    nodes = subject_nodes + task_nodes + note_nodes

    # ── 3. Build links ───────────────────────────────────────────────────────

    links: list[dict] = []

    # Note → Task links
    for row in note_rows:
        if row.task_id and row.task_id in task_id_set:
            links.append({"source": str(row.id), "target": str(row.task_id)})

    # Note → Subject links (only if not already connected via task)
    for row in note_rows:
        if row.subject_id and row.subject_id in subject_id_set:
            links.append({"source": str(row.id), "target": str(row.subject_id)})

    # Task → Subject links
    for row in task_rows:
        if row.subject_id and row.subject_id in subject_id_set:
            links.append({"source": str(row.id), "target": str(row.subject_id)})

    # Note–Note wikilinks (existing zettelkasten links)
    wiki_links_res = await db.execute(
        select(NoteLinkModel.source_id, NoteLinkModel.target_id)
        .where(
            NoteLinkModel.source_id.in_(note_id_set),
            NoteLinkModel.target_id.in_(note_id_set),
        )
    )
    for row in wiki_links_res.all():
        links.append({"source": str(row.source_id), "target": str(row.target_id)})

    return {"nodes": nodes, "links": links}

async def delete_note(db: AsyncSession, user_id: UUID, note_id: UUID):
    note = await get_note_by_id(db, user_id, note_id)
    await db.delete(note)
    await db.commit()

