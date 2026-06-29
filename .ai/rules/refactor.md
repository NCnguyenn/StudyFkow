# 🔧 AI StudyFlow — Refactoring Safety Rules

> **Canonical Authority:** This document governs ALL refactoring operations in this repository.
> Large uncontrolled rewrites are prohibited. Every refactor MUST follow this protocol.

---

## 1. REFACTOR PHILOSOPHY

### 1.1 Why Refactoring is High-Risk in AI-Assisted Systems

In a standard human-only codebase, a skilled engineer can hold the entire context of a module in working memory and refactor it safely. In an AI-assisted system, no single agent has guaranteed full context of the blast radius. This creates a class of bugs that are:
- Not caught by unit tests (because the tests were also AI-generated and tested the wrong behavior).
- Not caught by type checkers (because the type signatures remained valid but the semantic contract changed).
- Only caught in production (by users or by data corruption).

Refactoring safety rules exist to make the blast radius of every change **explicit**, **bounded**, and **reversible**.

### 1.2 The Strangler Fig Principle

The primary safe refactoring strategy for this system is **Strangler Fig**: build the new implementation in parallel with the old one, switch traffic to the new one, then delete the old one. Never mutate the old one in-place unless the change is provably trivial.

---

## 2. REFACTOR CLASSIFICATION SYSTEM

Before any refactoring begins, the agent or engineer MUST classify the refactor into one of three risk tiers:

| Tier | Description | Example | Protocol |
|---|---|---|---|
| **Tier 1 — Safe** | Internal implementation detail within a single function, no signature changes | Rename a local variable, simplify a conditional | Standard PR review |
| **Tier 2 — Moderate** | Changes a function signature, moves logic between layers, or alters a module's internal structure | Extract a service method, change a Pydantic field type | Impact map check + architecture review |
| **Tier 3 — Breaking** | Changes a public interface, alters a database schema, removes an API endpoint, modifies shared kernel | Rename an API response field, drop a table column, restructure a feature boundary | Strangler Fig protocol + rollback plan + phased deployment |

---

## 3. THE MANDATORY PRE-REFACTOR CHECKLIST

For any Tier 2 or Tier 3 refactor, complete ALL of the following before touching a single file:

### 3.1 Impact Analysis
- [ ] Load `.ai/architecture/impact_map.md` and identify all systems consuming the target.
- [ ] List every file that imports the module being changed.
- [ ] Identify all API consumers (frontend hooks, external clients) if an API contract is changing.
- [ ] Identify all Celery tasks that depend on the changing data structure.
- [ ] Identify all test files that will need to be updated.

### 3.2 Contract Preservation Verification
- [ ] Confirm the public interface (function signature, HTTP contract, event schema) remains backward-compatible.
- [ ] If backward compatibility cannot be maintained, document the migration path for all consumers.
- [ ] Confirm no database migrations are required. If they are, plan them per `.ai/rules/database.md`.

### 3.3 Rollback Strategy
- [ ] Define the exact rollback procedure (which files to revert, what DB migrations to run in reverse).
- [ ] Confirm `downgrade()` exists for any associated migrations.
- [ ] Confirm the old implementation is preserved until the new one is verified in staging.

---

## 4. THE STRANGLER FIG PROTOCOL (Tier 3 Refactors)

### 4.1 Step-by-Step Execution

**Phase 1 — Parallel Implementation:**
```text
Before:
  features/quiz_engine/application/quiz_service.py  ← existing, DO NOT TOUCH

After Phase 1:
  features/quiz_engine/application/quiz_service.py     ← still running
  features/quiz_engine/application/quiz_service_v2.py  ← new implementation
```

Create `quiz_service_v2.py` implementing the same interface as `quiz_service.py`. It MUST NOT be imported by any production code yet.

**Phase 2 — Parallel Testing:**
Write tests specifically for `quiz_service_v2.py`. These tests MUST pass completely before Phase 3 begins. The old tests MUST still pass.

**Phase 3 — Shadow Mode (Optional but recommended for critical paths):**
Route a small percentage of production traffic to `quiz_service_v2.py` using a feature flag. Log the outputs of both services and compare. If outputs diverge, investigate before proceeding.

**Phase 4 — Traffic Cutover:**
Update the Dependency Injection container to use `quiz_service_v2.py`:
```python
# In dependencies.py — single-line change
# quiz_service = QuizService()          ← old
quiz_service = QuizServiceV2()          # ← new
```

**Phase 5 — Observation Period:**
Monitor error rates, latency, and business metrics for a minimum of 48 hours after cutover.

**Phase 6 — Cleanup:**
```text
Delete: features/quiz_engine/application/quiz_service.py
Rename: quiz_service_v2.py → quiz_service.py
Update all references.
```

### 4.2 Why This Protocol Works for AI-Assisted Systems

An AI agent performing the cutover in Phase 4 makes a **1-line change** with a **1-line rollback**. This is the smallest possible blast radius for a major service change. If the new implementation has a bug discovered in production, rolling back requires reverting one line — not untangling a massive in-place rewrite.

---

## 5. API CONTRACT REFACTORING RULES

### 5.1 The API Versioning Rule

Changing an existing API response shape or removing a field is a **breaking change**. Breaking changes require API versioning, not in-place modification.

```
# CORRECT approach for breaking API change:
/api/v1/sessions/{id}   ← old contract, kept operational for deprecation period
/api/v2/sessions/{id}   ← new contract, new consumers use this

# FORBIDDEN:
# Changing /api/v1/sessions/{id} response shape while clients still use it
```

**Deprecation Period:** Old API versions must remain operational for a minimum of 30 days after the new version is deployed, with a documented sunset date in `api_contracts.md`.

### 5.2 Additive Changes Are Safe

