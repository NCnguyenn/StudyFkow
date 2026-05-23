from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Any, Dict, Optional
import os
import shutil
import uuid as uuid_mod
from pathlib import Path
import logging

from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user
from ..domain.schemas import (
    NoteFolderCreate, NoteFolderRead, NoteFolderUpdate,
    NoteCreate, NoteRead, NoteUpdate, PaginatedNotesResponse,
)
from ..application import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notes", tags=["Notes"])

# ---------------------------------------------------------------------------
# Image upload constants
# ---------------------------------------------------------------------------
_MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
_ALLOWED_IMAGE_EXTENSIONS: frozenset[str] = frozenset(
    {".jpg", ".jpeg", ".png", ".gif", ".webp"}
)
_UPLOAD_DIR: Path = Path("static_cdn/note_images")
_PUBLIC_STATIC_PREFIX: str = "/static/note_images"


@router.get("/workspace")
async def get_workspace(
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Fetch all folders and notes for the initial workspace load."""
    return await service.get_workspace_data(db=db, user_id=current_user.user_id)

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
    """Delete a folder. Cascades or SET NULLs according to schema rules."""
    await service.delete_folder(db=db, user_id=current_user.user_id, folder_id=folder_id)

@router.patch("/folders/{folder_id}", response_model=NoteFolderRead)
async def update_folder(
    folder_id: UUID,
    folder_data: NoteFolderUpdate,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Rename or move a folder (partial update)."""
    return await service.rename_folder(db=db, user_id=current_user.user_id, folder_id=folder_id, folder_data=folder_data)

@router.get("/", response_model=PaginatedNotesResponse)
async def list_notes(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Max records to return"),
    fields: Optional[str] = Query(
        default=None,
        description="Comma-separated field names to include (sparse fieldset). "
                    "Omit heavy blobs by default. Example: id,title,updated_at",
    ),
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user),
) -> PaginatedNotesResponse:
    """Paginated list of notes. Excludes content_json/content_markdown unless explicitly requested."""
    return await service.get_notes_list(
        db=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit,
        fields=fields,
    )


@router.get("/graph")
async def get_knowledge_graph(
    db: AsyncSession = Depends(get_write_session),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return the user's knowledge graph as a force-directed graph payload.
    Response: {"nodes": [{"id", "name", "val"}], "links": [{"source", "target"}]}
    """
    return await service.get_knowledge_graph(db=db, user_id=current_user.user_id)


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
    """Update note content or metadata (partial update)."""
    return await service.update_note(db=db, user_id=current_user.user_id, note_id=note_id, note_data=note_data)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_write_session),
    current_user = Depends(get_current_user)
):
    """Delete a note."""
    await service.delete_note(db=db, user_id=current_user.user_id, note_id=note_id)


@router.post("/voice", status_code=status.HTTP_202_ACCEPTED)
async def upload_voice_memo(
    audio: UploadFile = File(..., description="Audio file to transcribe into a note"),
    current_user = Depends(get_current_user),
) -> dict:
    """
    Accept a voice memo upload and dispatch it to the Celery worker for
    async transcription. Returns 202 immediately — the note appears in the
    workspace once the VOICE_NOTE_READY SSE event arrives.
    """
    from backend.features.ai_pipeline.worker import process_voice_memo
    # Sanitise the filename to prevent path traversal
    safe_name = os.path.basename(audio.filename or "voice_memo.webm")
    tmp_path = f"/tmp/studyflow_{current_user.user_id}_{safe_name}"

    # Write to disk so the Celery worker (potentially on a separate machine)
    # can access the file via a shared /tmp volume or object-storage path.
    contents = await audio.read()
    with open(tmp_path, "wb") as f:
        f.write(contents)

    # Fire-and-forget: Celery picks this up asynchronously
    process_voice_memo.delay(str(current_user.user_id), tmp_path)

    return {"status": "processing", "message": "Voice memo received. Your note will appear shortly."}


# ---------------------------------------------------------------------------
# POST /notes/upload — Image upload for note editor
# ---------------------------------------------------------------------------

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_note_image(
    request: Request,
    audio: UploadFile = File(
        ...,
        description="Image file to embed in a note (field name kept as 'audio' for frontend backward compat)",
    ),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Upload an image for embedding inside note content.

    Security guardrails:
    - 5 MB max file size (header pre-check + chunked read guard).
    - Extension whitelist: .jpg, .jpeg, .png, .gif, .svg, .webp.
    - UUID v4 filename to prevent collision / path-traversal attacks.

    Returns the public CDN URL in the standard API envelope.
    """
    # ------------------------------------------------------------------
    # 1. Content-Length pre-check (fast-reject before reading any bytes)
    # ------------------------------------------------------------------
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {_MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.",
        )

    # ------------------------------------------------------------------
    # 2. Extension whitelist validation
    # ------------------------------------------------------------------
    original_filename: str = audio.filename or ""
    file_ext: str = Path(original_filename).suffix.lower()

    if file_ext not in _ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unsupported file extension '{file_ext}'. "
                f"Allowed: {', '.join(sorted(_ALLOWED_IMAGE_EXTENSIONS))}"
            ),
        )

    # ------------------------------------------------------------------
    # 3. Generate a collision-safe UUID v4 filename
    # ------------------------------------------------------------------
    safe_filename: str = f"{uuid_mod.uuid4()}{file_ext}"

    # ------------------------------------------------------------------
    # 4. Ensure upload directory exists
    # ------------------------------------------------------------------
    os.makedirs(_UPLOAD_DIR, exist_ok=True)
    dest_path: Path = _UPLOAD_DIR / safe_filename

    # ------------------------------------------------------------------
    # 5. Stream binary to disk with a hard byte-count guard
    #    (defends against forged/missing Content-Length headers)
    # ------------------------------------------------------------------
    bytes_written: int = 0
    chunk_size: int = 64 * 1024  # 64 KB chunks

    try:
        with open(dest_path, "wb") as dest_file:
            while True:
                chunk: bytes = await audio.read(chunk_size)
                if not chunk:
                    break
                bytes_written += len(chunk)
                if bytes_written > _MAX_IMAGE_SIZE_BYTES:
                    # Abort and clean up the partial file
                    dest_file.close()
                    dest_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File too large. Maximum allowed size is {_MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.",
                    )
                dest_file.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "note_image_upload_failed: user_id=%s, error=%s",
            str(current_user.user_id),
            str(exc),
        )
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image upload failed due to an internal error.",
        ) from exc
    finally:
        await audio.close()

    # ------------------------------------------------------------------
    # 6. Build the public URL and return the standard envelope
    # ------------------------------------------------------------------
    public_url: str = f"{_PUBLIC_STATIC_PREFIX}/{safe_filename}"

    logger.info(
        "note_image_uploaded: user_id=%s, filename=%s, size_bytes=%d",
        str(current_user.user_id),
        safe_filename,
        bytes_written,
    )

    return {
        "success": True,
        "data": {
            "url": public_url,
            "filename": safe_filename,
            "size_bytes": bytes_written,
        },
        "meta": {
            "version": "v1",
        },
    }
