# 🐛 AI StudyFlow — Bug Fixing Workflow

> **Canonical Authority:** This document defines the exact process for diagnosing, fixing,
> and verifying bugs in AI StudyFlow. AI agents MUST follow this sequence.
> Guessing at fixes without diagnosis is prohibited.

---

## 1. BUG CLASSIFICATION

Before starting any fix, classify the bug:

| Class | Description | Example | SLA |
|---|---|---|---|
| **P0 — Critical** | Data loss, security breach, total service outage | Sync engine overwrites data; auth bypass | Fix within 2 hours |
| **P1 — High** | Major feature broken for all or most users | Session creation returns 500; AI tasks stuck forever | Fix within 24 hours |
| **P2 — Medium** | Feature partially broken or edge case failure | Pagination cursor fails on last page | Fix within 72 hours |
| **P3 — Low** | Cosmetic, minor UX issue, isolated edge case | Incorrect date format in one locale | Fix in next sprint |

Document the classification in `.ai/memory/known_bugs.md` before proceeding.

---

## 2. MANDATORY DIAGNOSIS SEQUENCE

### Step 1 — Reproduce First, Fix Never

**NEVER attempt a fix before reproducing the bug.** A fix without a reproduction is guesswork that may mask the symptom while the root cause persists.

Reproduction requirements:
- Exact HTTP request payload OR exact UI interaction sequence that triggers the bug.
- Expected behavior clearly stated.
- Actual behavior clearly stated.
- Environment confirmed (dev / staging / production).

### Step 2 — Locate the Failure Layer

Use structured diagnosis to identify WHICH layer the bug lives in:

```
Symptom observed → Is it UI only?
   YES → Bug is in frontend component, hook, or state management.
   NO  → Is the API returning wrong data?
         YES → Bug is in router, service, or repository layer.
         NO  → Is the data wrong in the database?
               YES → Bug is in a migration, constraint, or Celery task.
               NO  → Bug is in the sync engine or offline state.
```

### Step 3 — Load Minimal Context

Load ONLY the context relevant to the identified failure layer. Do NOT load the entire feature.

```
P1 bug in session creation → Load:
  - features/study_sessions/api/router.py
  - features/study_sessions/application/service.py
  - features/study_sessions/domain/models.py (schemas only)
  - Relevant test file

Do NOT load:
  - analytics feature
  - flashcard_engine
  - Frontend code (if API is confirmed wrong)
```

### Step 4 — Write a Failing Test

Before modifying any code, write a test that:
1. Reproduces the exact bug.
2. Fails with the current code.
3. Will pass when the bug is fixed.

```python
# This test must FAIL before the fix
async def test_session_create_with_empty_topic_ids_does_not_crash():
    """
    BUG: POST /sessions with topic_ids=[] raises a 500 due to empty
    list passed to bulk_insert. Expected: 201 Created.
    Reported: 2026-05-07, Ticket: #42
    """
    payload = {"title": "Test", "duration_minutes": 30, "topic_ids": []}
    response = await authenticated_client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 201  # Currently returns 500
```

**This test becomes the permanent regression test.** It must remain in the test suite forever.

### Step 5 — Identify Root Cause (Not Symptom)

The root cause is the FIRST point in the code where the behavior diverges from the contract.

```
Symptom: 500 on POST /sessions with empty topic_ids
↓
Stack trace shows: bulk_insert([]) raises ValueError in repository
↓
Root cause: repository.bulk_assign_topics() does not guard against empty list
↓
Correct fix: Add guard `if not topic_ids: return` in repository method
Incorrect fix (symptom masking): Catch the 500 in the router and return 201
```

---

## 3. FIX IMPLEMENTATION RULES

### 3.1 Minimal Change Principle

The fix MUST change only the code necessary to resolve the root cause. No opportunistic refactoring during bug fixes.

```python
# CORRECT FIX — minimal, targeted
async def bulk_assign_topics(self, session_id: UUID, topic_ids: list[UUID], db: AsyncSession) -> None:
    if not topic_ids:  # Added guard — this is the complete fix
        return
    await db.execute(insert(SessionTopic).values([...]))

# FORBIDDEN — bug fix + refactoring mixed in same commit
async def bulk_assign_topics(self, session_id: UUID, topic_ids: list[UUID], db: AsyncSession) -> None:
    if not topic_ids:
        return
    # Opportunistically rewrote the entire insert logic...
    # Changed parameter names...
    # Added unrelated logging...
```

### 3.2 Impact Radius Check

Before applying any fix, verify the blast radius:
1. Check `.ai/architecture/impact_map.md` for the modified function.
2. Confirm the fix does not break any caller of the modified function.
3. Run all tests for the affected feature (unit + integration).

### 3.3 P0/P1 Hotfix Protocol

For P0 and P1 bugs in production:

1. **Immediate mitigation first:** Can the bug be mitigated without a code change? (Feature flag off, rate limit reduction, cache flush.)
2. **Minimal hotfix:** Write the smallest possible change. No cleanups, no refactors.
3. **Deploy to staging:** Verify fix on staging. Run full test suite.
4. **Deploy to production:** Monitor error rates for 30 minutes after deployment.
5. **Follow-up ticket:** If the hotfix introduced technical debt, create a P3 ticket to clean it up later.

---

## 4. VERIFICATION SEQUENCE

After implementing the fix:

- [ ] The failing test written in Step 4 now passes.
- [ ] All pre-existing tests still pass (no regressions introduced).
- [ ] Bug is reproducible BEFORE the fix on a clean branch (confirm it's not a test infrastructure issue).
- [ ] Bug is NOT reproducible AFTER the fix.
- [ ] Linter and type checker pass with zero new errors.

---

## 5. POST-FIX DOCUMENTATION

### 5.1 Update Known Bugs Memory

Open `.ai/memory/known_bugs.md` and mark the bug as resolved:

```markdown
### BUG-042 [RESOLVED 2026-05-07]
**Symptom:** POST /sessions with empty topic_ids returns 500
**Root Cause:** bulk_assign_topics() did not guard against empty list
**Fix:** Added `if not topic_ids: return` guard in repository method
**Test:** test_session_create_with_empty_topic_ids_does_not_crash
**Files Modified:** backend/features/study_sessions/infrastructure/repository.py
```

### 5.2 Update Change Log

Open `.ai/logs/ai_changes.md` and record:
- Files modified.
- Reason for change.
- Risk level of change.

---

## 6. BUG FIX ANTI-PATTERNS

| Anti-Pattern | Description | Why Dangerous |
|---|---|---|
| **Try-Catch Silencing** | Wrapping the bug in `try/except` and returning a default value | The bug is now hidden; data becomes silently corrupted |
| **Frontend Masking** | Handling a backend 500 in the frontend by showing a friendly error | The backend bug persists; data may be lost |
| **Skip-the-Test Fix** | Fixing the bug without a regression test | The bug WILL reappear in future refactors |
| **Scope Creep Fix** | Refactoring the entire module while fixing a 3-line bug | High regression risk; unfocused review |
| **Guess-and-Check** | Trying multiple fixes without understanding root cause | May fix the symptom; root cause persists |

---

*End of Bug Fixing Workflow — Last reviewed: 2026-05-07*
