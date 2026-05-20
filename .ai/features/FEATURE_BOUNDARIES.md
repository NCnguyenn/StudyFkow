# 🗂️ AI StudyFlow — Feature Boundaries

> **Canonical Authority:** This document defines the ownership, responsibilities, and hard
> isolation boundaries of every vertical slice in the AI StudyFlow system. AI agents MUST
> consult this document before writing cross-feature code. Violations of feature boundaries
> are architecture incidents.

---

## 1. FEATURE ISOLATION PHILOSOPHY

### 1.1 Why Hard Boundaries Exist

In a long-lived AI-assisted codebase, undefined feature boundaries cause:
- **AI context contamination:** Agent loads Feature A context and accidentally modifies Feature B internals.
- **Ownership ambiguity:** Two agents modify the same shared file from different task contexts, causing merge conflicts and regression.
- **Blast radius explosion:** A bug in one feature silently propagates to 4 others through undocumented shared state.

Every feature in this system is a **bounded context** — a self-contained mini-application with explicit, documented, enforced contracts.

### 1.2 The Public Contract Rule

A feature MAY expose behavior to other features only through its **public contract** — the functions, types, and events declared in its root entrypoint (`__init__.py` for backend, `index.ts` for frontend). Everything not declared in the entrypoint is **private and may change without notice**.

---

## 2. FEATURE REGISTRY

| Feature Slug | Backend Path | Frontend Path | Owner Domain |
|---|---|---|---|
| `user_auth` | `backend/features/user_auth/` | `frontend/features/auth/` | Authentication & Identity |
| `study_sessions` | `backend/features/study_sessions/` | `frontend/features/sessions/` | Session Lifecycle |
| `flashcard_engine` | `backend/features/flashcard_engine/` | `frontend/features/flashcards/` | Card Management & Review |
| `ai_pipeline` | `backend/features/ai_pipeline/` | `frontend/features/ai_tasks/` | AI Task Orchestration |
| `spaced_repetition` | `backend/features/spaced_repetition/` | (consumed by flashcards UI) | Review Scheduling |
| `analytics` | `backend/features/analytics/` | `frontend/features/analytics/` | Stats & Progress |
| `sync_engine` | `backend/features/sync_engine/` | `frontend/features/sync/` | Offline-First Sync |
| `notifications` | `backend/features/notifications/` | `frontend/features/notifications/` | User Notifications |

---

## 3. FEATURE-BY-FEATURE BOUNDARY DEFINITIONS

---

### 3.1 `user_auth`

**Owns:**
- User registration, login, logout, token refresh.
- JWT generation and validation middleware.
- Password hashing and credential storage.
- `users` database table.
- `refresh_tokens` database table.
- Subscription tier storage and enforcement gateway.

**Public Contract (Backend `__init__.py` exports):**
```python
get_current_user(request) -> User          # FastAPI dependency — used by ALL other features
get_user_tier(user_id: UUID) -> str        # Returns "free" | "pro" | "enterprise"
get_user_summary(user_id: UUID) -> UserSummary  # Read-only user projection
emit_user_deleted_event(user_id: UUID)     # Called on account deletion
```

**Public Contract (Frontend `index.ts` exports):**
```typescript
useAuth(): AuthState                       // Hook — provides user, isLoading, logout
AuthGuard: React.FC                        // Route protection wrapper
getAuthHeaders(): Record<string, string>   // For API calls in other features
```

**FORBIDDEN — Other Features MUST NOT:**
- Query the `users` table directly.
- Import from `user_auth/infrastructure/` or `user_auth/application/`.
- Generate or validate JWT tokens outside this feature.
- Store or read `subscription_tier` without calling `get_user_tier()`.

**Event Emissions:**
| Event | Trigger | Consumers |
|---|---|---|
| `USER_DELETED` | Account deletion | `study_sessions`, `flashcard_engine`, `analytics` |
| `USER_TIER_CHANGED` | Subscription upgrade/downgrade | `ai_pipeline`, `flashcard_engine` |

---

### 3.2 `study_sessions`

**Owns:**
- Study session CRUD lifecycle (create, read, update, soft-delete).
- Session status machine (`queued → active → paused → completed`).
- Session-to-topic associations.
- `study_sessions` database table.
- `session_topics` join table.

**Public Contract (Backend `__init__.py` exports):**
```python
get_session_summary(session_id: UUID, user_id: UUID) -> SessionSummary
get_user_active_sessions(user_id: UUID) -> list[SessionSummary]
emit_session_completed_event(session_id: UUID)
```

**Public Contract (Frontend `index.ts` exports):**
```typescript
useStudySession(sessionId: string): SessionState
useSessionList(filters: SessionFilters): PaginatedSessionList
SessionStatusBadge: React.FC<{ status: SessionStatus }>
```

**FORBIDDEN — Other Features MUST NOT:**
- Query `study_sessions` table directly from another feature's repository.
- Mutate session status from outside this feature (e.g., `analytics` must not set `status=completed`).
- Read session notes content from outside this feature without explicit contract method.

