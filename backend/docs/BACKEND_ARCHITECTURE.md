# Backend Architecture — AI StudyFlow

> **Cập nhật:** 2026-06-27
> **Phiên bản:** 1.0
> **Sở hữu:** Jules (Backend Lead)

---

## 1. Tổng quan kiến trúc (Architecture Overview)

AI StudyFlow backend là một **monolith FastAPI** application sử dụng kiến trúc **Vertical Slice** — mỗi feature là một module độc lập với 4 layers riêng biệt.

```
┌─────────────────────────────────────────────────────┐
│                    FastAPI App                        │
│                  (backend/app/main.py)               │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────┤
│ Auth │ Sess │ Task │ Note │ Chat │ Anal │ RT   │ AI │
│      │ ions │ Mgmt │  s   │      │ytic  │      │Pipe│
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴────┤
│              Core (DB, Auth, Celery)                 │
├─────────────────────────────────────────────────────┤
│  PostgreSQL 15  │  Redis 7  │  ChromaDB  │  Celery  │
└─────────────────┴───────────┴────────────┴──────────┘
```

**Đặc điểm chính:**
- **Async-first:** SQLAlchemy 2.0 async + asyncpg
- **Background processing:** Celery + Redis (beat scheduler + on-demand tasks)
- **AI/ML:** ChromaDB vector store + LLM provider pattern (Gemini/Ollama)
- **Realtime:** Server-Sent Events qua Redis Pub/Sub

---

## 2. Cấu trúc thư mục (Directory Structure)

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   └── core/
│       ├── __init__.py         # Re-exports session factories
│       ├── base.py             # SQLAlchemy DeclarativeBase
│       ├── database.py         # Async engine, get_write_session(), get_read_session()
│       └── celery_app.py       # Celery config, beat schedule, task discovery
│
├── features/                    # ⭐ Active feature modules (vertical slices)
│   ├── user_auth/              # 8 endpoints — JWT auth, preferences, GDPR
│   ├── study_sessions/         # 5 endpoints + 2 Celery tasks — session lifecycle
│   ├── task_management/        # 11 endpoints — subjects + tasks CRUD + state machine
│   ├── analytics/              # 4 endpoints — dashboard stats + insights
│   ├── notes/                  # 8 endpoints — workspace, folders, notes CRUD
│   ├── realtime/               # 1 endpoint — SSE stream via Redis Pub/Sub
│   ├── chat/                   # 1 endpoint — RAG pipeline (LLM currently mocked)
│   └── ai_pipeline/            # 0 endpoints — Celery workers only (LLM, voice, embeddings)
│
├── alembic.ini                 # Alembic configuration file
├── alembic/                    # Database migrations (20 files)
│   ├── env.py                  # Imports all ORM models for autogenerate
│   └── versions/               # Migration scripts
│
├── tests/                      # Top-level test dir (minimal — 2 files only)
├── docs/                       # This directory
├── init_db.py                  # Utility: create all tables
├── requirements.txt            # Python dependencies
└── __init__.py                 # Package marker
```

> [!WARNING]
> `backend/app/features/` chứa 8 thư mục **trống** (stubs cũ). Code thực sự nằm ở `backend/features/` (không có `app/`).

---

## 3. Vertical Slice Pattern

Mỗi feature module tuân theo cấu trúc 4 layers:

```
features/{module_name}/
├── __init__.py          # Exports router
├── api/
│   ├── router.py        # FastAPI Router + endpoint definitions
│   └── dependencies.py  # Auth dependencies, request parsing
├── application/
│   └── service.py       # Business logic, orchestration
├── domain/
│   ├── models.py        # Pydantic models (request/response)
│   ├── exceptions.py    # Domain-specific exceptions
│   └── interfaces.py    # ABCs (Abstract Base Classes)
└── infrastructure/
    ├── orm.py           # SQLAlchemy ORM models
    └── repository.py    # Database access (CRUD operations)
```

### Data Flow

```
Client Request
    ↓
Router (api/router.py)
    ↓ validates request via Pydantic schema
Service (application/service.py)
    ↓ business logic, validation, orchestration
Repository (infrastructure/repository.py)
    ↓ SQLAlchemy queries
Database (PostgreSQL)
    ↓
Response (Pydantic schema → JSON)
```

### Dependency Rule
> Layers chỉ được import **xuống dưới**, không được import ngược lên:
> - `api/` → imports `application/`, `domain/`
> - `application/` → imports `domain/`, `infrastructure/`
> - `domain/` → imports nothing (pure Python)
> - `infrastructure/` → imports `domain/`

---

## 4. Database Layer

### Engine Configuration

| Setting | Value |
|---------|-------|
| **Driver** | `postgresql+asyncpg` |
| **Connection** | `postgresql://postgres:postgres@127.0.0.1:5432/studyflow` |
| **Pool size** | 10 |
| **Max overflow** | 5 |
| **Pool pre-ping** | `True` |
| **Echo (dev)** | `True` |

### Session Factories

```python
# FastAPI dependency injection
async def get_write_session() -> AsyncGenerator[AsyncSession, None]:
    async with _async_session_factory() as session:
        yield session

async def get_read_session() -> AsyncGenerator[AsyncSession, None]:
    # Currently same engine — designed for read-replica separation later
    async with _async_session_factory() as session:
        yield session
```

### DeclarativeBase

```python
# backend/app/core/base.py
class Base(DeclarativeBase):
    __table_args__ = {"extend_existing": True}
```

### PgBouncer

- Port: `6432` (production connection pooling)
- Mode: Transaction pooling
- Max clients: 1000
- Pool size: 20

---

## 5. Authentication System

