# 🗄️ AI StudyFlow — Database Engineering Rules

> **Canonical Authority:** This document governs ALL database interactions across the AI StudyFlow system.
> All AI agents, backend engineers, and migration scripts MUST comply unconditionally.
> Violations of these rules represent high-severity architecture incidents.

---

## 1. FOUNDATIONAL PRINCIPLES

### 1.1 The Database is the Last Line of Defense

Application logic can be patched. AI agents can hallucinate incorrect business rules. However, the database schema and its constraints represent **immutable ground truth**. A corrupted database is an unrecoverable incident. Every rule in this document exists to prevent that outcome.

### 1.2 Schema-First Development

All database changes MUST begin with a schema design decision — not an ORM model. The sequence is:

1. Design the schema in SQL.
2. Document it in `.ai/architecture/database_schema.md`.
3. Generate the Alembic migration script.
4. Review the migration for reversibility.
5. Apply to staging, verify.
6. Apply to production.

**AI agents MUST NOT** generate ORM models and assume the database will follow. The schema is the authority; the ORM model is a reflection of it.

---

## 2. COLUMN DESIGN RULES

### 2.1 Mandatory Columns on Every Table

Every table in this system MUST contain the following columns without exception:

```sql
id           UUID          PRIMARY KEY DEFAULT gen_random_uuid()
created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
deleted_at   TIMESTAMPTZ   NULL  -- soft delete sentinel; NULL means active
```

**WHY `UUID` for primary keys:** Sequential integer PKs leak row counts and create ordering assumptions that break distributed systems. UUIDs are safe to generate client-side for offline-first sync without collision risk.

**WHY `TIMESTAMPTZ`:** All timestamps MUST be timezone-aware. `TIMESTAMP WITHOUT TIME ZONE` is forbidden. PostgreSQL stores `TIMESTAMPTZ` in UTC internally and converts to client timezone on read, which is the correct behavior for a globally distributed study platform.

### 2.2 Column Constraints Are Mandatory

Every column MUST have the most restrictive valid constraint:

| Situation | Required Constraint |
|---|---|
| Column cannot logically be null | `NOT NULL` |
| Numeric value must be positive | `CHECK (value > 0)` |
| Enum-like field with known values | `CHECK (status IN ('active','paused','completed'))` |
| String field with length limit | `VARCHAR(n)` not `TEXT` unless unbounded |
| Foreign key to another row | Explicit `FOREIGN KEY` with defined `ON DELETE` behavior |

**Anti-pattern:** Nullable columns used as a lazy way to avoid schema thinking. If a column is sometimes populated, document WHY and what `NULL` semantically represents.

### 2.3 The `updated_at` Auto-Update Trigger

All tables with `updated_at` MUST have a PostgreSQL trigger that automatically updates it on `UPDATE`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**WHY:** AI agents generating service-layer code frequently forget to set `updated_at`. Offloading this to a DB trigger makes it structurally guaranteed, eliminating an entire class of AI-generated bugs.

---

## 3. MIGRATION GOVERNANCE

### 3.1 Migrations Are Permanent Artifacts

Every migration file is a permanent, immutable record of the database's evolution. The following are strictly forbidden:

- **NEVER** delete a migration file that has been applied to any environment.
- **NEVER** edit a migration file after it has been applied to any environment.
- **NEVER** squash migrations from production history.

### 3.2 Migration Naming Convention

All migration files MUST follow this naming convention:

```
YYYY_MM_DD_HHMM_<short_description>.py
```

Examples:
- `2025_06_15_1430_add_users_table.py`
- `2025_07_02_0900_add_flashcard_deck_index.py`
- `2025_09_10_1600_drop_legacy_session_status.py`

**WHY:** Timestamp prefixes prevent ordering conflicts when multiple AI agents generate migrations in parallel branches. Short descriptions prevent the migration file from being a mystery to a future engineer or AI agent loading context.

### 3.3 Every Migration MUST Be Reversible

Every `upgrade()` function MUST have a corresponding `downgrade()` function that fully reverses the operation.

```python
# CORRECT
def upgrade():
    op.add_column('users', sa.Column('subscription_tier', sa.String(50), nullable=True))

def downgrade():
    op.drop_column('users', 'subscription_tier')
```

**Exception Process:** If a migration is structurally irreversible (e.g., a data transformation), it MUST be explicitly documented in the migration file with a comment explaining why `downgrade()` is a no-op.

### 3.4 Destructive Migration Safety Protocol

Dropping a column, table, or index in a production database is a HIGH-RISK operation. The following two-step process is mandatory:

**Step 1 — Deprecation (Deploy first):**
- Remove all application code references to the column/table.
- Do NOT touch the database yet.
- Monitor for a minimum of 14 days.

**Step 2 — Deletion (Deploy second):**
- Generate a migration that drops the column/table.
- Verify no application queries reference the object.
- Apply to staging, then production.

