# 🎓 Jules Onboarding — Backend Lead, AI StudyFlow

> **Tài liệu này là điểm khởi đầu duy nhất của bạn.**
> Đọc từ đầu đến cuối trước khi viết bất kỳ dòng code nào.

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Role**         | Backend Lead                               |
| **Scope**        | `backend/` directory — full ownership      |
| **Last updated** | 2026-06-27                                 |
| **Maintained by**| Antigravity (Frontend & Architecture Lead) |

---

## 1. Giới thiệu dự án

**AI StudyFlow** là ứng dụng học tập thông minh với giao diện phòng học 3D minh hoạ (illustrated study room). Ứng dụng kết hợp quản lý học tập, ghi chú, AI chat, và phân tích tiến độ trong một nền tảng duy nhất.

### Core Vision

- A **personal study companion** powered by AI — not just another to-do app.
- The frontend renders a cozy, animated study room; the backend provides the intelligence layer behind it.

### Tech Overview

| Layer      | Stack                                         |
| ---------- | --------------------------------------------- |
| Frontend   | Next.js 14+ (App Router), TypeScript, Tailwind CSS v4 |
| Backend    | FastAPI, Python 3.11+                         |
| Database   | PostgreSQL 15, Redis 7, ChromaDB              |
| Infra      | Docker Compose (local), Alembic (migrations)  |

### Target Users

- University & high-school students managing coursework.
- Lifelong learners building personal knowledge bases.
- Anyone who wants AI-assisted study planning and note-taking.

---

## 2. Vai trò của Jules

### Ownership

You are the **Backend Lead**. You own the entire `backend/` directory — every file, every endpoint, every migration.

### Trách nhiệm chính

| Area              | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| API Endpoints     | Design, implement, and maintain all REST endpoints          |
| Database          | Schema design, migrations, query optimization               |
| Business Logic    | Service-layer orchestration across features                  |
| Background Jobs   | Celery tasks, beat schedules, worker reliability             |
| Testing           | Unit tests, integration tests, coverage enforcement          |
| Documentation     | Endpoint docs, migration changelogs, `backend/docs/`         |

### Ranh giới — KHÔNG được chạm

> [!CAUTION]
> The following paths are **off-limits**. Do not read, modify, or create files in these locations:

| Path              | Owner        | Reason                              |
| ----------------- | ------------ | ----------------------------------- |
| `frontend/`       | Antigravity  | UI/UX, components, styling          |
| `.ai/`            | Antigravity  | Architecture docs, AI entrypoint    |
| `DESIGN.md`       | Antigravity  | Design system specification         |
| `.cursorrules`    | Antigravity  | Editor-level AI directives          |

---

## 3. Tech Stack

### Application Framework

| Package                  | Version | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| **FastAPI**              | 0.110+  | ASGI web framework                     |
| **Uvicorn**              | 0.29+   | ASGI server (HTTP/1.1, WebSocket)      |
| **Pydantic v2**          | 2.x     | Request/response validation & schemas  |

### Database & ORM

| Package                  | Version | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| **SQLAlchemy**           | 2.0+    | Async ORM with `AsyncSession`          |
| **asyncpg**              | latest  | PostgreSQL async driver                |
| **Alembic**              | 1.13+   | Schema migrations (auto-generate)      |
| **PostgreSQL**           | 15      | Primary relational database            |

### Background Processing

| Package                  | Version | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| **Celery**               | 5.3+    | Distributed task queue                 |
| **Redis**                | 7       | Celery broker + result backend + cache |
| **celery[redis]**        | —       | Redis transport for Celery             |

### AI & Vector Search

| Package                  | Version | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| **ChromaDB**             | latest  | Vector database for RAG embeddings     |
| **httpx**                | 0.27+   | Async HTTP client for LLM API calls    |

### Auth & Security

| Package                  | Version | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| **python-jose[cryptography]** | latest | JWT token encoding/decoding       |
| **passlib[argon2]**      | latest  | Password hashing (Argon2id)            |

### Infrastructure (Docker Compose)

```yaml
services:
  db:        # PostgreSQL 15
  pgbouncer: # Connection pooling
  redis:     # Redis 7 — broker, cache, pub/sub
```

---

## 4. Codebase Structure

AI StudyFlow backend follows a **vertical slice architecture** — each feature is a self-contained module with its own API, service, domain, and infrastructure layers.

### Top-Level Layout

```
backend/
├── app/
│   ├── main.py                # FastAPI app factory, router registration
│   └── core/
│       ├── base.py            # SQLAlchemy DeclarativeBase
│       ├── database.py        # Async engine + session factories
│       └── celery_app.py      # Celery config + beat schedule
│
├── features/                   # ── Active feature modules ──
│   ├── user_auth/             # 8 endpoints  │ JWT authentication
│   ├── study_sessions/        # 5 endpoints  │ 2 Celery tasks
│   ├── task_management/       # 11 endpoints │ Subjects + Tasks CRUD
│   ├── analytics/             # 4 endpoints  │ Insight generator
│   ├── notes/                 # 8 endpoints  │ 10 DB tables
│   ├── realtime/              # SSE stream   │ Redis Pub/Sub
│   ├── chat/                  # RAG pipeline │ LLM (currently mocked)
│   └── ai_pipeline/           # LLM providers + Celery workers
│
├── alembic/                    # 20 migration files
├── tests/                      # Minimal coverage (2 test files)
└── docs/                       # 📍 You are here
```

