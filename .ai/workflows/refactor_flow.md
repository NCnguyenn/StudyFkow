# 🔧 AI StudyFlow — Refactor Execution Flow

> **Canonical Authority:** This document defines the precise execution sequence for
> refactoring operations. Read `.ai/rules/refactor.md` for classification and philosophy.
> This document is the operational workflow. Both MUST be consulted before any refactor.

---

## 1. REFACTOR INITIATION GATE

### 1.1 Mandatory Pre-Refactor Questions

Answer ALL of the following before starting:

1. **What is the exact risk tier of this refactor?** (Tier 1 / 2 / 3 per `.ai/rules/refactor.md`)
2. **What is the blast radius?** (Check `.ai/architecture/impact_map.md`)
3. **Does the public contract change?** (Yes → Tier 3 protocol)
4. **Does the database schema change?** (Yes → follow `.ai/workflows/database_safety.md`)
5. **How many vertical slices are affected?** (> 3 → stop and escalate)
6. **What is the exact rollback procedure?**

If any answer is "unknown," the refactor MUST NOT proceed.

---

## 2. TIER 1 REFACTOR FLOW (Safe — Internal Only)

**Scope:** Single function or method, no signature change, no contract change.

**Execution:**
```
1. Confirm: change is internal to one function only.
2. Run existing tests → must pass before any change.
3. Make the change.
4. Run existing tests again → must still pass.
5. Commit with message: "refactor: <description> (T1)"
```

**Time budget:** 15–30 minutes. If the change takes longer, it is not Tier 1.

---

## 3. TIER 2 REFACTOR FLOW (Moderate)

**Scope:** Function signature change, layer restructuring, module reorganization within one feature.

### Phase 1 — Impact Analysis (Mandatory)

```bash
# Find all callers of the target function
grep -rn "target_function_name" backend/ --include="*.py"
grep -rn "targetFunctionName" frontend/ --include="*.ts" --include="*.tsx"
```

Document all callers. If count > 20, reclassify to Tier 3.

### Phase 2 — Interface Update

If the function signature is changing, update the interface FIRST:

```python
# In domain/interfaces.py — update the abstract method signature
@abstractmethod
async def list_sessions(
    self,
    user_id: UUID,
    cursor: str | None = None,  # New parameter added
    limit: int = 20,
) -> tuple[list[StudySession], str | None]:  # Return type changed
    ...
```

### Phase 3 — Update All Callers

Update every caller identified in Phase 1 to use the new signature. Do NOT update the implementation yet.

### Phase 4 — Update Implementation

Update the concrete implementation to match the new interface.

### Phase 5 — Test Validation

```bash
pytest features/<slug>/tests/ -v
# All tests must pass. If tests break at callers that were not found in Phase 1,
# those are hidden dependencies that must be found and fixed.
```

### Phase 6 — Type Check Validation

```bash
mypy backend/ --strict
npx tsc --noEmit
```

Zero new type errors allowed.

---

## 4. TIER 3 REFACTOR FLOW (Breaking — Strangler Fig)

**Scope:** Public contract change, shared kernel modification, API version change, major restructuring.

### Phase 1 — Architecture Review

Load and confirm:
- [ ] `.ai/features/FEATURE_BOUNDARIES.md` — which features are affected.
- [ ] `.ai/architecture/impact_map.md` — full blast radius.
- [ ] `backend/docs/API_CONTRACTS.md` — if API shape is changing.
- [ ] `.ai/rules/refactor.md` — Strangler Fig protocol.

Document the plan in a brief comment at the top of the first implementation file.

### Phase 2 — Parallel Implementation

```bash
# Create v2 alongside v1 — NEVER modify v1 yet
cp features/study_sessions/application/session_service.py \
   features/study_sessions/application/session_service_v2.py
```

Implement the new logic in `session_service_v2.py`. The original is **untouched**.

### Phase 3 — Parallel Testing