**Event Emissions:**
| Event | Trigger | Consumers |
|---|---|---|
| `SESSION_COMPLETED` | Session marked complete | `analytics`, `notifications`, `spaced_repetition` |
| `SESSION_DELETED` | Soft delete | `analytics`, `flashcard_engine` (disassociate) |

---

### 3.3 `flashcard_engine`

**Owns:**
- Flashcard CRUD (individual cards within a deck).
- Deck management (create, rename, archive decks).
- Session-to-deck association.
- AI-generated card ingestion (receives output from `ai_pipeline`).
- `flashcards` database table.
- `flashcard_decks` database table.
- `session_deck_assignments` join table.

**Public Contract (Backend `__init__.py` exports):**
```python
get_deck_summary(deck_id: UUID, user_id: UUID) -> DeckSummary
ingest_ai_generated_cards(deck_id: UUID, cards: list[FlashcardItem]) -> int  # Returns count
get_cards_due_for_review(user_id: UUID, limit: int) -> list[FlashcardReviewItem]
```

**FORBIDDEN — Other Features MUST NOT:**
- Write to `flashcards` table except via `ingest_ai_generated_cards()`.
- Read `flashcards.back` (answer content) for anything other than review — prevent answer leakage.
- Delete cards directly — soft delete only via `flashcard_engine` service.

**Event Emissions:**
| Event | Trigger | Consumers |
|---|---|---|
| `DECK_ARCHIVED` | Deck soft-deleted | `study_sessions` (disassociate), `spaced_repetition` (pause schedule) |
| `CARDS_INGESTED` | AI cards saved | `spaced_repetition` (schedule initial reviews) |

---

### 3.4 `ai_pipeline`

**Owns:**
- Celery task lifecycle for all AI inference tasks.
- LLM provider selection, fallback, and retry logic.
- Prompt template management and versioning.
- `ai_tasks` database table.
- Token usage tracking.
- User AI quota enforcement.

**Public Contract (Backend `__init__.py` exports):**
```python
enqueue_flashcard_generation(
    deck_id: UUID, user_id: UUID, source_content: str, card_count: int
) -> str  # Returns task_id

get_task_status(task_id: str, user_id: UUID) -> AITaskStatus
cancel_task(task_id: str, user_id: UUID) -> bool
get_user_monthly_token_usage(user_id: UUID) -> int
```

**FORBIDDEN — Other Features MUST NOT:**
- Import or instantiate `AIPipelineOrchestrator` directly.
- Call LLM provider SDKs (`openai`, `anthropic`, etc.) outside this feature.
- Write to `ai_tasks` table directly.
- Implement retry or fallback logic for LLM calls anywhere outside this feature.

**Event Emissions:**
| Event | Trigger | Consumers |
|---|---|---|
| `AI_TASK_COMPLETED` | Generation finishes | `flashcard_engine` (ingest cards), `notifications` |
| `AI_TASK_FAILED` | All retries exhausted | `notifications` (alert user) |

---

### 3.5 `spaced_repetition`

**Owns:**
- SM-2 / FSRS scheduling algorithm.
- Review session scheduling and due-date calculation.
- Review outcome recording.
- `card_review_records` database table.
- `card_schedules` database table.

**Public Contract (Backend `__init__.py` exports):**
```python
schedule_initial_reviews(card_ids: list[UUID]) -> None
record_review_outcome(
    card_id: UUID, user_id: UUID, outcome: ReviewOutcome
) -> NextReviewSchedule
get_due_cards(user_id: UUID, deck_id: UUID | None, limit: int) -> list[UUID]
```

**FORBIDDEN — Other Features MUST NOT:**
- Modify `card_schedules` table directly.
- Implement review interval calculation outside this feature.
- Read raw `ease_factor` or `interval` fields — use public summary types only.

---

### 3.6 `analytics`

**Owns:**
- Pre-aggregated study statistics (sessions per day, cards reviewed, focus time).
- Progress trend calculations.
- `user_stats` database table.
- `daily_study_summaries` materialized aggregates.
- Celery beat jobs for stats recomputation.

**Public Contract (Backend `__init__.py` exports):**
```python
get_user_dashboard_stats(user_id: UUID, period_days: int) -> DashboardStats
get_study_streak(user_id: UUID) -> StudyStreakInfo
```

**FORBIDDEN — Other Features MUST NOT:**
- Query `study_sessions` or `card_review_records` for analytics purposes directly. Use `analytics` exports.
- Write raw session or review data to `user_stats` — only `analytics` Celery jobs do this.

---

### 3.7 `sync_engine`

**Owns:**
- Mutation queue processing (`POST /sync/push`).
- Change feed generation (`GET /sync/pull`).
- Conflict resolution logic (Last-Write-Wins by `updated_at`).
- `sync_mutations` database table.
- `sync_checkpoints` database table.

**Public Contract (Backend `__init__.py` exports):**
```python
process_push(client_id: str, user_id: UUID, mutations: list[Mutation]) -> PushResult
generate_pull(user_id: UUID, since: datetime, client_id: str) -> PullResult
```

**FORBIDDEN:**
- `sync_engine` MUST NOT implement feature-specific business logic. It only routes mutations to the correct feature's service layer.
- Feature services MUST NOT directly call `sync_engine` — sync is driven by HTTP endpoints only.