| Component | Technology | Details |
|-----------|-----------|---------|
| **Password hashing** | Argon2id (passlib) | Industry-leading, memory-hard |
| **JWT signing** | HS256 (python-jose) | `SECRET_KEY` from env |
| **Access token** | Bearer header | 11520 min (dev) / 15-30 min (prod) expiry |
| **Refresh token** | HTTP-only cookie | 7 day expiry, `SameSite=strict`, `Secure` |

### Auth Dependencies

```python
# Bearer token (most endpoints)
get_current_user = Depends(...)  # Reads Authorization header

# Query param (SSE/WebSocket — EventSource doesn't support headers)
get_current_user_ws = Depends(...)  # Reads ?token= query param
```

> [!NOTE]
> Cả 2 dependencies đều **fetch fresh user từ DB** trên mỗi request (không cache).

---

## 6. Background Processing

### Celery Configuration

| Setting | Value |
|---------|-------|
| **Broker** | Redis (`REDIS_URL` env var) |
| **Backend** | Redis (same) |
| **Serializer** | JSON |
| **acks_late** | `True` |
| **reject_on_worker_lost** | `True` |
| **Timezone** | UTC |

### Beat Schedule (Periodic Tasks)

| Task | Interval | Queue | Purpose |
|------|----------|-------|---------|
| `detect-orphan-sessions` | Every 5 min | `maintenance` | Find stale ACTIVE (>12h) or PAUSED (>30min) sessions → INTERRUPTED |
| `reconcile-user-stats` | Every hour | `maintenance` | SQL re-aggregation of user_stats from sessions table |

### On-Demand Tasks

| Task | Trigger | Purpose |
|------|---------|---------|
| `generate_llm_insight` | After session end (≥10 sessions) | Build context → call LLM → persist insight |
| `process_voice_memo` | Manual | Transcription → create Note → publish event |
| `embed_note_to_vector_db` | After note create/update | Chunk text → upsert into ChromaDB |

---

## 7. Realtime System

```
Frontend (EventSource)
    ↓ GET /api/v1/realtime/stream?token=JWT
FastAPI StreamingResponse (SSE)
    ↓ subscribes to
Redis Pub/Sub channel: "channel:user_events:{user_id}"
    ↑ published by
Celery Workers / Service Layer
```

| Setting | Value |
|---------|-------|
| **Protocol** | Server-Sent Events (SSE) |
| **Heartbeat** | Every 15 seconds |
| **Poll timeout** | 1 second (`asyncio.wait_for`) |
| **Auth** | JWT via query parameter |
| **Headers** | `no-cache`, `no-transform`, `keep-alive` |

**Cleanup:** On disconnect/error → unsubscribe → close pubsub → close Redis connection.

---

## 8. AI Pipeline

### LLM Provider Pattern

```
LLMProvider (ABC)
    ├── GeminiProvider   → Google Gemini 1.5 Flash (REST API via httpx)
    └── OllamaProvider   → Local Ollama (llama3 model, localhost:11434)

Factory: get_llm_provider(user) → returns provider based on user.llm_provider setting
```

### ChromaDB (Vector Store)

| Setting | Value |
|---------|-------|
| **Client** | `PersistentClient` (`./chroma_data` directory) |
| **Collection** | `studyflow_notes` |
| **Similarity** | Cosine |
| **Top-K** | 3 chunks |
| **Filter** | `user_id` metadata |

### RAG Pipeline

```
User query
    ↓
ChromaDB query (top 3 chunks, filtered by user_id)
    ↓
Build context-augmented prompt with source citations
    ↓
LLM call (Gemini or Ollama) ← ⚠️ Currently MOCKED
    ↓
Response with answer + sources
```

### Insight Generation

1. **Rule-based** (runs as `BackgroundTask` after session end):
   - Burnout Warning: session >120min with 0 pauses → suggest Pomodoro
   - Time Optimizer: >60% sessions between 05:00-11:59 (≥3 sessions) → suggest morning scheduling

2. **LLM-based** (triggered via endpoint, requires ≥10 sessions):
   - Builds analytics + session history context
   - Calls LLM provider for personalized insight
   - Stores with `insight_type = "LLM"`

---

## 9. Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://...@127.0.0.1:5432/studyflow` | No | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | No | Redis for Celery + Pub/Sub |
| `SECRET_KEY` | — | **YES** | JWT signing secret (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520` (dev) / `15-30` (prod) | **YES** | Access token expiry |
| `OPENAI_API_KEY` | — | No | OpenAI API key |
| `ANTHROPIC_API_KEY`| — | No | Anthropic API key |
| `CHROMA_PERSIST_DIR` | `./chroma_data` | No | ChromaDB persist directory |

### CORS Configuration

```python
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

---

## 10. Infrastructure (Docker Compose)

| Service | Image | Port | Key Config |
|---------|-------|------|------------|
| **db** | `postgres:15-alpine` | `5432:5432` | 256MB shared_buffers, 200 max connections, UTC |
| **pgbouncer** | `edoburu/pgbouncer` | `6432:5432` | Transaction pooling, 1000 max clients |
| **redis** | `redis:7-alpine` | `6379:6379` | AOF persistence, 256MB max, allkeys-lru |

**Volumes:** `postgres_data`, `redis_data` (persistent).

```bash
# Start all infrastructure
docker compose up -d

# Or specific services
docker compose up -d db redis
```

---

## 11. API Documentation

| Format | URL |
|--------|-----|
| Swagger UI | `http://localhost:8000/api/docs` |
| ReDoc | `http://localhost:8000/api/redoc` |
| OpenAPI JSON | `http://localhost:8000/api/openapi.json` |
| Health check | `http://localhost:8000/health` |
