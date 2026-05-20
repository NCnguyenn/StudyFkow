# 🔗 AI StudyFlow — Integration Test Rules

> **Canonical Authority:** Integration tests verify that system components work correctly
> together across real infrastructure boundaries. This document governs all integration
> test implementation. These tests run in CI with real PostgreSQL, Redis, and Celery.

---

## 1. INTEGRATION TEST DEFINITION

### 1.1 Scope

An integration test in this system verifies the interaction between **two or more real components** without mocking infrastructure. Examples:
- FastAPI route handler → Service → Real PostgreSQL (via test database)
- Celery task → Real Redis broker → Worker → Real PostgreSQL
- Sync engine push → Conflict resolution → Real database write

**Distinction from Unit Tests:** Unit tests mock all infrastructure. Integration tests use real infrastructure within a controlled test environment.

### 1.2 What Is Never Integration-Tested

- LLM provider responses (mocked at the `LLMProvider` interface level — cost and non-determinism).
- External payment APIs (mocked at adapter level).
- Email delivery (mocked at adapter level).

---

## 2. TEST DATABASE MANAGEMENT

### 2.1 Test Database Isolation Strategy

Each test function MUST operate in a **transaction that is rolled back** after the test completes. This ensures:
- Tests do not pollute each other with data.
- Database is always in a clean state at the start of each test.
- No test cleanup code is needed.

```python
# conftest.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.infrastructure.database import Base

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/studyflow_test"

@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    """Provides a transactional session that rolls back after each test."""
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)
    yield session
    await session.close()
    await transaction.rollback()  # Every test gets a clean database
    await connection.close()
```

### 2.2 Schema Migration in Test Environment

The test database schema MUST be kept in sync with production migrations:

```bash
# In CI before running integration tests
alembic -x db=test upgrade head
```

**NEVER** use `Base.metadata.create_all()` as a substitute for Alembic migrations in integration tests. This creates a divergence between test and production schema.

---

## 3. REDIS TEST ISOLATION

### 3.1 Test-Scoped Redis Database

Redis supports 16 databases (0–15). Assign database 15 exclusively for tests:

```python
# conftest.py
import redis.asyncio as redis
import pytest

TEST_REDIS_URL = "redis://localhost:6379/15"  # DB 15 = test only

@pytest.fixture(autouse=True)
async def flush_test_redis():
    """Flush Redis DB 15 before each integration test."""
    client = redis.from_url(TEST_REDIS_URL)
    await client.flushdb()
    yield
    await client.aclose()
```

**Rule:** Integration tests MUST NEVER use Redis DB 0 (production) or DB 1 (development). Test isolation REQUIRES the dedicated DB 15.

---

## 4. CELERY INTEGRATION TESTING

### 4.1 Eager Mode for Celery Tasks

Celery tasks in integration tests MUST execute synchronously using `CELERY_TASK_ALWAYS_EAGER`:

```python
# conftest.py
@pytest.fixture(autouse=True)
def celery_eager_mode(settings):
    """Force Celery tasks to execute synchronously in tests."""
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True  # Surface exceptions from tasks
    yield
    settings.CELERY_TASK_ALWAYS_EAGER = False
```

**WHY:** Running a real Celery worker in CI is fragile and slow. Eager mode runs the task function inline, preserving the full task logic without the broker overhead.

### 4.2 Testing AI Pipeline Tasks with Mocked Providers

```python
async def test_generate_flashcards_task_saves_cards_to_db(
    db_session, mock_llm_provider
):
    """
    Tests the full Celery task lifecycle using eager mode and a mock LLM.
    The DB interaction is real; only the LLM call is mocked.
    """
    # Arrange
    mock_llm_provider.generate.return_value = LLMResponse(
        content=json.dumps({
            "cards": [
                {"front": "Q1", "back": "A1", "difficulty": "medium"},
                {"front": "Q2", "back": "A2", "difficulty": "easy"},
            ],
            "source_language": "en",
            "generation_model": "mock-model"
        }),
        prompt_tokens=100,
        completion_tokens=200,
        provider="mock",
        model="mock-model",
        finish_reason="stop"
    )
    task = await AITaskFactory.create(
        db=db_session, task_type="FLASHCARD_GENERATION",
        input_payload={"source_content": "Test notes", "card_count": 2, "deck_id": str(uuid4())}
    )

    # Act — eager mode runs task synchronously
    generate_flashcards_task.delay(task_id=str(task.id), user_id=str(task.user_id))

    # Assert — verify DB state
    refreshed_task = await AITaskRepository(db_session).get_by_id(task.id)
    assert refreshed_task.status == "completed"
    cards = await FlashcardRepository(db_session).get_by_batch_task(task.id)
    assert len(cards) == 2
```

