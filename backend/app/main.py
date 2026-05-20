"""
AI StudyFlow — FastAPI Application Entrypoint

Router registration follows the vertical slice pattern from .ai/rules/backend.md:
  - Each feature exposes only its `router` via its `__init__.py` public contract.
  - All routes are mounted under /api/v1 as per api_contracts.md §1.1.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.features.user_auth import router as auth_router
from backend.features.study_sessions import router as sessions_router
from backend.features.task_management import router as tasks_router
from backend.features.analytics import router as analytics_router
from backend.features.notes import router as notes_router
from backend.features.realtime import router as realtime_router
from backend.features.chat import router as chat_router

app = FastAPI(
    title="AI StudyFlow API",
    version="1.0.0",
    description="Behavior-driven learning management system API.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Route registration — /api/v1 prefix (api_contracts.md §1.1)
# ---------------------------------------------------------------------------

app.include_router(auth_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(notes_router, prefix="/api/v1")
app.include_router(realtime_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Liveness probe — no auth required."""
    return {"status": "ok"}