**WHY:** This two-step approach ensures a zero-downtime, safe deletion path. If Step 2 reveals an overlooked reference, a rollback is a code deployment, not a database recovery operation.

---

## 4. SOFT DELETE ENFORCEMENT

### 4.1 Hard Deletes Are Forbidden in Business Logic

`DELETE FROM <table>` is FORBIDDEN in application business logic. All record deletions MUST be soft deletes:

```python
# CORRECT: Soft delete
await db.execute(
    update(StudySession)
    .where(StudySession.id == session_id)
    .values(deleted_at=datetime.utcnow())
)

# FORBIDDEN: Hard delete
await db.execute(delete(StudySession).where(StudySession.id == session_id))
```

### 4.2 All Queries MUST Filter Soft-Deleted Records

Every query that retrieves business records MUST include a `deleted_at IS NULL` filter.

```python
# CORRECT
result = await db.execute(
    select(StudySession)
    .where(StudySession.user_id == user_id)
    .where(StudySession.deleted_at.is_(None))
)

# FORBIDDEN — will return deleted records
result = await db.execute(
    select(StudySession).where(StudySession.user_id == user_id)
)
```

**AI Agent Safety Rule:** AI agents generating repository query methods MUST default to including `deleted_at IS NULL`. The absence of this filter is a bug, not an optimization.

### 4.3 Exceptions to Soft Delete Policy

The following scenarios permit hard deletes and MUST be explicitly authorized:

| Scenario | Authorization Required |
|---|---|
| GDPR "right to erasure" requests | Engineering Lead + Legal sign-off |
| Test data in non-production environments | Standard PR review |
| Orphaned join table rows (e.g., `user_deck_assignments`) | Architecture review |
| Automated purge of `deleted_at` rows older than 2 years | Scheduled job, documented in runbooks |

---

## 5. INDEXING STRATEGY

### 5.1 Mandatory Indexes

The following indexes MUST be created for every table:

```sql
-- All queries filter by user_id; index is mandatory
CREATE INDEX idx_study_sessions_user_id ON study_sessions (user_id);

-- Soft delete queries always filter by deleted_at
CREATE INDEX idx_study_sessions_deleted_at ON study_sessions (deleted_at);

-- Composite for common combined filter
CREATE INDEX idx_study_sessions_user_active 
  ON study_sessions (user_id) 
  WHERE deleted_at IS NULL;
```

### 5.2 Prohibitions on Over-Indexing

Indexes are not free. Write performance degrades with each index. AI agents must not create indexes speculatively.

**Create an index when:**
- A query is measured to be slow (> 50ms P95 in production).
- A column appears in `WHERE`, `ORDER BY`, or `JOIN` conditions in high-frequency paths.

**Do NOT create an index when:**
- The table has fewer than 10,000 rows.
- The column has extremely low cardinality (e.g., `boolean` columns — use partial indexes instead).
- The index duplicates another index.

### 5.3 Partial Indexes for Soft-Delete Queries

Prefer partial indexes for filtered queries on active records to avoid index bloat from deleted rows:

```sql
-- Efficient: only indexes active rows
CREATE INDEX idx_flashcards_active_user 
  ON flashcards (user_id, deck_id) 
  WHERE deleted_at IS NULL;
```

---

## 6. QUERY SAFETY RULES

### 6.1 Prohibiting N+1 Queries

N+1 queries are a class of performance bug where an outer query returns N rows, and then N additional queries are executed in a loop. AI agents are highly prone to generating this pattern.

**FORBIDDEN Pattern:**
```python
sessions = await get_all_sessions(user_id)
for session in sessions:
    # N+1: executes one query per session
    session.flashcards = await get_flashcards_for_session(session.id)
```

**CORRECT Pattern — Eager Loading via JOIN:**
```python
result = await db.execute(
    select(StudySession)
    .options(selectinload(StudySession.flashcards))
    .where(StudySession.user_id == user_id)
    .where(StudySession.deleted_at.is_(None))
)
```

### 6.2 Pagination Is Mandatory on All List Queries

Any query that returns a collection of records MUST be paginated. Returning unbounded result sets is a denial-of-service vulnerability against the application's own database.

```python
# CORRECT — cursor-based pagination
result = await db.execute(
    select(StudySession)
    .where(StudySession.user_id == user_id)
    .where(StudySession.created_at < cursor)
    .order_by(StudySession.created_at.desc())
    .limit(page_size)
)
```

**Cursor-Based vs Offset Pagination:**
Use cursor-based pagination for all production queries. Offset pagination (`OFFSET 1000 LIMIT 20`) performs a full table scan up to the offset point, causing severe performance degradation on large tables.

### 6.3 Read Session vs Write Session Dependency

All database access MUST route through the correct session type via Dependency Injection:

