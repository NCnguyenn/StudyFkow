# ⚡ AI StudyFlow — Feature Creation Workflow

> **Canonical Authority:** This document defines the exact execution sequence for creating
> a new feature in AI StudyFlow. AI agents MUST follow this sequence without deviation.
> Skipping steps is an architecture violation.

---

## 1. PRE-CREATION CHECKLIST

Before writing a single line of code, complete ALL of the following:

- [ ] Feature has a clear, single domain ownership (identify it in `.ai/features/FEATURE_BOUNDARIES.md`).
- [ ] Feature slug is determined (lowercase, underscore-separated, e.g., `quiz_engine`).
- [ ] Impact of this feature on existing systems has been mapped (check `.ai/architecture/impact_map.md`).
- [ ] No existing feature already covers this domain (prevents duplicate ownership).
- [ ] Required new API endpoints are drafted against `.ai/architecture/api_contracts.md` conventions.
- [ ] Required new database tables are designed (schema-first, per `.ai/rules/database.md`).

---

## 2. MANDATORY EXECUTION SEQUENCE

### Phase 1: Architecture Declaration (DO FIRST)

**Step 1.1 — Add feature to Feature Boundaries:**
Open `.ai/features/FEATURE_BOUNDARIES.md`. Add the feature to:
- Feature Registry table.
- Its own boundary definition section (owns, public contract, forbidden list).
- Ownership Matrix.

**Step 1.2 — Add to Impact Map:**
Open `.ai/architecture/impact_map.md`. Add entries for:
- New database tables and their dependents.
- New Redis keys (if any).
- New Celery tasks (if any).

**Step 1.3 — Draft API Contracts:**
Open `.ai/architecture/api_contracts.md`. Add new endpoints following the standard response envelope. Mark as `[DRAFT]` until implemented.

---

### Phase 2: Database Schema (DO SECOND)

**Step 2.1 — Write SQL schema definition:**
Create `backend/features/<slug>/infrastructure/schema.sql` with the complete CREATE TABLE statement including:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at`, `updated_at`, `deleted_at` columns.
- All constraints (`NOT NULL`, `CHECK`, `FOREIGN KEY`).
- All indexes.

**Step 2.2 — Generate Alembic migration:**
```bash
alembic revision --autogenerate -m "add_<slug>_tables"
```

**Step 2.3 — Review generated migration:**
Verify the migration file:
- Contains `upgrade()` and `downgrade()` functions.
- Does NOT accidentally touch unrelated tables.
- Uses `CREATE INDEX CONCURRENTLY` for large-table indexes.

**Step 2.4 — Apply to dev database:**
```bash
alembic upgrade head
```

---

### Phase 3: Domain Layer (DO THIRD)

Create in this exact order:

```
backend/features/<slug>/
├── __init__.py          # EMPTY at this stage
└── domain/
    ├── models.py        # Pydantic models (request/response/domain)
    └── interfaces.py    # Abstract repository interfaces (ABC)
```

**`domain/interfaces.py` template:**
```python
from abc import ABC, abstractmethod
from uuid import UUID
from .models import <Feature>CreateRequest, <Feature>Domain

class <Feature>Repository(ABC):
    @abstractmethod
    async def create(self, data: <Feature>CreateRequest, user_id: UUID) -> <Feature>Domain:
        ...

    @abstractmethod
    async def get_by_id(self, id: UUID, user_id: UUID) -> <Feature>Domain | None:
        ...

    @abstractmethod
    async def list_active(self, user_id: UUID, cursor: str | None, limit: int) -> list[<Feature>Domain]:
        ...

    @abstractmethod
    async def soft_delete(self, id: UUID, user_id: UUID) -> bool:
        ...
```

**Do NOT proceed to Phase 4 until domain models are complete and reviewed.**

---

### Phase 4: Unit Tests for Domain (DO FOURTH)

Before writing any implementation:
```
backend/features/<slug>/tests/
├── unit/
│   ├── test_<slug>_models.py    # Pydantic validation tests
│   └── test_<slug>_service.py   # Service logic tests (stubs only for now)
└── fixtures/
    └── <slug>_factories.py      # Factory functions for test data
