from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    String, Text, Boolean, Integer, DateTime, ForeignKey, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from backend.app.core.base import Base

priority_enum = ENUM('LOW', 'MEDIUM', 'HIGH', name='priority_enum', create_type=False)

class SubjectModel(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(priority_enum, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("color ~ '^#[0-9a-fA-F]{6}$'", name="check_valid_hex_color_subject"),
    )

    tasks: Mapped[List["TaskModel"]] = relationship("TaskModel", back_populates="subject", cascade="all, delete-orphan")


class TaskCategoryModel(Base):
    __tablename__ = "task_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color_code: Mapped[str] = mapped_column(String(7), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("color_code ~ '^#[0-9a-fA-F]{6}$'", name="check_valid_hex_color_category"),
    )

    tasks: Mapped[List["TaskModel"]] = relationship("TaskModel", back_populates="category")


class TaskModel(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("task_categories.id", ondelete="SET NULL"), nullable=True)
    
    # NEW PLANNER FIELDS
    subject_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    subtasks: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    overtime_buffer_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    failed_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    task_status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    
    color_code: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    
    planned_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    planned_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    completion_status: Mapped[str] = mapped_column(String(50), nullable=False, default="INCOMPLETE")
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category: Mapped[Optional["TaskCategoryModel"]] = relationship("TaskCategoryModel", back_populates="tasks")
    subject: Mapped[Optional["SubjectModel"]] = relationship("SubjectModel", back_populates="tasks")

    __table_args__ = (
        CheckConstraint("planned_end > planned_start", name="check_planned_time_range"),
        CheckConstraint("priority >= 1 AND priority <= 3", name="check_priority_range"),
        CheckConstraint("color_code ~ '^#[0-9a-fA-F]{6}$'", name="check_valid_hex_color_task"),
    )