Write a complete test suite targeting `session_service_v2.py` exclusively:

```python
# test_session_service_v2.py
from features.study_sessions.application.session_service_v2 import StudySessionServiceV2

class TestStudySessionServiceV2:
    # All tests for the new implementation
    # Old tests still pass for v1
```

### Phase 4 — Cutover (Single-line DI change)

```python
# In features/study_sessions/api/dependencies.py
def get_session_service(db: AsyncSession = Depends(get_write_session)) -> StudySessionService:
    # return StudySessionService(session_repo=PostgreSQLSessionRepo(db))   # v1 — commented
    return StudySessionServiceV2(session_repo=PostgreSQLSessionRepo(db))   # v2 — active
```

This is the ONLY code change in the cutover commit. It is trivially reversible.

### Phase 5 — Observation (48 hours minimum)

Monitor:
- Error rate for session-related routes (target: < 0.1% error rate).
- P95 latency on session endpoints (must not degrade > 10%).
- AI task completion rate (if refactor touched AI pipeline).

### Phase 6 — Cleanup

```bash
# Only after 48h observation period with clean metrics
rm features/study_sessions/application/session_service.py
mv features/study_sessions/application/session_service_v2.py \
   features/study_sessions/application/session_service.py

# Update the DI to use the final name
```

---

## 5. API VERSIONING FLOW (For Breaking API Changes)

When a Tier 3 refactor changes the API response shape:

### Step 1 — Create New Version Router

```python
# backend/features/sessions/api/router_v2.py
from fastapi import APIRouter
router_v2 = APIRouter()

@router_v2.get("/{session_id}", response_model=SessionResponseV2)
async def get_session_v2(session_id: UUID, ...):
    # New response shape
    ...
```

### Step 2 — Register Both Versions

```python
# backend/main.py
app.include_router(sessions_router_v1, prefix="/api/v1/sessions")  # Old — keep alive
app.include_router(sessions_router_v2, prefix="/api/v2/sessions")  # New — active
```

### Step 3 — Deprecation Headers on v1

```python
@router_v1.get("/{session_id}")
async def get_session_v1(...):
    response = await get_session_service(session_id, ...)
    return JSONResponse(
        content=response,
        headers={
            "Deprecation": "true",
            "Sunset": "Sat, 15 Jun 2026 00:00:00 GMT",
            "Link": f"</api/v2/sessions/{session_id}>; rel=\"successor-version\""
        }
    )
```

### Step 4 — Update Contract Document

Mark v1 endpoint as `[DEPRECATED - Sunset: 2026-06-15]` in `api_contracts.md`.
Mark v2 endpoint as `[ACTIVE]`.

### Step 5 — Monitor v1 Traffic

After 30 days, check if any client is still calling v1. Contact team before sunset.

---

## 6. IMPACT MAP VERIFICATION CHECKLIST

Before closing any Tier 2 or Tier 3 refactor:

- [ ] Every system listed in `impact_map.md` for the modified component was verified.
- [ ] Impact map was updated with any NEW dependencies introduced by the refactor.
- [ ] No previously undocumented dependency was discovered during testing (if yes, add to impact map).

---

## 7. POST-REFACTOR LOGGING

Record in `.ai/logs/ai_changes.md`:

```markdown
## REFACTOR 2026-05-07 — Session Service V2 (Tier 3)
**Motivation:** Extract quota validation to dedicated QuotaService
**Files Modified:**
- session_service_v2.py (new)
- session_service.py (deprecated → deleted after observation)
- api/dependencies.py (cutover)
**Tests Added:** test_session_service_v2.py (22 tests)
**Observation Period:** 2026-05-07 to 2026-05-09 — clean metrics
**API Contract Impact:** None — internal refactor, no endpoint changes
**Impact Map Updated:** No new dependencies introduced
```

---

*End of Refactor Flow — Last reviewed: 2026-05-07*