```

Write all unit tests with `pytest.mark.xfail` (expected to fail) until the implementation is complete. This ensures TDD discipline and catches missing test cases early.

---

### Phase 5: Infrastructure Layer (DO FIFTH)

```
backend/features/<slug>/infrastructure/
├── repository.py    # Implements <Feature>Repository ABC
└── adapters.py      # External API adapters (if needed)
```

**Repository implementation rules:**
- All queries MUST filter `deleted_at IS NULL`.
- All queries MUST filter by `user_id` from auth context.
- Read operations use `get_read_session`.
- Write operations use `get_write_session`.

---

### Phase 6: Application / Service Layer (DO SIXTH)

```
backend/features/<slug>/application/
└── service.py    # Business logic only; no SQL; no HTTP
```

Service rules:
- Receives repository via constructor injection.
- Contains ALL business logic and quota enforcement.
- Manages transaction boundaries (`async with db.begin()`).
- Raises domain-specific exceptions (not HTTP exceptions).

---

### Phase 7: API Router (DO SEVENTH)

```
backend/features/<slug>/api/
└── router.py    # FastAPI router; HTTP lifecycle only
```

Router rules:
- No business logic.
- Validates input via Pydantic Request models.
- Returns output via Pydantic Response models.
- Uses `Depends(get_current_user)` on all protected routes.
- Maps domain exceptions to HTTP status codes.

**Register router in `backend/main.py`:**
```python
from features.<slug>.api.router import router as <slug>_router
app.include_router(<slug>_router, prefix="/api/v1/<slug>", tags=["<slug>"])
```

---

### Phase 8: Public Contract Declaration (DO EIGHTH)

Now populate `backend/features/<slug>/__init__.py` with the public contract:

```python
"""
<Feature> Public Contract

EXPORTED:
- get_<slug>_summary: Read-only projection for cross-feature use
- emit_<slug>_event: Event emission for downstream features

INTERNAL (DO NOT IMPORT FROM OUTSIDE):
- Everything else in this package
"""
from .application.service import <Feature>Service
from .domain.models import <Feature>Summary

async def get_<slug>_summary(id: UUID, user_id: UUID) -> <Feature>Summary:
    ...
```

---

### Phase 9: Frontend Implementation (DO NINTH)

```
frontend/features/<slug>/
├── index.ts                    # Public contract
├── domain/
│   └── types.ts                # TypeScript interfaces
├── api/
│   └── <slug>Api.ts            # API call functions (uses sync engine)
├── hooks/
│   └── use<Feature>.ts         # React hooks
├── ui/
│   ├── <Feature>List.tsx       # Pure UI components
│   └── <Feature>Form.tsx
└── __tests__/
    ├── use<Feature>.test.ts
    └── <Feature>Form.test.ts
```

---

### Phase 10: Post-Creation Validation

- [ ] All unit tests pass (`pytest -m "not integration"`).
- [ ] All integration tests pass (`pytest -m integration`).
- [ ] API contract updated from `[DRAFT]` to `[ACTIVE]`.
- [ ] Feature boundaries document updated.
- [ ] Impact map updated.
- [ ] Change logged in `.ai/logs/ai_changes.md`.

---

## 3. ANTI-PATTERNS IN FEATURE CREATION

| Anti-Pattern | Consequence |
|---|---|
| Writing router before domain models | Router shape drives the domain instead of domain driving the router |
| Skipping the `__init__.py` public contract | Every AI agent imports internal files; coupling accumulates silently |
| Creating tables without `deleted_at` | Cannot soft-delete; migration required later under production pressure |
| Implementing business logic in router | Untestable without HTTP; violates layer separation |
| Creating shared utility before declaring feature ownership | Logic has no home; gradually pulled in all directions |

---

*End of Feature Creation Workflow — Last reviewed: 2026-05-07*
