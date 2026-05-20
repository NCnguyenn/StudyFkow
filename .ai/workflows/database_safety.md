# 🗄️ AI StudyFlow — Database Safety Workflow

> **Canonical Authority:** This document defines the exact workflow for ALL database changes
> in AI StudyFlow. Database changes are HIGH-RISK operations. Any deviation from this
> workflow is an architecture incident. Read `.ai/rules/database.md` first.

---

## 1. RISK TIERS FOR DATABASE OPERATIONS

| Tier | Operation | Risk Level | Protocol |
|---|---|---|---|
| **T1** | Add a new optional column | Low | Standard migration + PR review |
| **T2** | Add a new NOT NULL column to existing table | Medium | Two-phase migration required |
| **T3** | Add a new table | Low | Standard migration + PR review |
| **T4** | Create a new index | Low-Medium | Use `CONCURRENTLY` on large tables |
| **T5** | Rename a column | HIGH | Three-phase migration required |
| **T6** | Drop a column | HIGH | Two-phase: deprecate code, then drop |
| **T7** | Drop a table | CRITICAL | Full audit + two-phase protocol |
| **T8** | Modify a column type | HIGH | Two-phase with data backfill |
| **T9** | Change a CHECK constraint | HIGH | Create new column, migrate, drop old |

---

## 2. STANDARD MIGRATION WORKFLOW (T1, T3)

### Step 1 — Write the Schema Change in SQL First

Before generating the migration, write the target SQL:

```sql
-- What the table should look like after
ALTER TABLE study_sessions 
ADD COLUMN ai_summary TEXT NULL;

CREATE INDEX idx_study_sessions_has_summary 
ON study_sessions (id) WHERE ai_summary IS NOT NULL;
```

### Step 2 — Generate the Alembic Migration

```bash
alembic revision --autogenerate -m "add_ai_summary_to_study_sessions"
```

### Step 3 — Review the Generated File

**MANDATORY review checklist:**
- [ ] `upgrade()` contains the correct operations.
- [ ] `downgrade()` fully reverses `upgrade()`.
- [ ] No unintended table modifications were auto-detected.
- [ ] Filename follows convention: `YYYY_MM_DD_HHMM_description.py`.
- [ ] `created_at`/`updated_at` trigger is added if a new table was created.

### Step 4 — Apply to Development

```bash
alembic upgrade head
```

Verify the change in `psql`:
```sql
\d study_sessions  -- Confirm column exists with correct type and constraints
```

### Step 5 — Apply to Staging

```bash
# Via CI/CD environment variable override
ENVIRONMENT=staging alembic upgrade head
```

Run integration tests against staging database. All tests must pass.

### Step 6 — Apply to Production

Production migrations run automatically during deployment via CI/CD. The deployment pipeline:
1. Takes a database snapshot/backup.
2. Runs `alembic upgrade head`.
3. Deploys application code.
4. Verifies health check endpoint.

---

## 3. TWO-PHASE MIGRATION PROTOCOL (T2, T6, T8)

### For Adding a NOT NULL Column (T2)

**Phase 1 — Add as NULLABLE:**
```python
# Migration 1: 2026_05_07_1000_add_subscription_tier_nullable.py
def upgrade():
    op.add_column('users',
        sa.Column('subscription_tier', sa.String(50), nullable=True)
    )

def downgrade():
    op.drop_column('users', 'subscription_tier')
```

Deploy Phase 1. Application code should NOT reference the new column yet.

**Backfill existing rows:**
```python
# Migration 2: 2026_05_10_0900_backfill_subscription_tier.py
def upgrade():
    op.execute("""
        UPDATE users SET subscription_tier = 'free' WHERE subscription_tier IS NULL
    """)
    op.alter_column('users', 'subscription_tier', nullable=False)

def downgrade():
    op.alter_column('users', 'subscription_tier', nullable=True)
```

Deploy Phase 2. Update application code to use the column.

**WHY two phases:** Setting `NOT NULL` on a column with existing rows that have `NULL` values causes an immediate constraint violation error on the migration. The backfill must happen first.

### For Dropping a Column (T6)

**Phase 1 — Remove all code references (deploy):**
- Remove all ORM references to the column.
- Remove all SQL queries referencing the column.
- Deploy. Verify no errors in production for 14 days minimum.

