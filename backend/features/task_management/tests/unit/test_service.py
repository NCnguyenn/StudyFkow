import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.features.task_management.application.service import SubjectService, TaskService
from backend.features.task_management.domain.models import SubjectCreate, TaskCreate, TaskUpdate
from fastapi import HTTPException

# Models for mocking
class MockSubject:
    def __init__(self, id, user_id, title, description=None, priority='MEDIUM', color=None):
        self.id = id
        self.user_id = user_id
        self.title = title
        self.description = description
        self.priority = priority
        self.color = color
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

class MockTask:
    def __init__(self, id, user_id, title, planned_start, planned_end, **kwargs):
        self.id = id
        self.user_id = user_id
        self.title = title
        self.description = kwargs.get('description', None)
        self.category_id = kwargs.get('category_id', None)
        self.subject_id = kwargs.get('subject_id', None)
        self.subtasks = kwargs.get('subtasks', [])
        self.color_code = kwargs.get('color_code', None)
        self.priority = kwargs.get('priority', 2)
        self.planned_start = planned_start
        self.planned_end = planned_end
        self.task_status = kwargs.get('task_status', 'PENDING')
        self.completion_status = kwargs.get('completion_status', 'INCOMPLETE')
        self.overtime_buffer_minutes = kwargs.get('overtime_buffer_minutes', 0)
        self.linked_note_id = kwargs.get('linked_note_id', None)
        self.is_deleted = kwargs.get('is_deleted', False)
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        for k, v in kwargs.items():
            setattr(self, k, v)

@pytest.mark.asyncio
async def test_subject_service_create():
    mock_repo = AsyncMock()
    mock_task_repo = AsyncMock()
    service = SubjectService(mock_repo, mock_task_repo)

    user_id = uuid4()
    create_data = SubjectCreate(title="Math", priority="HIGH")

    mock_repo.create_subject.return_value = MockSubject(id=uuid4(), user_id=user_id, title="Math", priority="HIGH")

    result = await service.create_subject(user_id, create_data)
    assert result.title == "Math"
    mock_repo.create_subject.assert_called_once_with(user_id, create_data)

@pytest.mark.asyncio
async def test_subject_service_delete_not_found():
    mock_repo = AsyncMock()
    mock_task_repo = AsyncMock()
    service = SubjectService(mock_repo, mock_task_repo)

    mock_repo.get_subject_by_id.return_value = None

    with pytest.raises(HTTPException) as exc:
        await service.delete_subject(uuid4(), uuid4())
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_task_service_create():
    mock_repo = AsyncMock()
    service = TaskService(mock_repo)

    user_id = uuid4()
    now = datetime.now(timezone.utc)
    end = now + timedelta(hours=1)

    create_data = TaskCreate(
        title="Study",
        planned_start=now,
        planned_end=end,
        priority=2
    )

    mock_repo.create_task.return_value = MockTask(id=uuid4(), user_id=user_id, title="Study", planned_start=now, planned_end=end)

    result = await service.create_task(user_id, create_data)
    assert result.title == "Study"
    mock_repo.create_task.assert_called_once_with(user_id, create_data)

@pytest.mark.asyncio
async def test_task_service_update_invalid_dates():
    mock_repo = AsyncMock()
    service = TaskService(mock_repo)

    user_id = uuid4()
    task_id = uuid4()
    now = datetime.now(timezone.utc)

    mock_repo.get_task_by_id.return_value = MockTask(
        id=task_id, user_id=user_id, title="Study",
        planned_start=now, planned_end=now + timedelta(hours=1)
    )

    update_data = TaskUpdate(planned_end=now - timedelta(hours=1)) # End before start

    with pytest.raises(HTTPException) as exc:
        await service.update_task(task_id, user_id, update_data)
    assert exc.value.status_code == 400

@pytest.mark.asyncio
async def test_task_service_update_state():
    mock_repo = AsyncMock()
    service = TaskService(mock_repo)

    user_id = uuid4()
    task_id = uuid4()
    now = datetime.now(timezone.utc)

    mock_repo.get_task_by_id.return_value = MockTask(
        id=task_id, user_id=user_id, title="Study",
        planned_start=now, planned_end=now + timedelta(hours=1),
        task_status='PENDING'
    )

    mock_repo.update_task = AsyncMock(side_effect=lambda t, data: MockTask(id=t.id, user_id=t.user_id, title=t.title, planned_start=t.planned_start, planned_end=t.planned_end, task_status=data['task_status']))

    with patch("backend.features.notes.application.service.create_note") as mock_create_note:
        # Mock what create_note returns (has an id attr)
        class MockNote:
            def __init__(self, id):
                self.id = id
        mock_create_note.return_value = MockNote(id=uuid4())

        result = await service.update_task_state(task_id, user_id, "IN_PROGRESS")
        assert result.task_status == "IN_PROGRESS"

@pytest.mark.asyncio
async def test_task_service_rollover():
    mock_repo = AsyncMock()
    service = TaskService(mock_repo)

    user_id = uuid4()
    task_id = uuid4()
    now = datetime.now(timezone.utc)
    duration = timedelta(hours=1)
    end = now + duration

    failed_task = MockTask(
        id=task_id, user_id=user_id, title="Study",
        planned_start=now, planned_end=end,
        task_status='FAILED',
        subtasks=[{"id": "1", "title": "sub1", "is_completed": False}]
    )
    mock_repo.get_task_by_id.return_value = failed_task

    target_date = now + timedelta(days=1)

    mock_repo.create_task.return_value = MockTask(
        id=uuid4(), user_id=user_id, title="Study (Rollover)",
        planned_start=target_date, planned_end=target_date + duration
    )

    result = await service.rollover_failed_task(task_id, target_date, user_id)
    assert result.title == "Study (Rollover)"
    assert result.planned_start == target_date
    assert result.planned_end == target_date + duration
