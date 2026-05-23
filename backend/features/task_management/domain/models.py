from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

# --- Subtask Schema ---
class SubtaskItem(BaseModel):
    id: str
    title: str
    is_completed: bool = False

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: Optional[str] = None
    priority: Literal['LOW', 'MEDIUM', 'HIGH'] = 'MEDIUM'
    color: Optional[str] = Field(None, pattern=r'^#[0-9a-fA-F]{6}$')

class SubjectCreate(SubjectBase):
    pass

class SubjectRead(SubjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- TaskCategory Schemas ---
class TaskCategoryBase(BaseModel):
    name: str = Field(..., max_length=50)
    color_code: str = Field(..., pattern=r'^#[0-9a-fA-F]{6}$')

class TaskCategoryCreate(TaskCategoryBase):
    pass

class TaskCategoryRead(TaskCategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    subtasks: Optional[List[SubtaskItem]] = None
    recurrence_rule: Optional[str] = None
    overtime_buffer_minutes: Optional[int] = None
    color_code: Optional[str] = Field(None, pattern=r'^#[0-9a-fA-F]{6}$')
    planned_start: datetime
    planned_end: datetime
    priority: int = Field(default=2, ge=1, le=3)
    status: str = Field(default="PENDING")
    task_status: Literal['PENDING', 'IN_PROGRESS', 'USING_OVERTIME', 'FAILED', 'COMPLETED'] = 'PENDING'
    failed_reason: Optional[str] = None
    linked_note_id: Optional[UUID] = None

    @field_validator('planned_end')
    @classmethod
    def check_time_range(cls, v: datetime, info):
        planned_start = info.data.get('planned_start')
        if planned_start and v <= planned_start:
            raise ValueError('planned_end must be strictly greater than planned_start')
        return v

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    subtasks: Optional[List[SubtaskItem]] = None
    recurrence_rule: Optional[str] = None
    overtime_buffer_minutes: Optional[int] = None
    failed_reason: Optional[str] = None
    linked_note_id: Optional[UUID] = None
    color_code: Optional[str] = Field(None, pattern=r'^#[0-9a-fA-F]{6}$')
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    status: Optional[str] = None
    completion_status: Optional[str] = Field(None, pattern=r'^(ON_TIME|LATE|INCOMPLETE)$')
    is_deleted: Optional[bool] = None

class TaskRead(TaskBase):
    id: UUID
    user_id: UUID
    completion_status: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
