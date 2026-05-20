from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, Body

from backend.features.user_auth.api.dependencies import get_current_user
from backend.features.user_auth.domain.models import UserSummary

from ..domain.models import TaskCreate, TaskUpdate, TaskRead, SubjectRead, SubjectCreate
from ..application.service import TaskService, SubjectService
from .dependencies import get_task_service, get_subject_service

# Define multiple routers or merge them into one main router
router = APIRouter()

# --- SUBJECT ENDPOINTS ---
subject_router = APIRouter(prefix="/subjects", tags=["subjects"])

@subject_router.post("", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_in: SubjectCreate,
    current_user: UserSummary = Depends(get_current_user),
    subject_service: SubjectService = Depends(get_subject_service)
):
    """Create a new subject for the authenticated user."""
    return await subject_service.create_subject(user_id=current_user.user_id, subject_create=subject_in)

@subject_router.get("", response_model=List[SubjectRead], status_code=status.HTTP_200_OK)
async def get_subjects(
    current_user: UserSummary = Depends(get_current_user),
    subject_service: SubjectService = Depends(get_subject_service)
):
    """Retrieve all subjects for the authenticated user."""
    return await subject_service.list_subjects(user_id=current_user.user_id)

@subject_router.get("/{subject_id}/analytics", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_subject_analytics(
    subject_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    subject_service: SubjectService = Depends(get_subject_service)
):
    """Retrieve analytics for a specific subject."""
    return await subject_service.get_subject_analytics(subject_id=subject_id, user_id=current_user.user_id)

@subject_router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    subject_service: SubjectService = Depends(get_subject_service)
):
    """Delete a subject."""
    await subject_service.delete_subject(subject_id=subject_id, user_id=current_user.user_id)

# --- TASK ENDPOINTS ---
task_router = APIRouter(prefix="/tasks", tags=["tasks"])

@task_router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Create a new task for the authenticated user."""
    return await task_service.create_task(user_id=current_user.user_id, task_create=task_in)

@task_router.get("", response_model=List[TaskRead], status_code=status.HTTP_200_OK)
async def get_tasks(
    start_date: Optional[datetime] = Query(None, description="Start date for calendar view filtering (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date for calendar view filtering (UTC)"),
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Retrieve all active tasks for the authenticated user, optionally filtered by date range."""
    return await task_service.list_tasks(
        user_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date
    )

@task_router.get("/{task_id}", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def get_task(
    task_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Retrieve a specific task by its ID."""
    return await task_service.get_task(task_id=task_id, user_id=current_user.user_id)

@task_router.patch("/{task_id}", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def update_task(
    task_id: UUID,
    task_update: TaskUpdate,
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Update an existing task."""
    return await task_service.update_task(
        task_id=task_id, 
        user_id=current_user.user_id, 
        task_update=task_update
    )

@task_router.patch("/{task_id}/state", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def update_task_state(
    task_id: UUID,
    task_status: str = Body(..., embed=True),
    failed_reason: Optional[str] = Body(None, embed=True),
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Update the state of a task (e.g., PENDING -> IN_PROGRESS -> USING_OVERTIME -> FAILED)."""
    return await task_service.update_task_state(
        task_id=task_id,
        user_id=current_user.user_id,
        new_status=task_status,
        failed_reason=failed_reason
    )

@task_router.post("/{task_id}/rollover", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def rollover_task(
    task_id: UUID,
    target_date: datetime = Body(..., embed=True),
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Rollover a failed task to a new target date, extracting unfinished subtasks."""
    return await task_service.rollover_failed_task(
        task_id=task_id,
        target_date=target_date,
        user_id=current_user.user_id
    )

@task_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Soft delete a task."""
    await task_service.delete_task(task_id=task_id, user_id=current_user.user_id)

router.include_router(subject_router)
router.include_router(task_router)
