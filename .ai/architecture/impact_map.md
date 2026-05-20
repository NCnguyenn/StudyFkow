# 🗺️ AI StudyFlow — Architecture Impact Map

> **Canonical Authority:** This document maps the blast radius of changes across the system.
> Before modifying any shared system, AI agents MUST consult this document to understand
> which features and layers will be affected. Undocumented modifications to shared systems
> are classified as architecture incidents.

---

## 1. PURPOSE & USAGE PROTOCOL

### 1.1 What Is an Impact Map?

An impact map is a reverse-dependency reference that answers the question:
**"If I change X, what breaks?"**

Unlike a forward-dependency graph (which shows what A depends on), the impact map shows which systems depend ON a given module. This is the critical information needed before a refactor, schema change, or API modification.

### 1.2 How AI Agents Must Use This Document

**Before modifying any of the systems listed below:**
1. Locate the system's entry in this document.
2. Read all dependent systems listed under it.
3. Classify the change risk (Tier 1/2/3 per `.ai/rules/refactor.md`).
4. Load the context for each dependent system to verify no contract breakage.

---

## 2. SHARED INFRASTRUCTURE IMPACT MAP

### 2.1 PostgreSQL Database Schema

**Any change to a table's schema impacts:**

| Table Modified | Downstream Dependents |
|---|---|
| `users` | `auth` module, `study_sessions`, `flashcard_decks`, `user_stats`, `sync` engine, all JWT validation |
| `study_sessions` | `analytics`, `sync` engine push/pull, flashcard association, AI task queue |
| `flashcards` | `flashcard_engine` service, `spaced_repetition` scheduler, AI generation pipeline |
| `flashcard_decks` | `flashcard_engine`, `study_sessions` (association), AI pipeline context |
| `ai_tasks` | AI pipeline orchestrator, `/tasks/{id}/status` endpoint, Celery workers |
| `sync_mutations` | Offline-first sync engine, conflict resolution logic, `POST /sync/push` |
| `user_stats` | Analytics aggregation jobs, dashboard API, Celery beat cron jobs |

**Risk:** A schema change to `users` is a Tier 3 operation because it affects authentication (login/JWT validation), all data access (every table has `user_id`), and the sync engine.

---

### 2.2 Redis

**Any change to Redis key structure or TTL strategy impacts:**

| Redis Usage | Dependents |
|---|---|
| Session cache (`session:{user_id}`) | `/sessions` GET endpoints, frontend polling |
| AI task status (`task:{task_id}:status`) | `/tasks/{id}/status` endpoint, Celery task publisher |
| Rate limit counters (`ratelimit:{user_id}:{endpoint}`) | All API middleware |
| Sync state locks (`sync_lock:{user_id}`) | `POST /sync/push` concurrency control |
| WebSocket channel IDs (`ws:{user_id}:channel`) | Real-time notification system |

**AI Agent Rule:** If you change a Redis key naming pattern, you MUST update ALL code that reads or writes that key. Stale key patterns result in cache misses or silent corruption.

---

### 2.3 Celery Task Registry

**Any change to a Celery task signature impacts:**

| Task Changed | Dependents |
|---|---|
| `generate_flashcards_task` | `POST /flashcards/generate` router, AI pipeline orchestrator |
| `sync_session_analytics_task` | Celery beat schedule, user stats aggregation |
| `send_study_reminder_task` | Notification service, user preference settings |
| `cleanup_expired_tasks_task` | `ai_tasks` table purge logic |

**Risk:** Celery tasks are serialized when enqueued. If you change a task's parameters while old tasks are still in the queue, the new worker will fail to deserialize the old task format. Always maintain backward-compatible Celery task signatures or flush the queue during deployment.

---

## 3. VERTICAL SLICE IMPACT MAP

### 3.1 `user_auth` Feature

**What depends on `user_auth`:**

| Dependent | What It Uses |
|---|---|
| ALL API routes | `get_current_user` dependency injection |
| `study_sessions` feature | `user_id` from auth context for ownership validation |
| `flashcard_engine` feature | `subscription_tier` for quota enforcement |
| `sync` engine | `user_id` for sync mutation ownership |
| `analytics` feature | `user_id` for stats aggregation |
| Frontend auth hooks | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |

**High-Risk Change Scenarios:**
- Changing the JWT payload structure (adding/removing fields) breaks ALL route handlers using `Depends(get_current_user)`.
- Changing `subscription_tier` enum values breaks quota enforcement in `flashcard_engine`.
- Changing the `users` table schema affects every feature that stores `user_id` as a logical reference.

---

### 3.2 `study_sessions` Feature

**What depends on `study_sessions`:**

| Dependent | What It Uses |
|---|---|
| `sync` engine | `study_sessions` mutation format in push/pull API |
| `analytics` feature | Session duration, completion rate, topic associations |
| `flashcard_engine` | Session-to-deck associations |
| AI pipeline | Session notes as source content for flashcard generation |
| Frontend session hooks | All session CRUD endpoints |

