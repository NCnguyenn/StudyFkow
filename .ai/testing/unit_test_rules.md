# 🧪 AI StudyFlow — Unit Test Rules

> **Canonical Authority:** This document governs all unit test implementation in the
> AI StudyFlow system. Unit tests are the primary safety net for AI-assisted refactoring.
> All AI agents generating code MUST also generate compliant unit tests for critical paths.

---

## 1. UNIT TEST PHILOSOPHY

### 1.1 Definition of a Unit Test in This System

A unit test in AI StudyFlow tests exactly **one function, method, or class** in complete isolation. It must:
- Execute in under 100ms.
- Require no network connections.
- Require no running database.
- Require no Redis instance.
- Be deterministic across 1,000 consecutive executions.

Any test requiring external services is an integration test and belongs in `.ai/testing/integration_test_rules.md`.

### 1.2 Why Unit Tests Are the AI Refactor Safety Net

When an AI agent refactors a service method, the unit tests for that method are the primary mechanism for detecting regressions. If the test suite is:
- Incomplete → regressions are silent until production.
- Coupled to implementation details → tests break on safe refactors, creating noise.
- Non-deterministic → flaky tests erode trust and cause tests to be ignored.

Unit tests must be **stable, isolated, and precise**.

---

## 2. DIRECTORY STRUCTURE

### 2.1 Backend (Python / pytest)

```
backend/
├── features/
│   └── study_sessions/
│       ├── application/
│       │   └── service.py
│       └── tests/
│           ├── unit/
│           │   ├── test_session_service.py
│           │   ├── test_session_validators.py
│           │   └── test_session_domain_models.py
│           └── fixtures/
│               └── session_factories.py
```

**Rule:** Test files MUST mirror the structure of the source file they test. `application/service.py` → `tests/unit/test_session_service.py`.

### 2.2 Frontend (TypeScript / Vitest)

```
frontend/
├── features/
│   └── sessions/
│       ├── hooks/
│       │   └── useStudySession.ts
│       └── __tests__/
│           ├── useStudySession.test.ts
│           └── sessionUtils.test.ts
```

---

## 3. ISOLATION & MOCKING RULES

### 3.1 The Boundary Mocking Rule

Mocking MUST occur at the **infrastructure boundary** — at the outermost layer that calls external systems. Never mock internal business logic functions.

```python
# CORRECT — mock the repository (infrastructure boundary)
@pytest.fixture
def mock_session_repo():
    repo = AsyncMock(spec=StudySessionRepository)
    repo.get_active_sessions.return_value = [build_session()]
    return repo

async def test_list_sessions_returns_only_active(mock_session_repo):
    service = StudySessionService(session_repo=mock_session_repo)
    result = await service.list_user_sessions(user_id=TEST_USER_ID)
    assert all(s.status != "deleted" for s in result)

# FORBIDDEN — mocking internal service methods
async def test_list_sessions():
    service = StudySessionService(...)
    service._apply_filters = MagicMock(return_value=[])  # Violates isolation
```

### 3.2 Spec-Based Mocking

All mocks MUST use `spec=` parameter to prevent phantom attribute access:

```python
# CORRECT — mock will raise AttributeError if a non-existent method is called
mock_repo = AsyncMock(spec=StudySessionRepository)

# FORBIDDEN — silent phantom attributes
mock_repo = MagicMock()
mock_repo.non_existent_method()  # Returns a Mock instead of failing
```

### 3.3 No Global State Between Tests

Each test MUST be fully independent. Shared mutable state between tests causes order-dependent failures that are nearly impossible for AI agents to diagnose.

```python
# CORRECT — fresh objects per test
@pytest.fixture
def service(mock_repo):
    return StudySessionService(session_repo=mock_repo)

# FORBIDDEN — module-level shared service instance
session_service = StudySessionService(...)  # Shared across all tests in module
```

---

## 4. FACTORY FIXTURES

### 4.1 Why Factories Over Hardcoded Data

Hardcoded test data strings and UUIDs create invisible dependencies between tests. If a test fails only when `user_id == "specific-uuid"`, diagnosing the cause is extremely difficult.

Use factory functions that generate valid, unique test objects:

```python
# backend/features/study_sessions/tests/fixtures/session_factories.py
import factory
from uuid import uuid4
from datetime import datetime, timezone

class StudySessionFactory(factory.Factory):
    class Meta:
        model = StudySession

    id = factory.LazyFunction(uuid4)
    user_id = factory.LazyFunction(uuid4)
    title = factory.Sequence(lambda n: f"Test Session {n}")
    status = "active"
    duration_minutes = 45
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    deleted_at = None

def build_session(**overrides) -> StudySession:
    return StudySessionFactory.build(**overrides)
```

### 4.2 Frontend Factory Fixtures