---

### 3.8 `notifications`

**Owns:**
- In-app notification creation and delivery.
- WebSocket channel management per user.
- `notifications` database table.

**Public Contract (Backend `__init__.py` exports):**
```python
send_notification(user_id: UUID, notification: NotificationPayload) -> None
```

**FORBIDDEN:**
- No other feature sends WebSocket messages directly. They call `send_notification()`.
- `notifications` MUST NOT contain study or flashcard domain logic.

---

## 4. OWNERSHIP MATRIX

| Resource | Owner Feature | Read Permission | Write Permission |
|---|---|---|---|
| `users` table | `user_auth` | `user_auth` only | `user_auth` only |
| `study_sessions` table | `study_sessions` | `study_sessions`, `analytics` (via JOIN) | `study_sessions` only |
| `flashcards` table | `flashcard_engine` | `flashcard_engine`, `spaced_repetition` | `flashcard_engine` only |
| `ai_tasks` table | `ai_pipeline` | `ai_pipeline` only | `ai_pipeline` only |
| `card_schedules` table | `spaced_repetition` | `spaced_repetition`, `flashcard_engine` (via contract) | `spaced_repetition` only |
| `user_stats` table | `analytics` | `analytics` only | `analytics` Celery jobs only |
| `sync_mutations` table | `sync_engine` | `sync_engine` only | `sync_engine` only |
| Redis task status | `ai_pipeline` | `ai_pipeline`, HTTP status endpoint | `ai_pipeline` only |
| Redis sync locks | `sync_engine` | `sync_engine` only | `sync_engine` only |

---

## 5. CROSS-FEATURE COMMUNICATION RULES

### 5.1 Synchronous Communication (Function Calls)

Allowed only when:
- The callee is an upstream dependency (e.g., `study_sessions` calls `user_auth`).
- The call is through the callee's public contract entrypoint.
- The call is read-only or emits a domain event.

```python
# CORRECT — calling via public contract
from features.user_auth import get_user_tier
tier = await get_user_tier(user_id)

# FORBIDDEN — internal import
from features.user_auth.application.subscription_service import _check_tier
```

### 5.2 Asynchronous Communication (Events via Celery)

Preferred for write operations that cross feature boundaries:

```python
# CORRECT — event emission in study_sessions
from features.study_sessions.domain.events import SESSION_COMPLETED_EVENT
await celery_app.send_task(
    "analytics.process_session_completion",
    kwargs={"session_id": str(session_id), "user_id": str(user_id)},
)
```

Event consumer tasks MUST be idempotent. The same event may be delivered more than once.

### 5.3 Database Cross-Feature Access

**Hard Rule:** Direct SQL queries across feature table boundaries are FORBIDDEN.

```sql
-- FORBIDDEN: analytics querying sessions table directly
SELECT COUNT(*) FROM study_sessions WHERE user_id = $1 AND status = 'completed';

-- CORRECT: analytics reads from pre-aggregated user_stats
SELECT sessions_completed FROM user_stats WHERE user_id = $1;
```

---

## 6. SAFE EXTENSION STRATEGY

### 6.1 Adding a New Feature

1. Create the directory structure:
```
backend/features/<new_feature>/
├── __init__.py          # Public contract ONLY
├── domain/
│   ├── models.py        # Pydantic models
│   └── interfaces.py    # Abstract repository interfaces
├── application/
│   └── service.py       # Business logic
├── infrastructure/
│   ├── repository.py    # DB queries
│   └── adapters.py      # External services
└── api/
    └── router.py        # FastAPI routes
```

2. Register the router in `backend/main.py`.
3. Add the feature to this document's Feature Registry.
4. Add its tables to `.ai/architecture/impact_map.md`.
5. Define public contract in `__init__.py` before implementing anything else.

### 6.2 Extending an Existing Feature

- New public contract methods must be **additive only** — no signature changes to existing exports.
- New database columns must follow `.ai/rules/database.md` migration protocol.
- New events emitted must be registered in this document's event table.

### 6.3 Deprecating a Feature Contract Method

1. Mark the method with a deprecation comment including target removal date.
2. Identify all callers using grep/search.
3. Migrate all callers to the replacement method.
4. Remove the deprecated method only when caller count is zero.
5. Update this document.

---

## 7. ANTI-PATTERNS

| Anti-Pattern | Description | Consequence |
|---|---|---|
| **Feature Tunneling** | Feature A imports from Feature B's `infrastructure/` layer | Hidden coupling; B cannot refactor safely |
| **Shared Mutable State** | Two features write to the same Redis key | Race conditions, cache corruption |
| **God Router** | One FastAPI router handles endpoints from 3+ feature domains | Impossible to isolate context for AI agents |
| **Cross-DB-Transaction** | Service opens a DB transaction spanning two features' tables | Deadlock risk; impossible to shard |
| **Event Leakage** | Feature A reads Feature B's domain events without declaring the dependency | Invisible coupling; B cannot change event schema |

---

*End of Feature Boundaries — Last reviewed: 2026-05-07*