### Feature Module Pattern (4-Layer)

Every feature under `features/{name}/` follows this exact structure:

```
features/{name}/
├── api/               # FastAPI routers, dependency injection
│   ├── router.py      #   Route definitions + HTTP handling
│   └── dependencies.py #   Depends() factories
│
├── application/       # Service layer — business orchestration
│   └── service.py     #   Use-case logic, calls repositories
│
├── domain/            # Pure domain — no framework imports
│   ├── models.py      #   Pydantic schemas (request/response)
│   ├── exceptions.py  #   Feature-specific exceptions
│   └── interfaces.py  #   Abstract repository contracts
│
└── infrastructure/    # Persistence & external adapters
    ├── orm.py         #   SQLAlchemy ORM models
    └── repository.py  #   Concrete repository (implements interfaces)
```

> [!IMPORTANT]
> **Dependency rule:** `api → application → domain ← infrastructure`.
> The `domain/` layer must NEVER import from `api/`, `application/`, or `infrastructure/`.

---

## 5. Backend Roadmap (B1 → B6)

### Legend

| Tag                      | Meaning                                             |
| ------------------------ | --------------------------------------------------- |
| 🟢 **ĐỘC LẬP**         | No dependencies — start immediately                 |
| 🔴 **PHỤ THUỘC**        | Blocked until dependency is resolved                 |
| `HIGH` / `MEDIUM` / `LOW` | Priority level                                     |

---

### B0 — Prerequisites (Setup trước khi bắt đầu) 🟢

> **Priority: HIGHEST** — Do this before touching any code.

- [ ] Rename `.env.example` to `.env` and fill in the required values.
- [ ] Ensure Docker is running and execute `docker compose up -d db redis`.
- [ ] Run migrations using `alembic upgrade head`.

---

### B1 — Bug Fixes & Cleanup 🟢

> **Priority: HIGH** — Start immediately. These are low-hanging fruit that improve code health.

- [ ] **Remove debug stack trace** — Delete `traceback.print_stack()` call in
      `study_sessions/infrastructure/orm.py` (lines 42–45).
- [ ] **Fix file encoding** — Convert `requirements.txt` from UTF-16LE to UTF-8.
      ```bash
      iconv -f UTF-16LE -t UTF-8 requirements.txt > requirements_fixed.txt
      mv requirements_fixed.txt requirements.txt
      ```
- [ ] **Remove empty stubs** — Delete the 8 empty/placeholder directories under
      `backend/app/features/` that contain no functional code.
- [ ] **Fix hardcoded timestamp** — In `user_auth/api/router.py` line 32, replace
      the hardcoded datetime with:
      ```python
      from datetime import datetime, timezone
      now = datetime.now(timezone.utc)
      ```
- [ ] **Replace mocked LLM response** — In `chat/application/rag_service.py`,
      replace the static mock with a real provider call through `ai_pipeline`.
- [ ] **Replace mocked voice transcription** — In `ai_pipeline/worker.py`,
      replace the mock with a placeholder that returns a clear
      `NotImplementedError` message instead of silently returning fake data.

---

### B2 — Test Coverage 🟢

> **Priority: HIGH** — Start immediately. Current coverage is near zero.

