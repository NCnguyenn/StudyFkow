import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.app.main import app
from backend.features.user_auth.domain.models import UserSummary
from backend.features.task_management.api.dependencies import get_task_service, get_subject_service
from backend.features.user_auth.api.dependencies import get_current_user

def override_get_current_user():
    return UserSummary(
        user_id=uuid4(),
        email="test@example.com",
        display_name="Test User",
        subscription_tier="free",
        soul_color_hex="#e2e8f0",
        lite_mode_enabled=False
    )

@pytest.fixture(autouse=True)
def overrides():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def mock_subject_service():
    service = AsyncMock()
    app.dependency_overrides[get_subject_service] = lambda: service
    yield service
    app.dependency_overrides.pop(get_subject_service, None)

@pytest.fixture
def mock_task_service():
    service = AsyncMock()
    app.dependency_overrides[get_task_service] = lambda: service
    yield service
    app.dependency_overrides.pop(get_task_service, None)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

# --- Subject Endpoints Tests ---

@pytest.mark.asyncio
async def test_create_subject(client, mock_subject_service):
    from backend.features.task_management.domain.models import SubjectRead
    mock_subject_service.create_subject.return_value = SubjectRead(
        id=uuid4(), user_id=uuid4(), title="Math", priority="HIGH",
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )

    response = await client.post("/api/v1/subjects", json={"title": "Math", "priority": "HIGH"})
    assert response.status_code == 201
    assert response.json()["title"] == "Math"

@pytest.mark.asyncio
async def test_get_subjects(client, mock_subject_service):
    mock_subject_service.list_subjects.return_value = []
    response = await client.get("/api/v1/subjects")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_subject_analytics(client, mock_subject_service):
    mock_subject_service.get_subject_analytics.return_value = {
        "total_actual_minutes": 120,
        "on_time_completion_rate": 100.0,
        "total_closed_tasks": 2
    }
    response = await client.get(f"/api/v1/subjects/{uuid4()}/analytics")
    assert response.status_code == 200
    assert response.json()["total_actual_minutes"] == 120

@pytest.mark.asyncio
async def test_delete_subject(client, mock_subject_service):
    response = await client.delete(f"/api/v1/subjects/{uuid4()}")
    assert response.status_code == 204

# --- Task Endpoints Tests ---

@pytest.mark.asyncio
async def test_create_task(client, mock_task_service):
    from backend.features.task_management.domain.models import TaskRead
    now = datetime.now(timezone.utc)
    mock_task_service.create_task.return_value = TaskRead(
        id=uuid4(), user_id=uuid4(), title="Study", planned_start=now, planned_end=now+timedelta(hours=1),
        priority=2, status="PENDING", task_status="PENDING", completion_status="INCOMPLETE",
        is_deleted=False, created_at=now, updated_at=now
    )

    payload = {
        "title": "Study",
        "planned_start": now.isoformat(),
        "planned_end": (now + timedelta(hours=1)).isoformat(),
        "priority": 2
    }

    response = await client.post("/api/v1/tasks", json=payload)
    assert response.status_code == 201
    assert response.json()["title"] == "Study"

@pytest.mark.asyncio
async def test_get_tasks(client, mock_task_service):
    mock_task_service.list_tasks.return_value = []
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_task(client, mock_task_service):
    from backend.features.task_management.domain.models import TaskRead
    now = datetime.now(timezone.utc)
    mock_task_service.get_task.return_value = TaskRead(
        id=uuid4(), user_id=uuid4(), title="Study", planned_start=now, planned_end=now+timedelta(hours=1),
        priority=2, status="PENDING", task_status="PENDING", completion_status="INCOMPLETE",
        is_deleted=False, created_at=now, updated_at=now
    )

    response = await client.get(f"/api/v1/tasks/{uuid4()}")
    assert response.status_code == 200
    assert response.json()["title"] == "Study"

@pytest.mark.asyncio
async def test_update_task(client, mock_task_service):
    from backend.features.task_management.domain.models import TaskRead
    now = datetime.now(timezone.utc)
    mock_task_service.update_task.return_value = TaskRead(
        id=uuid4(), user_id=uuid4(), title="Study Updated", planned_start=now, planned_end=now+timedelta(hours=1),
        priority=2, status="PENDING", task_status="PENDING", completion_status="INCOMPLETE",
        is_deleted=False, created_at=now, updated_at=now
    )

    response = await client.patch(f"/api/v1/tasks/{uuid4()}", json={"title": "Study Updated"})
    assert response.status_code == 200
    assert response.json()["title"] == "Study Updated"

@pytest.mark.asyncio
async def test_update_task_state(client, mock_task_service):
    from backend.features.task_management.domain.models import TaskRead
    now = datetime.now(timezone.utc)
    mock_task_service.update_task_state.return_value = TaskRead(
        id=uuid4(), user_id=uuid4(), title="Study", planned_start=now, planned_end=now+timedelta(hours=1),
        priority=2, status="PENDING", task_status="IN_PROGRESS", completion_status="INCOMPLETE",
        is_deleted=False, created_at=now, updated_at=now
    )

    response = await client.patch(f"/api/v1/tasks/{uuid4()}/state", json={"task_status": "IN_PROGRESS"})
    assert response.status_code == 200
    assert response.json()["task_status"] == "IN_PROGRESS"

@pytest.mark.asyncio
async def test_rollover_task(client, mock_task_service):
    from backend.features.task_management.domain.models import TaskRead
    now = datetime.now(timezone.utc)
    mock_task_service.rollover_failed_task.return_value = TaskRead(
        id=uuid4(), user_id=uuid4(), title="Study (Rollover)", planned_start=now, planned_end=now+timedelta(hours=1),
        priority=2, status="PENDING", task_status="PENDING", completion_status="INCOMPLETE",
        is_deleted=False, created_at=now, updated_at=now
    )

    response = await client.post(f"/api/v1/tasks/{uuid4()}/rollover", json={"target_date": now.isoformat()})
    assert response.status_code == 200
    assert response.json()["title"] == "Study (Rollover)"

@pytest.mark.asyncio
async def test_delete_task(client, mock_task_service):
    response = await client.delete(f"/api/v1/tasks/{uuid4()}")
    assert response.status_code == 204
