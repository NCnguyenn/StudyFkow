import uuid
from datetime import datetime, UTC
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Index, Boolean, Integer, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Base is provided by core base config
from backend.app.core.base import Base


# =====================================================================
# FOLDER
# =====================================================================

class NoteFolderModel(Base):
    __tablename__ = "note_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    ui_metadata = Column(JSONB, nullable=False, server_default='{}', default=dict)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)
    workspace_kit_id = Column(String(50), nullable=True)

    # The "Many-to-One" side (Child pointing up to Parent)
    # remote_side=[id] MUST be placed here so SQLAlchemy knows 'id' is the remote target
    parent = relationship(
        "NoteFolderModel",
        remote_side=[id],
        back_populates="sub_folders"
    )

    # The "One-to-Many" side (Parent pointing down to Children)
    # cascade="all, delete-orphan" MUST be placed here
    sub_folders = relationship(
        "NoteFolderModel",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    
    notes = relationship("NoteModel", back_populates="folder")

    __table_args__ = (
        Index("idx_note_folders_hierarchy", "user_id", "parent_id"),
        {"extend_existing": True}
    )


# =====================================================================
# TAGS (Phase 1.1)
# =====================================================================

class NoteTagModel(Base):
    """User-scoped tag for categorising notes (many-to-many via note_tag_mappings)."""
    __tablename__ = "note_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")  # hex color

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    notes = relationship("NoteModel", secondary="note_tag_mappings", back_populates="tags", lazy="selectin")

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_note_tags_user_name'),
        Index('idx_note_tags_user', 'user_id'),
        {"extend_existing": True}
    )


class NoteTagMappingModel(Base):
    """Association table: note ↔ tag (many-to-many)."""
    __tablename__ = "note_tag_mappings"

    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("note_tags.id", ondelete="CASCADE"), primary_key=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        {"extend_existing": True},
    )


# =====================================================================
# MULTI-SUBJECT / MULTI-TASK LINKING (Phase 1.2)
# =====================================================================

class NoteSubjectModel(Base):
    """Association table: note ↔ subject (many-to-many, replaces old notes.subject_id FK)."""
    __tablename__ = "note_subjects"

    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        Index("idx_note_subjects_note", "note_id"),
        Index("idx_note_subjects_subject", "subject_id"),
        {"extend_existing": True}
    )


class NoteTaskModel(Base):
    """Association table: note ↔ task (many-to-many, replaces old notes.task_id FK)."""
    __tablename__ = "note_tasks"

    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        Index("idx_note_tasks_note", "note_id"),
        Index("idx_note_tasks_task", "task_id"),
        {"extend_existing": True}
    )


# =====================================================================
# NOTE (core entity)
# =====================================================================

class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False, default="Untitled Note")
    content_json = Column(JSONB, nullable=False, default=dict)
    content_markdown = Column(Text, nullable=True)
    ui_metadata = Column(JSONB, nullable=False, server_default='{}', default=dict)
    theme_id = Column(String(50), nullable=True)
    layout_data = Column(JSONB, nullable=True)

    # Phase 1.1: Custom properties
    status = Column(String(20), nullable=True, default="draft")        # draft | in_progress | reviewed | archived
    note_type = Column(String(30), nullable=True)                       # lecture | reading | problem_set | essay | lab_report
    priority = Column(String(10), nullable=True)                        # low | medium | high

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)

    # Relationships
    folder = relationship("NoteFolderModel", back_populates="notes")
    tags = relationship("NoteTagModel", secondary="note_tag_mappings", back_populates="notes", lazy="selectin")
    subjects = relationship("NoteSubjectModel", cascade="all, delete-orphan", lazy="selectin")
    tasks = relationship("NoteTaskModel", cascade="all, delete-orphan", lazy="selectin")

    @property
    def subject_ids(self) -> list[uuid.UUID]:
        return [s.subject_id for s in self.subjects]

    @property
    def task_ids(self) -> list[uuid.UUID]:
        return [t.task_id for t in self.tasks]

    __table_args__ = (
        Index("idx_notes_content_json_gin", "content_json", postgresql_using="gin"),
        {"extend_existing": True},
    )


# =====================================================================
# ZETTELKASTEN LINKS
# =====================================================================

class NoteLinkModel(Base):
    """
    Zettelkasten bi-directional link tracking.
    Each row represents a [[wikilink]] from source_id → target_id.
    Links are rebuilt on every note save (delete-all-for-source then batch-insert).
    """
    __tablename__ = "note_links"

    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    target_id = Column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_note_links_source", "source_id"),
        Index("idx_note_links_target", "target_id"),
        {"extend_existing": True}
    )


# =====================================================================
# VERSION HISTORY
# =====================================================================

class NoteVersionModel(Base):
    """Note Version History tracking — snapshots before each content edit."""
    __tablename__ = "note_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    content_json = Column(JSONB, nullable=False, default=dict)
    name = Column(String(255), nullable=True)
    is_checkpoint = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        Index("idx_note_versions_note_id", "note_id"),
        {"extend_existing": True}
    )


# =====================================================================
# TEMPLATES
# =====================================================================

class NoteTemplateModel(Base):
    __tablename__ = "note_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    mode = Column(String(20), nullable=False, default='document')  # 'document' or 'freeform'

    content_json = Column(JSONB, nullable=False, default=dict)
    thumbnail = Column(Text, nullable=True)  # base64 or URL
    is_public = Column(Boolean, default=False)

    tags = Column(ARRAY(Text), nullable=True, default=list)
    category = Column(
        Enum('language_learning', 'academic', 'research', 'project_management', 
             'content_creation', 'personal', 'business', 'creative', 
             name='template_category', native_enum=False, length=50),
        nullable=True
    )
    subcategory = Column(String(50), nullable=True)
    preview_image = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=True)
    blocks_used = Column(ARRAY(Text), nullable=True)
    theme_id = Column(String(50), nullable=True)

    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)

    __table_args__ = (
        Index("idx_note_templates_user", "user_id"),
        {"extend_existing": True}
    )


# =====================================================================
# SYNCED BLOCKS
# =====================================================================

class NoteSyncedBlockModel(Base):
    __tablename__ = "note_synced_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_json = Column(JSONB, nullable=False, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        Index("idx_note_synced_blocks_user_id", "user_id"),
        {"extend_existing": True}
    )

