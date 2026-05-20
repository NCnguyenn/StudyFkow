import uuid
from datetime import datetime, UTC
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

# Base is provided by core base config
from backend.app.core.base import Base

class NoteFolderModel(Base):
    __tablename__ = "note_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

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
    )


class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True)
    
    # Bi-Directional Linking Fields
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False, default="Untitled Note")
    content_json = Column(JSONB, nullable=False, default=dict)
    content_markdown = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    folder = relationship("NoteFolderModel", back_populates="notes")

    __table_args__ = (
        Index("idx_notes_relations", "subject_id", "task_id"),
    )


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
    )