```python
# FastAPI dependency injection
async def get_read_session() -> AsyncSession: ...
async def get_write_session() -> AsyncSession: ...

# Router usage
@router.get("/sessions")
async def list_sessions(db: AsyncSession = Depends(get_read_session)):
    ...

@router.post("/sessions")
async def create_session(db: AsyncSession = Depends(get_write_session)):
    ...
```

**WHY:** Anticipates future deployment of PostgreSQL read replicas. Routing reads to a read session enables the infrastructure layer to transparently redirect those queries to replicas without any application code changes.

---

## 7. TRANSACTION MANAGEMENT

### 7.1 Transaction Boundaries Belong in the Service Layer

Database transactions MUST be managed at the Service layer, not the Repository layer and not the Router layer.

```python
# CORRECT — Service layer manages the transaction
async def create_study_session_with_flashcards(
    session_data: SessionCreate,
    db: AsyncSession
) -> StudySession:
    async with db.begin():
        session = await session_repo.create(session_data, db)
        await flashcard_repo.bulk_create(session.id, session_data.flashcards, db)
        return session
```

**WHY:** Repositories must remain composable and reusable. If Repository A starts a transaction, Repository B cannot participate in it. Placing transaction control in the Service layer allows multiple repositories to participate in a single ACID unit of work.

### 7.2 Long-Running Transactions Are Forbidden

Database transactions MUST NOT span HTTP request-response cycles, and must NEVER make external HTTP calls (e.g., to LLM APIs) while a transaction is open.

**FORBIDDEN:**
```python
async with db.begin():
    session = await session_repo.create(session_data, db)
    # FORBIDDEN: External call holds the transaction open for seconds/minutes
    ai_result = await openai_client.generate_flashcards(session.content)
    await flashcard_repo.create(ai_result, db)
```

**CORRECT:** Enqueue the AI task after the transaction commits.

---

## 8. MULTI-TENANCY & DATA ISOLATION

### 8.1 Row-Level Security by `user_id`

Every query against a user-owned resource MUST include a `user_id` filter derived from the authenticated request context, not from the request payload.

```python
# CORRECT: user_id comes from the verified JWT token
@router.get("/sessions/{session_id}")
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_session)
):
    session = await session_repo.get_by_id(session_id, user_id=current_user.id, db=db)
```

**FORBIDDEN:** Using `session_id` alone as a lookup key. This is an Insecure Direct Object Reference (IDOR) vulnerability.

### 8.2 Future PostgreSQL Row-Level Security (RLS)

For future hardening, all user-owned tables MUST be designed to be compatible with PostgreSQL RLS policies:

```sql
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_user_isolation ON study_sessions
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

Even if RLS is not enabled now, table designs must not preclude enabling it.

---

## 9. FAILURE SCENARIOS & EDGE CASES

### 9.1 Scenario: Migration Applied to Production But Application Not Deployed

**Risk:** A migration adds a `NOT NULL` column without a default value. Existing rows violate the constraint. Queries fail.

**Prevention:** When adding a `NOT NULL` column to an existing table:
1. Add the column as `NULLABLE` first.
2. Backfill existing rows with a valid value.
3. Add the `NOT NULL` constraint in a subsequent migration.

### 9.2 Scenario: Concurrent Soft-Delete and Update

**Risk:** Two workers simultaneously read a row, one soft-deletes it, the other updates it. The update succeeds after the delete, reactivating a deleted record.

**Prevention:** Use optimistic locking via a `version` column and check it on updates:

```sql
ALTER TABLE study_sessions ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
```

```python
result = await db.execute(
    update(StudySession)
    .where(StudySession.id == session_id)
    .where(StudySession.version == expected_version)
    .where(StudySession.deleted_at.is_(None))
    .values(content=new_content, version=StudySession.version + 1)
)
if result.rowcount == 0:
    raise OptimisticLockError("Session was modified or deleted by another process")
```

### 9.3 Scenario: Database Connection Pool Exhaustion

**Risk:** A spike in traffic causes all Celery workers to hold database connections during long-running AI inference tasks, starving the web application of connections.

**Prevention:**
- Celery tasks MUST release database connections before making external API calls.
- Connection pool `pool_size` and `max_overflow` must be calibrated per environment.
- Configure `pool_pre_ping=True` to handle stale connections silently.

---

## 10. AI AGENT OPERATIONAL RULES FOR DATABASE TASKS

| Rule | Enforcement |
|---|---|
| Never generate `DELETE FROM` in application code | Hard rule — zero exceptions |
| Always include `deleted_at IS NULL` in queries | Automated code review check |
| Always prefix migration files with timestamp | CI validation |
| Always generate `downgrade()` for every `upgrade()` | Migration linter |
| Never add `NOT NULL` column to existing table without backfill plan | Architecture review |
| Never query another feature's tables directly | Dependency boundary enforcement |
| Always route reads to `get_read_session()` | Dependency injection pattern |
| Always validate `user_id` from auth context, never from payload | Security review |

---

*End of Database Rules — Last reviewed: 2026-05-07*