**High-Risk Change Scenarios:**
- Changing `StudySession.status` enum values breaks the sync engine's mutation processing and frontend state machines.
- Changing session duration calculation logic breaks analytics pre-computed stats.

---

### 3.3 `flashcard_engine` Feature

**What depends on `flashcard_engine`:**

| Dependent | What It Uses |
|---|---|
| AI pipeline | `deck_id` as context, flashcard schema for generated output |
| `spaced_repetition` scheduler | Card difficulty, `next_review_at` timestamps |
| Sync engine | Flashcard mutation format |
| Frontend deck hooks | All flashcard CRUD and review endpoints |

**High-Risk Change Scenarios:**
- Changing the `FlashcardItem` schema breaks the AI pipeline's output validation.
- Changing `next_review_at` calculation breaks the spaced repetition scheduler.

---

### 3.4 Offline Sync Engine

**What depends on the sync engine:**

| Dependent | What It Uses |
|---|---|
| All frontend features | Sync queue, IndexedDB mutation format |
| `POST /sync/push` endpoint | Mutation schema |
| `GET /sync/pull` endpoint | Change event schema |
| Conflict resolution logic | `client_timestamp` + `server_timestamp` comparison |

**High-Risk Change Scenarios:**
- Changing the mutation schema format is a breaking change for ALL offline-first frontend features simultaneously. This requires a versioned sync protocol migration.
- Changing the conflict resolution algorithm from Last-Write-Wins to another strategy impacts data consistency guarantees already documented to users.

---

### 3.5 AI Pipeline Orchestrator

**What depends on the AI Pipeline:**

| Dependent | What It Uses |
|---|---|
| `POST /flashcards/generate` | Task enqueue interface |
| Celery workers | `generate_flashcards_task` signature |
| `GET /tasks/{id}/status` | Task status Redis key format |
| `flashcard_engine` | Output schema for generated cards |
| LLM provider adapters | `LLMProvider` interface |

**High-Risk Change Scenarios:**
- Changing the `LLMProvider` interface breaks ALL provider implementations simultaneously (OpenAI, Local Llama, etc.).
- Changing the AI task result schema breaks the `flashcard_engine` validation that consumes it.
- Changing the Celery task signature while the queue has in-flight tasks causes deserialization failures.

---

## 4. FRONTEND IMPACT MAP

### 4.1 Shared Frontend Hooks

| Hook | Dependents |
|---|---|
| `useAuth()` | All authenticated page layouts, protected routes |
| `useStudySession()` | Session dashboard, session detail pages |
| `useSyncEngine()` | All mutation-performing hooks |
| `useFlashcardDeck()` | Deck browser, review screen, AI generation dialog |

**Risk:** Changes to `useAuth()` affect every authenticated page. This hook MUST maintain a stable return interface.

### 4.2 Shared UI Components

| Component | Dependents |
|---|---|
| `<Button />` | All pages, forms, dialogs |
| `<Modal />` | Session creation, flashcard generation, settings |
| `<LoadingSpinner />` | All async data loading states |
| `<ErrorBoundary />` | All feature-level components |

**Risk:** Changes to shared UI component prop interfaces are breaking changes for all consumers.

---

## 5. CROSS-CUTTING CONCERN IMPACT MAP

### 5.1 Error Class Hierarchy

**Any change to the base error classes impacts:**
- All FastAPI exception handlers.
- All Celery task error reporting.
- Frontend error boundary responses.
- Structured logging format.

**Rule:** Base error classes are Tier 3 changes. New error classes may be added (additive). Existing error class signatures MUST NOT change.

### 5.2 Logging Middleware

**Any change to the structured logging format impacts:**
- All log aggregation queries in Grafana/Loki.
- All alerting rules based on log fields.
- Trace ID propagation to Celery tasks.

**Rule:** Log field names (especially `trace_id`, `user_id`, `event_name`) MUST remain stable. Adding new fields is safe. Removing or renaming fields is a Tier 3 change.

### 5.3 Pydantic Settings (Environment Configuration)

**Any change to `settings.py` impacts:**
- Application startup (missing required settings cause startup failures).
- All infrastructure adapters that read settings.
- Docker Compose and Kubernetes deployment manifests.
- CI/CD pipeline environment variable injection.

**Rule:** Adding a new `required` setting without providing a default value is a Tier 3 change. ALL environments (development, staging, production, CI) must have the value injected before the code is deployed.

---

## 6. IMPACT MAP MAINTENANCE RULES

### 6.1 AI Agents Must Keep This Document Current

After adding a new feature, a shared utility, or a cross-cutting concern:
1. Identify what new dependencies were introduced.
2. Add an entry to the relevant section of this document.
3. If the new feature is itself a shared dependency, create a new section for it.

### 6.2 Stale Impact Maps Are Dangerous

A stale impact map is worse than no impact map because it creates **false confidence**. An AI agent consulting a stale map will believe its change is safe when it is not.

**Rule:** Every PR that modifies a shared system MUST include an update to this document as part of the acceptance criteria.

---

*End of Impact Map — Last reviewed: 2026-05-07*
