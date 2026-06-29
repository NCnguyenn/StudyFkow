# 🧪 AI StudyFlow — Backend Testing Guide

> **Audience:** AI coding agents (Jules, Copilot, Claude) and human contributors.
> **Last updated:** 2026-06-27

---

## Table of Contents

1. [Tổng quan (Overview)](#1-tổng-quan-overview)
2. [Test Structure](#2-test-structure)
3. [Unit Test Patterns](#3-unit-test-patterns)
4. [Integration Test Patterns](#4-integration-test-patterns)
5. [Mocking External Services](#5-mocking-external-services)
6. [Existing Tests Reference](#6-existing-tests-reference)
7. [Coverage Targets](#7-coverage-targets)
8. [Running Tests](#8-running-tests)
9. [CI Integration Notes](#9-ci-integration-notes)

---

## 1. Tổng quan (Overview)

### Current State

The backend currently has **only 2 test files**:

| File | Module | Type |
|------|--------|------|
| `features/study_sessions/tests/unit/test_session_service.py` | study_sessions | Unit |
| `features/notes/tests/unit/test_notes_service.py` | notes | Unit |

### Target

- **≥ 70% coverage** on all core modules.
- High-priority modules (`user_auth`, `study_sessions`, `task_management`) must reach **≥ 80%**.

### Framework & Dependencies

| Package | Purpose |
|---------|---------|
| `pytest` | Test runner & assertions |
| `pytest-asyncio` | Async test support (`mode = "auto"`) |
| `unittest.mock` | `AsyncMock`, `patch`, `MagicMock` |
| `httpx` | Async HTTP client for integration tests |
| `pytest-cov` | Coverage reporting |

> [!IMPORTANT]
> All async fixtures and tests **must** use `pytest-asyncio`. Set `asyncio_mode = "auto"` in `pyproject.toml` or `pytest.ini` so you don't need to decorate every fixture with `@pytest_asyncio.fixture`.

---

## 2. Test Structure

Every feature module follows a **standardized** test layout:

```
backend/features/{module}/tests/
├── __init__.py
├── conftest.py            # Module-level fixtures (mock repos, services, etc.)
├── unit/
│   ├── __init__.py
│   ├── test_service.py    # Service layer tests (business logic)
│   └── test_schemas.py    # Pydantic validation tests
└── integration/
    ├── __init__.py
    └── test_router.py     # API endpoint tests (HTTP layer)
```

> [!NOTE]
> The `__init__.py` files are **required** in every test directory so that `pytest` can discover and collect tests correctly across the nested package structure.

**Shared fixtures** live at the repository root:

```
backend/
├── conftest.py            # Root-level shared fixtures (async client, DB session, auth helpers)
└── features/
    └── {module}/tests/
        └── conftest.py    # Module-specific fixtures
```

---

## 3. Unit Test Patterns

Unit tests validate **business logic in isolation** — no database, no network, no Redis.

### 3.1 Testing Services

```python
import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.mark.asyncio
async def test_service_method():
    # ── Arrange ──────────────────────────────────────────────

    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = SomeDomainObject(
        id=uuid4(),
        name="Test Object",
        status="active",
    )
    service = SomeService(repository=mock_repo)

    # ── Act ──────────────────────────────────────────────────
    result = await service.do_something(id=uuid4())

    # ── Assert ───────────────────────────────────────────────
    assert result is not None
    assert result.status == "active"
    mock_repo.get_by_id.assert_called_once()
```

> [!TIP]
> Always follow the **Arrange → Act → Assert** pattern. It keeps tests readable and makes failures easy to diagnose.

### 3.2 Testing Pydantic Schemas

```python
import pytest
from pydantic import ValidationError

def test_schema_validation_success():
    """Valid input should produce a schema instance with correct values."""
    data = {"email": "test@test.com", "password": "12345678"}
    schema = UserRegistrationRequest(**data)
    assert schema.email == "test@test.com"

def test_schema_validation_failure():
    """Invalid email or short password should raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        UserRegistrationRequest(email="invalid", password="short")
    
    errors = exc_info.value.errors()
    assert len(errors) > 0
```

### 3.3 Testing Edge Cases & Errors

```python
import pytest

@pytest.mark.asyncio
async def test_service_raises_on_not_found():
    """Service should raise NotFoundError when the entity doesn't exist."""
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None
    service = SomeService(repository=mock_repo)

    with pytest.raises(NotFoundError):
        await service.get_entity(id=uuid4())
```

---

## 4. Integration Test Patterns

Integration tests exercise the **full HTTP request/response cycle** through FastAPI.

### 4.1 Testing API Endpoints

```python
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.fixture
async def client():
    """Async HTTP client bound to the FastAPI app (no real server needed)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

### 4.2 Testing Authenticated Endpoints

```python
@pytest.fixture
async def auth_headers(client):
    """Register a test user and return valid auth headers."""
    registration_data = {
        "email": "testuser@example.com",
        "password": "SecurePass123!",
        "display_name": "Test User",
    }
    await client.post("/api/v1/auth/register", json=registration_data)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": registration_data["email"], "password": registration_data["password"]},
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_task(client, auth_headers):
    response = await client.post(
        "/api/v1/tasks",
        json={
            "title": "Finish calculus homework",
            "planned_start": "2026-06-28T09:00:00Z",
            "planned_end": "2026-06-28T11:00:00Z",
            "priority": 1,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["data"]["title"] == "Finish calculus homework"
```

### 4.3 Testing Error Responses

```python
@pytest.mark.asyncio
async def test_create_task_unauthenticated(client):
    """Requests without auth headers should return 401."""
    response = await client.post("/api/v1/tasks", json={"title": "No auth"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_task_invalid_payload(client, auth_headers):
    """Invalid payloads should return 422 with validation details."""
    response = await client.post(
        "/api/v1/tasks",
        json={"title": ""},  # Missing required fields
        headers=auth_headers,
    )
    assert response.status_code == 422
```

---

## 5. Mocking External Services

> [!WARNING]
> **Never** call real databases, Redis, or LLM APIs in unit tests. Always mock external dependencies.

### 5.1 Mocking Database Sessions

```python
from unittest.mock import AsyncMock

@pytest.fixture
def mock_session():
    """Simulates an async SQLAlchemy session."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.refresh = AsyncMock()
    return session
```

### 5.2 Mocking Redis

```python
@pytest.fixture
def mock_redis():
    """Simulates an async Redis client."""
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    redis.publish = AsyncMock(return_value=1)
    redis.expire = AsyncMock(return_value=True)
    return redis
```

### 5.3 Mocking LLM Providers

```python
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch("backend.features.ai_pipeline.application.factory.get_llm_provider")
async def test_insight_generation(mock_get_provider):
    # Configure the mock provider
    mock_provider = AsyncMock()
    mock_provider.generate_insight = AsyncMock(
        return_value="Based on your study patterns, consider spacing out review sessions."
    )
    mock_get_provider.return_value = mock_provider

    # ... invoke the service that calls the LLM
    result = await insight_service.generate(user_id=uuid4())

    assert "study patterns" in result
    mock_provider.generate_insight.assert_called_once()
```

### 5.4 Mocking WebSocket Connections

```python
@pytest.fixture
def mock_websocket():
    """Simulates a FastAPI WebSocket connection."""
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    ws.receive_json = AsyncMock(return_value={"type": "ping"})
    ws.close = AsyncMock()
    return ws
```

---

## 6. Existing Tests Reference

Use these as **canonical examples** when writing new tests.

### `features/study_sessions/tests/unit/test_session_service.py`

| Test Name | What It Verifies |
|-----------|-----------------|
| `test_session_start_idempotency` | Sending a duplicate `client_session_id` returns the **existing** session instead of creating a new one. |
| `test_session_start_fails_if_active_session_exists` | Starting a new session while one is already active raises `ActiveSessionExistsError`. |

### `features/notes/tests/unit/test_notes_service.py`

| Test Name | What It Verifies |
|-----------|-----------------|
| `test_get_workspace_data` | Fetches the full workspace tree for a user. |
| `test_create_folder` | Creates a new folder in the workspace. |
| `test_delete_folder` | Soft-deletes a folder (sets `deleted_at`). |
| `test_create_note` | Creates a new note inside a folder. |
| `test_delete_note` | Soft-deletes a note (sets `deleted_at`). |

> [!TIP]
> When adding tests for a new module, read these files first to match the project's existing style and assertion patterns.

---

## 7. Coverage Targets

| Module | Priority | Target Coverage | Key Focus Areas |
|--------|----------|:---------------:|-----------------|
| `user_auth` | 🔴 HIGH | **≥ 80%** | Registration, login, token refresh, password reset |
| `study_sessions` | 🔴 HIGH | **≥ 80%** | Start/stop/pause, idempotency, duration tracking |
| `task_management` | 🔴 HIGH | **≥ 80%** | CRUD, status transitions, priority validation |
| `analytics` | 🟡 MEDIUM | **≥ 70%** | Aggregation queries, streak calculation |
| `notes` | 🟡 MEDIUM | **≥ 70%** | Workspace CRUD, folder hierarchy, soft delete |
| `chat` | 🟡 MEDIUM | **≥ 60%** | Message routing, session management |
| `ai_pipeline` | 🟢 LOW | **≥ 50%** | Provider factory, prompt construction |
| `realtime` | 🟢 LOW | **≥ 50%** | SSE lifecycle, pub/sub events |

> [!IMPORTANT]
> **Minimum bar for any PR:** No module should drop below its current coverage percentage. All new code must include tests.

---

## 8. Running Tests

### Basic Commands

```bash
# Run all tests with verbose output
pytest backend/ -v

# Run tests for a specific module
pytest backend/features/user_auth/tests/ -v

# Run with coverage report (HTML)
pytest backend/ --cov=backend --cov-report=html

# Run with coverage report (terminal summary)
pytest backend/ --cov=backend --cov-report=term-missing
```

### Filtering Tests

```bash
# Only unit tests
pytest backend/ -v -k "unit"

# Only integration tests
pytest backend/ -v -k "integration"

# Run a single test by name
pytest backend/ -v -k "test_session_start_idempotency"

# Run tests matching a pattern
pytest backend/ -v -k "test_create and not integration"
```

### Debugging

```bash
# Stop on first failure
pytest backend/ -x

# Show local variables in tracebacks
pytest backend/ -v --tb=long

# Drop into debugger on failure
pytest backend/ --pdb

# Run with print output visible
pytest backend/ -v -s
```

---

## 9. CI Integration Notes

### Unit Tests (No External Services)

- All unit tests **must** run without any external services (database, Redis, LLM APIs).
- Every external dependency must be mocked via `unittest.mock.AsyncMock` or `unittest.mock.patch`.
- Unit tests should complete in **< 60 seconds** for the entire suite.

### Integration Tests (Requires Infrastructure)

- Integration tests may require:
  - **PostgreSQL** — use Docker (`docker-compose.test.yml` (planned — not yet created)) or a test database.
  - **Redis** — use Docker or `fakeredis` for lightweight tests.
- Keep integration tests idempotent: each test should set up and tear down its own data.

### `pytest` Configuration

Add the following to `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["backend"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
markers = [
    "unit: Unit tests (no external services)",
    "integration: Integration tests (may need DB/Redis)",
    "slow: Tests that take > 5 seconds",
]
filterwarnings = [
    "ignore::DeprecationWarning",
]
```

### Shared Root `conftest.py`

Place shared fixtures in `backend/conftest.py`:

```python
# backend/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.fixture
async def client():
    """Shared async HTTP client for all integration tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

### CI Pipeline Checklist

- [ ] Install test dependencies: `pip install pytest pytest-asyncio pytest-cov httpx`
- [ ] Run unit tests first (fast feedback): `pytest backend/ -v -k "unit"`
- [ ] Run integration tests with services: `pytest backend/ -v -k "integration"`
- [ ] Enforce coverage thresholds: `pytest backend/ --cov=backend --cov-fail-under=70`
- [ ] Upload HTML coverage report as a build artifact

---

> **Questions?** Check the existing test files listed in [Section 6](#6-existing-tests-reference) or ask in the project's development channel.