**Phase 2 — Drop the column (deploy after validation):**
```python
def upgrade():
    op.drop_column('users', 'legacy_field')

def downgrade():
    op.add_column('users',
        sa.Column('legacy_field', sa.Text(), nullable=True)
    )
```

---

## 4. THREE-PHASE COLUMN RENAME PROTOCOL (T5)

**NEVER rename a column in a single migration. This causes zero-downtime deployments to break.**

**Phase 1 — Add new column alongside old:**
```python
def upgrade():
    op.add_column('study_sessions',
        sa.Column('duration_minutes', sa.Integer(), nullable=True)
    )
    # Copy existing data
    op.execute("""
        UPDATE study_sessions 
        SET duration_minutes = session_duration 
        WHERE session_duration IS NOT NULL
    """)

def downgrade():
    op.drop_column('study_sessions', 'duration_minutes')
```

Deploy Phase 1. Both columns exist. Application writes to old column only.

**Phase 2 — Update application to use new column name. Deploy.**

Both columns still exist in DB. Application now writes to new column.

**Phase 3 — Drop old column:**
```python
def upgrade():
    op.drop_column('study_sessions', 'session_duration')

def downgrade():
    op.add_column('study_sessions',
        sa.Column('session_duration', sa.Integer(), nullable=True)
    )
    op.execute("UPDATE study_sessions SET session_duration = duration_minutes")
```

---

## 5. INDEX CREATION SAFETY

### For Large Tables (> 100,000 rows in production)

Always use `CONCURRENTLY` to avoid table locks:

```python
def upgrade():
    # Standard: op.create_index('idx_...', 'table', ['col'])
    # For large tables — use raw SQL with CONCURRENTLY:
    op.execute("""
        CREATE INDEX CONCURRENTLY idx_flashcards_user_deck_active
        ON flashcards (user_id, deck_id)
        WHERE deleted_at IS NULL
    """)

def downgrade():
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_flashcards_user_deck_active")
```

**WARNING:** `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. Alembic wraps migrations in transactions by default. Add `with op.get_context().autocommit_block():` or disable the transaction in the migration:

```python
# Top of migration file
from alembic import op

def upgrade():
    connection = op.get_bind()
    connection.execute(sa.text("COMMIT"))  # Exit Alembic's transaction
    connection.execute(sa.text(
        "CREATE INDEX CONCURRENTLY idx_flashcards_user_deck_active "
        "ON flashcards (user_id, deck_id) WHERE deleted_at IS NULL"
    ))
```

---

## 6. ROLLBACK PROTOCOL

### If a Migration Fails in Staging

```bash
# Revert to previous version
alembic downgrade -1

# Verify the rollback succeeded
alembic current
```

### If a Migration Fails in Production (P0 Incident)

1. **STOP deployment pipeline immediately.**
2. Run `alembic downgrade -1` on the production database.
3. Revert the application code deployment.
4. Verify application health check returns 200.
5. Open a P0 incident in `.ai/memory/known_bugs.md`.
6. Do NOT attempt the migration again until root cause is identified.

### If Rollback Is Not Possible

Some operations cannot be rolled back (e.g., `DROP TABLE` with data). This is why:
- Hard deletes in application code are forbidden (`.ai/rules/database.md`).
- Production database backups MUST be taken before every migration run.
- The backup timestamp MUST be documented in the migration PR.

---

## 7. MIGRATION VALIDATION GATE

All migrations must pass this automated validation before merging:

```bash
# Run migration linter
python scripts/validate_migrations.py

# Checks performed:
# - All migrations have downgrade() functions
# - Filename follows timestamp convention
# - No ALTER COLUMN TYPE without explicit data conversion
# - No DROP COLUMN without prior code-removal commit
# - No CREATE INDEX without CONCURRENTLY on tables > 10k rows
```

---

## 8. DATABASE BACKUP PROTOCOL

### Before Any T5, T6, T7, T8 Migration in Production

```bash
# PostgreSQL logical backup
pg_dump -Fc -d studyflow_prod -f "backup_$(date +%Y%m%d_%H%M%S).pgdump"

# Verify backup integrity
pg_restore --list backup_*.pgdump | head -20
```

Document the backup filename in the migration PR description.

---

*End of Database Safety Workflow — Last reviewed: 2026-05-07*