---

## 5. FASTAPI ROUTE INTEGRATION TESTS

### 5.1 Test Client Configuration

```python
# conftest.py
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def api_client(db_session):
    """Test client with overridden DB dependency."""
    app.dependency_overrides[get_write_session] = lambda: db_session
    app.dependency_overrides[get_read_session] = lambda: db_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Content-Type": "application/json"}
    ) as client:
        yield client

    app.dependency_overrides.clear()
```

### 5.2 Authentication in Integration Tests

```python
@pytest.fixture
async def authenticated_client(api_client, db_session):
    """Client with a valid JWT for a test user."""
    user = await UserFactory.create(db=db_session, subscription_tier="free")
    token = generate_test_jwt(user_id=str(user.id), tier="free")
    api_client.headers["Authorization"] = f"Bearer {token}"
    api_client._test_user = user  # Attach for test access
    return api_client
```

### 5.3 Standard Integration Test Pattern

```python
async def test_create_session_returns_201_and_persists_to_db(
    authenticated_client, db_session
):
    # Arrange
    payload = {"title": "Integration Test Session", "duration_minutes": 30, "topic_ids": []}

    # Act
    response = await authenticated_client.post("/api/v1/sessions", json=payload)

    # Assert HTTP contract
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "Integration Test Session"
    session_id = body["data"]["id"]

    # Assert DB state — verify persistence
    session = await StudySessionRepository(db_session).get_by_id(UUID(session_id))
    assert session is not None
    assert session.deleted_at is None
    assert session.user_id == authenticated_client._test_user.id
```

---

## 6. OFFLINE-FIRST SYNC INTEGRATION TESTS

### 6.1 Sync Push Integration Test

```python
async def test_sync_push_applies_mutations_and_resolves_conflicts(
    authenticated_client, db_session
):
    """
    Tests the complete sync push pipeline:
    mutation received → conflict check → applied to DB → response
    """
    # Arrange — create a session server-side
    session = await StudySessionFactory.create(
        db=db_session, user_id=authenticated_client._test_user.id
    )
    client_timestamp = datetime.now(timezone.utc).isoformat()

    mutations = [{
        "operation": "UPDATE",
        "entity": "study_session",
        "entity_id": str(session.id),
        "payload": {"notes": "Updated offline notes"},
        "client_timestamp": client_timestamp,
        "client_version": 1
    }]

    # Act
    response = await authenticated_client.post("/api/v1/sync/push", json={
        "client_id": str(uuid4()),
        "mutations": mutations
    })

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert str(session.id) in body["data"]["applied"]
    assert body["data"]["conflicts"] == []

    # Verify DB update
    refreshed = await StudySessionRepository(db_session).get_by_id(session.id)
    assert refreshed.notes == "Updated offline notes"
```

---

## 7. WHAT INTEGRATION TESTS MUST COVER

| Scenario | Required Integration Test |
|---|---|
| Create → Read consistency | POST creates resource, GET returns it with correct data |
| Soft delete visibility | DELETE soft-deletes; subsequent GET returns 404 |
| Auth enforcement | Unauthenticated request returns 401; other user's resource returns 403 |
| Pagination correctness | Create N items, GET with page_size=N/2, verify cursor, fetch page 2 |
| Sync push conflict | Server record newer than client mutation → mutation goes to `conflicts` |
| Celery task status lifecycle | Enqueue → processing → completed, verify status transitions in DB |
| Rate limiting | Exceed rate limit → 429 with correct headers |
| Free tier quota | Create sessions up to limit; next one returns 422 |

---

## 8. FLAKY INTEGRATION TEST PREVENTION

| Risk | Prevention |
|---|---|
| Port conflicts in CI | Use Docker Compose with health checks; wait-for-it scripts |
| Dirty database between tests | Transactional rollback per test (see §2.1) |
| Non-deterministic Celery delays | Use eager mode; never `time.sleep()` in tests |
| Redis key collisions | Flush DB 15 before each test (autouse fixture) |
| Timezone-sensitive assertions | Always use UTC; use `freezegun` for time-dependent tests |

---

## 9. CI/CD INTEGRATION TEST GATES

```yaml
integration_tests:
  services:
    - postgres:16
    - redis:7
  before_script:
    - alembic -x db=test upgrade head
  script:
    - pytest backend/ -m "integration" --tb=short --timeout=60
  rules:
    - allow_failure: false
    - max_duration: 10m
```

Integration tests MUST run in under 10 minutes total in CI. Tests exceeding 5 seconds individually must be investigated for missing mocks.

---

*End of Integration Test Rules — Last reviewed: 2026-05-07*
