# ⚙️ AI StudyFlow — Backend Engineering Rules

> **Canonical Authority:** This document defines the strict engineering standards for the FastAPI backend. AI agents must comply with these rules for all backend code generation.

## 1. FASTAPI ARCHITECTURE STANDARDS
- **Async-First:** All endpoints, database queries, and external calls MUST use `async`/`await`. Never block the event loop.
- **Router Isolation:** Endpoints MUST NOT contain business logic. Routers only handle HTTP parsing, dependency injection, and returning standardized responses.
- **Pydantic Validation:** All incoming payloads and outgoing responses MUST be strictly validated using Pydantic V2 models.

## 2. DEPENDENCY INJECTION & LAYERS
- **Strict Layering:** `Router` -> `Service` -> `Repository`.
- **Service Layer:** Contains 100% of business logic. Receives Repositories via dependency injection.
- **Repository Layer:** Contains 100% of database access logic (SQLAlchemy). 
- **Dependency Injection:** Use FastAPI's `Depends()` to inject services into routers. Never instantiate services directly inside routers.

## 3. DATABASE ACCESS RULES
- **No ORM in Routes:** SQLAlchemy models MUST NOT leak into the router layer. The Service layer must map ORM models to pure Pydantic domain models before returning.
- **Session Management:** Database sessions (`AsyncSession`) are injected via `Depends(get_db)`. Transactions are managed at the Service layer using `async with db.begin():`.

## 4. GLOBAL ERROR HANDLING
- **Domain Exceptions:** The Service layer raises custom Domain Exceptions (e.g., `UserNotFoundError`, `QuotaExceededError`).
- **Exception Handlers:** FastAPI global exception handlers catch Domain Exceptions and map them to standard HTTP status codes (e.g., 404, 422).
- **Standard API Envelope:** All responses must match the envelope defined in `api_contracts.md` (`success`, `data`, `meta`).

## 5. BACKGROUND TASKS STRATEGY
- **Celery for Heavy Lifting:** Any task taking >500ms (LLM generation, email sending, heavy analytics) MUST be offloaded to Celery.
- **FastAPI BackgroundTasks:** Only use `BackgroundTasks` for trivial, short-lived operations (e.g., firing a metric event).
- **Idempotency:** All Celery tasks MUST be idempotent.

## 6. SECURITY RULES
- **JWT Auth:** All protected routes require a valid JWT, extracted via a reusable `get_current_user` dependency.
- **Password Hashing:** Use Argon2id or bcrypt (via `passlib`) for all password hashing. Never log or return passwords.
- **Input Sanitization:** Trust no client. Rely on strict Pydantic constraints (`constr`, `conint`) to validate input lengths and formats.

## 7. PROJECT STRUCTURE CONVENTIONS
```text
backend/
├── main.py
├── core/           # Config, security, exceptions
├── api/            # Global dependencies
└── features/       # Vertical slices (user_auth, study_sessions, etc.)
    └── [feature_name]/
        ├── api/          # router.py
        ├── application/  # service.py
        ├── domain/       # models.py, interfaces.py
        └── infrastructure/ # repository.py
```