- [ ] Write **unit tests** for ALL feature service layers (only 2 test files exist today).
- [ ] Write **integration tests** for every API endpoint — test happy path + error cases.
- [ ] **Target: ≥ 70% coverage** on core modules (`application/`, `api/`).
- [ ] Reference: see [`backend/docs/TESTING_GUIDE.md`](file:///d:/Personal_Project/AI_StudyFlow/backend/docs/TESTING_GUIDE.md) for test patterns and fixtures.

```bash
# Run with coverage
pytest backend/features/ -v --cov=backend --cov-report=term-missing
```

---

### B3 — Notes API Expansion 🟢

> **Priority: MEDIUM** — Start immediately. Models and schemas already exist; endpoints need wiring.

- [ ] **Note Templates CRUD** — Expose create / read / update / delete endpoints
      for note templates (ORM models & Pydantic schemas already defined).
- [ ] **Note Search** — Expose a full-text search endpoint; the PostgreSQL
      `tsvector` index already exists on the notes table.
- [ ] **Version History** — Expose endpoints to list and restore note versions
      (version snapshots table exists).
- [ ] **Zettelkasten Links** — Expose endpoints for creating/querying note-to-note
      links (`note_links` junction table exists).
- [ ] **Themes / Workspace Kits** — Expose endpoints for note appearance
      customization (theme tables exist).

---

### B4 — Chat LLM Integration 🟢

> **Priority: MEDIUM** — Start immediately. The RAG pipeline skeleton exists; the LLM call is mocked.

- [ ] **Wire real LLM provider** — Replace the mock in `rag_service.py` with an
      actual call using the `ai_pipeline` provider abstraction.
- [ ] **Streaming responses (SSE)** — Return LLM completions as a
      `StreamingResponse` using Server-Sent Events.
- [ ] **Conversation history** — Persist chat turns (new `chat_messages` table)
      or use Redis for short-lived in-memory history.

---

### B5 — Flashcard Engine 🔴

> **Priority: LOW** — Blocked: requires API contract from Antigravity (frontend spec).

- [ ] Create `features/flashcard_engine/` following the 4-layer vertical slice.
- [ ] **Database tables:** `flashcard_sets`, `flashcards` (with UUID PKs, soft-delete).
- [ ] **CRUD endpoints** for sets and individual cards.
- [ ] **Review scheduling logic** — basic "next review" date calculation.

---

### B6 — Spaced Repetition 🔴

> **Priority: LOW** — Blocked: depends on B5 (Flashcard Engine).

- [ ] **SM-2 algorithm** implementation (SuperMemo 2) with configurable parameters.
- [ ] **Review queue endpoint** — fetch cards due for review, ordered by priority.
- [ ] **Statistics & progress tracking** — daily reviews, retention rate, streak data.

---

## 6. Golden Rules

> [!WARNING]
> Violating these rules will cause merge conflicts, broken contracts, or data corruption.
> Read carefully and follow without exception.

| #  | Rule                                                                                     |
| -- | ---------------------------------------------------------------------------------------- |
| 1  | **KHÔNG chạm** `frontend/`, `.ai/`, `DESIGN.md`, `.cursorrules` — ever.                 |
| 2  | **KHÔNG thay đổi** existing API response shapes. You may only **ADD** new fields.        |
| 3  | **Đọc** `TEAM_BOUNDARIES.md` ở root repo trước khi bắt đầu bất kỳ task nào.            |
| 4  | **Đọc** `API_CONTRACTS.md` để biết endpoints nào đã có và response shapes hiện tại.     |
| 5  | **Mọi DB migration** phải qua Alembic — không dùng raw SQL hoặc manual DDL.             |
| 6  | **Soft-delete pattern** — use `deleted_at TIMESTAMPTZ` (nullable) instead of hard delete.|
| 7  | **UUID primary keys** everywhere — no auto-increment integers.                           |
| 8  | **TIMESTAMPTZ** cho tất cả datetime columns — no naive datetimes.                        |

### Additional Conventions

- **Commit messages:** Use conventional commits (`feat:`, `fix:`, `refactor:`, `test:`).
- **Branch naming:** `backend/<ticket-or-task>` (e.g., `backend/b1-bug-fixes`).
- **Import order:** stdlib → third-party → local (enforced by `isort`).
- **Type hints:** All function signatures must include type annotations.

---

## 7. Getting Started

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Git

### Quick Start

```bash
# 1. Start infrastructure (PostgreSQL + Redis)
docker compose up -d db redis

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Run database migrations
alembic upgrade head

# 4. Start the development server
uvicorn backend.app.main:app --reload --port 8000

# 5. Verify — open API docs
#    → http://localhost:8000/api/docs  (Swagger UI)
#    → http://localhost:8000/api/redoc (ReDoc)

# 6. Run tests
pytest backend/features/ -v
```

### Celery Workers (optional — needed for background tasks)

```bash
# Start Celery worker
celery -A backend.app.core.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A backend.app.core.celery_app beat --loglevel=info
```

### Environment Variables

> [!NOTE]
> Copy `.env.example` to `.env` and fill in the required values before starting.

| Variable              | Example                                         | Required |
| --------------------- | ----------------------------------------------- | -------- |
| `DATABASE_URL`        | `postgresql+asyncpg://user:pass@localhost:5432/studyflow` | ✅       |
| `REDIS_URL`           | `redis://localhost:6379/0`                       | ✅       |
| `SECRET_KEY`          | `<random-256-bit-hex>`                           | ✅       |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520` (dev) / `15-30` (prod)           | ✅       |
| `OPENAI_API_KEY`      | `sk-proj-...`                                    | For B4   |
| `ANTHROPIC_API_KEY`   | `sk-ant-...`                                     | For B4   |
| `CHROMA_PERSIST_DIR`  | `./chroma_data`                                  | For chat |

---

## 8. Tài liệu liên quan

| Document                   | Path                                                             | Purpose                           |
| -------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| Team Boundaries            | `TEAM_BOUNDARIES.md` (repo root)                                 | Who owns what                     |
| API Contracts              | `backend/docs/API_CONTRACTS.md`                                  | Existing endpoint specifications  |
| Testing Guide              | `backend/docs/TESTING_GUIDE.md`                                  | Test patterns, fixtures, commands |
| Context Manifest           | `.ai/CONTEXT_MANIFEST.md`                                        | Context routing & tech stack      |

---

> **Chúc bạn code vui vẻ!** 🚀
> Nếu có thắc mắc về architecture hoặc API contracts, hãy hỏi Antigravity.
