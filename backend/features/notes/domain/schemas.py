from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# ==========================================
# FOLDER SCHEMAS
# ==========================================
class NoteFolderBase(BaseModel):
    name: str = Field(..., max_length=255)
    parent_id: Optional[UUID] = None

class NoteFolderCreate(NoteFolderBase):
    pass

class NoteFolderRead(NoteFolderBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class NoteFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[UUID] = None


# ==========================================
# NOTE SCHEMAS
# ==========================================
class NoteBase(BaseModel):
    title: str = Field(default="Untitled Note", max_length=255)
    folder_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    content_json: Dict[str, Any] = Field(default_factory=dict)
    content_markdown: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    folder_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    content_json: Optional[Dict[str, Any]] = None
    content_markdown: Optional[str] = None

class NoteRead(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PAGINATION & SPARSE FIELDSETS
# ==========================================
class NoteListItem(BaseModel):
    """Lean read schema for list views — heavy blobs omitted by default."""
    id: UUID
    title: str
    folder_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    # Optional blobs — only populated when the caller explicitly requests them
    content_json: Optional[Dict[str, Any]] = None
    content_markdown: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedNotesResponse(BaseModel):
    items: list[NoteListItem]
    total: int
    skip: int
    limit: int
