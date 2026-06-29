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
    ui_metadata: Dict[str, Any] = Field(default_factory=dict)

class NoteFolderCreate(NoteFolderBase):
    pass

class NoteFolderRead(NoteFolderBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class NoteFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[UUID] = None
    ui_metadata: Optional[Dict[str, Any]] = None


# ==========================================
# TAG SCHEMAS
# ==========================================
class NoteTagCreate(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = Field(default="#6366f1", max_length=7)

class NoteTagRead(BaseModel):
    id: UUID
    name: str
    color: str
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# NOTE SCHEMAS
# ==========================================
class NoteBase(BaseModel):
    title: str = Field(default="Untitled Note", max_length=255)
    folder_id: Optional[UUID] = None
    content_json: Dict[str, Any] = Field(default_factory=dict)
    content_markdown: Optional[str] = None
    ui_metadata: Dict[str, Any] = Field(default_factory=dict)
    status: Optional[str] = "draft"
    note_type: Optional[str] = None
    priority: Optional[str] = None

class NoteCreate(NoteBase):
    tag_ids: Optional[list[UUID]] = None
    subject_ids: Optional[list[UUID]] = None
    task_ids: Optional[list[UUID]] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    folder_id: Optional[UUID] = None
    content_json: Optional[Dict[str, Any]] = None
    content_markdown: Optional[str] = None
    ui_metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    note_type: Optional[str] = None
    priority: Optional[str] = None
    tag_ids: Optional[list[UUID]] = None
    subject_ids: Optional[list[UUID]] = None
    task_ids: Optional[list[UUID]] = None

class NoteRead(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    tags: list[NoteTagRead] = []
    subject_ids: list[UUID] = []
    task_ids: list[UUID] = []
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PAGINATION & SPARSE FIELDSETS
# ==========================================
class NoteListItem(BaseModel):
    """Lean read schema for list views — heavy blobs omitted by default."""
    id: UUID
    title: str
    folder_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    content_json: Optional[Dict[str, Any]] = None
    content_markdown: Optional[str] = None
    ui_metadata: Optional[Dict[str, Any]] = None
    deleted_at: Optional[datetime] = None
    status: Optional[str] = None
    note_type: Optional[str] = None
    priority: Optional[str] = None
    tags: list[NoteTagRead] = []
    subject_ids: list[UUID] = []
    task_ids: list[UUID] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedNotesResponse(BaseModel):
    items: list[NoteListItem]
    total: int
    skip: int
    limit: int


# ==========================================
# SEARCH SCHEMAS
# ==========================================
class NoteSearchQuery(BaseModel):
    q: str = Field(..., min_length=1, max_length=500)
    subject_ids: Optional[list[UUID]] = None
    tag_ids: Optional[list[UUID]] = None
    status: Optional[str] = None
    note_type: Optional[str] = None
    folder_id: Optional[UUID] = None
    limit: int = Field(default=20, le=100)
    offset: int = Field(default=0, ge=0)

class NoteSearchResult(BaseModel):
    id: UUID
    title: str
    snippet: str                    # Highlighted snippet
    status: Optional[str] = None
    tags: list[NoteTagRead] = []
    subject_ids: list[UUID] = []
    folder_id: Optional[UUID] = None
    updated_at: datetime
    rank: float                     # Relevance score

    model_config = ConfigDict(from_attributes=True)

class NoteSearchResponse(BaseModel):
    items: list[NoteSearchResult]
    total: int
    query: str


# ==========================================================
# NOTE TEMPLATE SCHEMAS
# ==========================================
class NoteTemplateCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    mode: str = Field(default='document', max_length=20)
    content_json: Dict[str, Any] = Field(default_factory=dict)
    thumbnail: Optional[str] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = Field(None, max_length=100)

class NoteTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = Field(None, max_length=100)

class NoteTemplateRead(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    mode: str
    content_json: Dict[str, Any]
    thumbnail: Optional[str] = None
    is_public: bool
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    usage_count: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NoteCheckpointCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class NoteSyncedBlockCreate(BaseModel):
    content_json: Dict[str, Any] = Field(default_factory=dict)


class NoteSyncedBlockRead(BaseModel):
    id: UUID
    user_id: UUID
    content_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteSyncedBlockUpdate(BaseModel):
    content_json: Dict[str, Any]

# ==========================================
# THEME & WORKSPACE KIT SCHEMAS (Phase 6)
# ==========================================
class ThemeResponse(BaseModel):
    id: str
    name: str
    is_dark: bool
    css_variables: Dict[str, str]

    model_config = ConfigDict(from_attributes=True)

class WorkspaceKitResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    theme: ThemeResponse

    model_config = ConfigDict(from_attributes=True)

class WorkspaceKitApplyRequest(BaseModel):
    folder_name_mappings: Dict[str, str] = Field(default_factory=dict)
    template_notes: list[str] = Field(default_factory=list)


class BlockStylePresetResponse(BaseModel):
    id: str
    name: str
    block_type: str
    styles: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

class BatchUpdateThemeRequest(BaseModel):
    note_ids: list[UUID]
    theme_id: str