```typescript
// frontend/features/sessions/__tests__/factories/sessionFactory.ts
import { v4 as uuidv4 } from 'uuid';
import type { StudySession } from '../domain/types';

export function buildSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: uuidv4(),
    title: 'Test Session',
    status: 'active',
    durationMinutes: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## 5. WHAT MUST BE UNIT TESTED

### 5.1 Mandatory Coverage: Backend

| Component | What to Test |
|---|---|
| **Pydantic Models** | Valid input passes validation; invalid inputs fail with correct error fields |
| **Domain Logic** | Pure business calculations (score calculation, status transitions) |
| **Service Methods** | All code paths including error branches; quota enforcement |
| **Repository Methods** | SQL query construction (using mock DB session); filter logic |
| **Celery Task Logic** | Task invocation with mocked orchestrator; error handling and retry triggering |
| **Error Classes** | Correct message, status code, and error code on instantiation |

### 5.2 Mandatory Coverage: Frontend

| Component | What to Test |
|---|---|
| **Custom Hooks** | All return states (loading, success, error, empty) |
| **Utility Functions** | All input edge cases (null, empty, max values) |
| **State Reducers** | All action types and their state transitions |
| **Validation Functions** | Valid and invalid form inputs |

---

## 6. TEST STRUCTURE STANDARD

### 6.1 AAA Pattern (Arrange, Act, Assert)

Every test MUST follow the AAA pattern with explicit blank-line separation:

```python
async def test_create_session_enforces_free_tier_quota():
    # Arrange
    user_id = uuid4()
    mock_repo = AsyncMock(spec=StudySessionRepository)
    mock_repo.count_active_sessions.return_value = 3  # At free tier limit
    service = StudySessionService(session_repo=mock_repo, user_tier="free")
    payload = SessionCreate(title="New Session", duration_minutes=30)

    # Act & Assert
    with pytest.raises(QuotaExceededError) as exc_info:
        await service.create_session(user_id=user_id, data=payload)

    assert "free tier limit" in str(exc_info.value).lower()
```

### 6.2 Test Naming Convention

```
test_<unit>_<condition>_<expected_result>

Examples:
- test_create_session_at_free_tier_limit_raises_quota_error
- test_session_status_transition_from_active_to_completed_succeeds
- test_soft_delete_sets_deleted_at_to_current_utc
```

Vague names like `test_session_1` or `test_works` are forbidden.

---

## 7. PARAMETERIZED TESTS FOR EDGE CASES

Use `pytest.mark.parametrize` to cover multiple input variations without duplicating test logic:

```python
@pytest.mark.parametrize("duration,expected_error", [
    (0, "must be at least 1"),
    (-1, "must be at least 1"),
    (481, "cannot exceed 480"),
    (None, "field required"),
])
async def test_session_duration_validation(duration, expected_error):
    with pytest.raises(ValidationError) as exc_info:
        SessionCreate(title="Test", duration_minutes=duration)
    assert expected_error in str(exc_info.value).lower()
```

---

## 8. FLAKY TEST PREVENTION

### 8.1 Root Causes of Flaky Tests

| Cause | Prevention |
|---|---|
| Time-dependent assertions | Use fixed timestamps via `freezegun` or `pytest-mock` patch |
| Random UUID comparisons | Use factory-generated, fixture-scoped UUIDs |
| Async race conditions | Use `asyncio.gather()` with explicit ordering; mock async dependencies |
| External service calls | 100% of external calls must be mocked in unit tests |
| Shared state mutation | Use `@pytest.fixture(autouse=True)` cleanup hooks |

### 8.2 Time-Deterministic Testing

```python
from freezegun import freeze_time

@freeze_time("2025-09-15 08:00:00+00:00")
async def test_session_created_at_is_current_utc():
    session = await service.create_session(user_id=TEST_USER_ID, data=payload)
    assert session.created_at == datetime(2025, 9, 15, 8, 0, 0, tzinfo=timezone.utc)
```

---

## 9. CI/CD VALIDATION RULES

### 9.1 Test Gate Requirements

Unit tests MUST pass before any code is merged:

```yaml
# In CI pipeline
unit_tests:
  script:
    - pytest backend/ -m "not integration and not e2e" --tb=short --timeout=30
  rules:
    - fail_on: any_failure
    - coverage_threshold: 80%  # Per-feature minimum
```

### 9.2 Coverage Requirements

| Feature | Minimum Line Coverage |
|---|---|
| `user_auth` | 90% |
| `study_sessions` | 85% |
| `flashcard_engine` | 85% |
| `ai_pipeline` | 80% |
| `sync_engine` | 90% |
| `spaced_repetition` | 85% |

Coverage below threshold MUST block the PR merge. AI agents adding new code without tests will trigger this gate.

---

## 10. AI AGENT UNIT TEST RULES

### 10.1 AI Agents Must Generate Tests Alongside Code

When an AI agent implements a new service method, it MUST generate the corresponding unit test file in the same task. "I'll add tests later" is not acceptable — tests written later have reduced coverage because the implementation details are no longer fresh.

### 10.2 What AI Agents Must NOT Do

- Generate tests that only assert `is not None` or `== True` without semantic meaning.
- Generate tests that call the implementation and assert its own output back (tautological tests).
- Generate tests that mock every dependency so aggressively that no real code path is tested.
- Generate a single "happy path" test and skip error scenarios.

### 10.3 Minimum Test Count Per Method

| Method Type | Minimum Tests |
|---|---|
| Service method with quota logic | 3 (under limit, at limit, over limit) |
| Repository query method | 2 (results found, results empty) |
| Status transition method | N+1 where N = number of valid transitions |
| Validation function | 1 per validation rule + 1 happy path |

---

*End of Unit Test Rules — Last reviewed: 2026-05-07*
