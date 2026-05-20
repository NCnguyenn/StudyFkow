"""
Celery application factory and Beat schedule.

Configuration rules (from ai_pipeline.md §3.1 and backend.md §5):
  - acks_late=True on ALL tasks for worker crash safety.
  - reject_on_worker_lost=True so broker re-queues if worker is OOM-killed.
  - Redis used as both broker and result backend (from .env REDIS_URL).

Beat schedule:
  - detect-orphan-sessions: Every 5 minutes — finds stale sessions and
    transitions them to INTERRUPTED.
  - reconcile-user-stats:   Every 1 hour — recomputes user_stats from
    the canonical sessions table.
"""

import os

from celery import Celery
from celery.schedules import crontab

# ---------------------------------------------------------------------------
# Broker / Backend URL
# ---------------------------------------------------------------------------

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ---------------------------------------------------------------------------
# Celery Application
# ---------------------------------------------------------------------------

celery_app = Celery(
    "studyflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    # --- Worker safety ---
    task_acks_late=True,                   # ai_pipeline.md §3.2
    task_reject_on_worker_lost=True,       # ai_pipeline.md §8.3
    worker_prefetch_multiplier=1,          # ensures fair scheduling with acks_late

    # --- Serialisation ---
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # --- Timezone ---
    timezone="UTC",
    enable_utc=True,

    # --- Task discovery ---
    # Celery auto-discovers tasks in modules registered here.
    include=[
        "backend.features.study_sessions.worker",
    ],
)

# ---------------------------------------------------------------------------
# Celery Beat Periodic Schedule
# ---------------------------------------------------------------------------

celery_app.conf.beat_schedule = {
    "detect-orphan-sessions": {
        "task": "study_sessions.detect_orphan_sessions",
        "schedule": 300.0,  # every 5 minutes (300 seconds)
        "options": {"queue": "maintenance"},
    },
    "reconcile-user-stats": {
        "task": "study_sessions.reconcile_user_stats",
        "schedule": crontab(minute=0),  # every hour on the hour
        "options": {"queue": "maintenance"},
    },
}