Adding new optional fields to an API response is backward-compatible and does not require versioning. All new fields MUST be optional with explicit default values in the Pydantic model.

```python
# Safe additive change — existing clients ignore the new field
class SessionResponse(BaseModel):
    id: UUID
    title: str
    # Existing fields above
    ai_summary: str | None = None  # New optional field — safe
```

---

## 6. DATABASE SCHEMA REFACTORING RULES

### 6.1 Column Renames Are Three-Phase Operations

Renaming a column while the application is running is a multi-deployment operation:

**Phase 1:** Add the new column with the new name. Copy data from old column. Both columns exist.

**Phase 2:** Update all application code to use the new column name. Deploy. Both columns still exist in DB.

**Phase 3:** Remove the old column in a separate migration. Deploy.

**FORBIDDEN:** Renaming a column in a single migration while application code still references the old name. This causes a zero-downtime deployment to instantly break.

### 6.2 Index Refactoring Safety

Dropping an index on a large table with active production traffic can cause query performance collapse. Index drops MUST be executed during low-traffic windows with monitoring.

Creating a new index on a large table (`CREATE INDEX`) MUST use `CREATE INDEX CONCURRENTLY` to avoid locking the table:

```sql
-- CORRECT — non-locking concurrent index creation
CREATE INDEX CONCURRENTLY idx_flashcards_user_deck 
ON flashcards (user_id, deck_id) 
WHERE deleted_at IS NULL;

-- FORBIDDEN in production on large tables — causes table lock
CREATE INDEX idx_flashcards_user_deck ON flashcards (user_id, deck_id);
```

---

## 7. SHARED KERNEL REFACTORING RULES

### 7.1 The High-Risk Nature of Shared Module Changes

The `shared/` directory is imported by every feature. A breaking change in `shared/` can cause a cascading failure across the entire application. This makes it the **highest-risk** area for refactoring.

**Rule:** Any change to a public interface in `shared/` is automatically classified as Tier 3 — Breaking and requires the full Strangler Fig protocol.

### 7.2 Shared Utility Expansion vs. Modification

Adding a new utility to `shared/` is safe (additive). Modifying the signature of an existing shared utility requires:
1. Creating the new signature alongside the old one.
2. Migrating all callers to the new signature.
3. Removing the old signature only when zero callers remain.

---

## 8. AI AGENT REFACTORING SAFETY RULES

### 8.1 Context Sufficiency Check

Before starting a refactor, an AI agent MUST verify it has loaded:
- The complete public interface of the module being changed.
- All files that import that module (use grep/search tools).
- The impact map entry for this module.
- All test files covering this module.

If any of these cannot be located, the agent MUST stop and request clarification.

### 8.2 Prohibited AI Refactoring Behaviors

| Prohibited Action | Why It Is Dangerous |
|---|---|
| Renaming a public function without updating all callers | Creates import errors across the codebase discovered at runtime |
| Changing a Pydantic model field from required to optional in one step | Breaks all callers that always pass the field — subtle type drift |
| Inlining a utility function used in 10 places | Creates 10 separate copies of logic that must now be maintained separately |
| Merging two service classes into one | Destroys the ability to test them in isolation; increases blast radius |
| Removing a deprecated code path before confirming zero callers | Causes silent runtime failures in the callers not yet migrated |

### 8.3 The "Confirm Before Delete" Rule

An AI agent MUST NEVER delete a function, class, file, or module without first:
1. Searching the entire codebase for usages.
2. Confirming the usage count is zero OR all callers have been migrated.
3. Adding the deletion as a separate, isolated commit from the migration.

---

## 9. FAILURE SCENARIOS IN REFACTORING

### 9.1 Scenario: AI Agent Silently Drops a Business Rule

**Description:** An AI agent rewrites a service method and, while simplifying the code, drops a conditional check that enforced a business rule (e.g., `if user.subscription_tier == 'free': raise QuotaExceededError`).

**Result:** All free-tier users now have unlimited access. Revenue impact. Requires emergency hotfix.

**Prevention:** The Strangler Fig Protocol ensures the old code is preserved during the parallel period. Tests generated for the new service MUST cover all business rule paths.

### 9.2 Scenario: Column Rename Migration Causes Production Outage

**Description:** An AI agent generates a migration that renames `session_duration` to `duration_minutes` in a single step. The migration runs. The application code still references `session_duration`. All queries that touch this column fail.

**Result:** P0 outage. All study session reads and writes fail.

**Prevention:** Three-phase column rename protocol. The single-step rename is prohibited by these rules.

### 9.3 Scenario: Shared Utility Signature Change Breaks Unknown Caller

**Description:** An AI agent changes `format_duration(seconds: int) -> str` to `format_duration(seconds: int, locale: str = "en") -> str`. This seems backward-compatible. However, a legacy test was using positional args and another file was passing `None` explicitly, bypassing the default.

**Result:** Subtle test failures and runtime edge cases.

**Prevention:** When changing any shared utility, run a full test suite before declaring the refactor complete. Use grep to find ALL callers and manually verify each one.

---

## 10. POST-REFACTOR VALIDATION CHECKLIST

After completing any Tier 2 or Tier 3 refactor:

- [ ] All existing tests pass with no modifications (modifications indicate contract breakage).
- [ ] New tests for the refactored code pass.
- [ ] Linter and type checker pass with zero new errors.
- [ ] Impact map updated in `.ai/architecture/impact_map.md`.
- [ ] Change logged in `.ai/logs/ai_changes.md`.
- [ ] Deprecated code paths are marked with a `# DEPRECATED: remove after YYYY-MM-DD` comment.
- [ ] API contract updated in `backend/docs/API_CONTRACTS.md` if applicable.
- [ ] Migration files reviewed for reversibility.

*End of Refactor Rules — Last reviewed: 2026-05-07*
