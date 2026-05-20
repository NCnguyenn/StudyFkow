"""
study_sessions — Background Worker Tasks (Celery)

Tasks:
  1. detect_orphan_sessions (every 5 minutes):
     Finds sessions that have gone stale and transitions them to INTERRUPTED.
     Criteria from session_state_machine.md §4 (Auto-Pause):
       - ACTIVE with last_seen_at > 90 seconds ago (missed heartbeats)
       - PAUSED with last_seen_at > 30 minutes ago (abandoned pause)

  2. reconcile_user_stats (every 1 hour):
     Re-aggregates session data from the canonical `sessions` table
     and heals any drift in the `user_stats` table.

ASYNC-TO-SYNC CONSTRAINT:
  Celery workers are synchronous by default. Our Repository and database
  layers are async (asyncpg + AsyncSession). Each task uses `asyncio.run()`
  to bridge the gap safely — this creates a fresh event loop per task
  invocation, which is the correct pattern for Celery workers.

IDEMPOTENCY:
  Both tasks are idempotent. Running them multiple times with the same
  database state produces the same outcome. No side-effects on re-execution.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.celery_app import celery_app
from backend.app.core.database import _async_session_factory
from .infrastructure.orm import SessionModel, SessionPauseModel

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thresholds (from session_state_machine.md)
# ---------------------------------------------------------------------------

# ACTIVE sessions with no heartbeat for > 90 seconds → stale
ACTIVE_STALE_THRESHOLD = timedelta(seconds=90)

# PAUSED sessions abandoned for > 30 minutes → stale
PAUSED_STALE_THRESHOLD = timedelta(minutes=30)


# ---------------------------------------------------------------------------
# Task 1: Orphan Detection
# ---------------------------------------------------------------------------

@celery_app.task(
    name="study_sessions.detect_orphan_sessions",
    bind=True,
    acks_late=True,
    reject_on_worker_lost=True,
    max_retries=2,
    default_retry_delay=30,
    time_limit=120,
    soft_time_limit=90,
)
def detect_orphan_sessions(self) -> None:  # type: ignore[override]
    """
    Periodic task: find stale sessions and transition them to INTERRUPTED.

    For each orphaned session:
      1. Close any open pause record (calculate its duration up to last_seen_at).
      2. Calculate actual_duration_seconds = (last_seen_at - created_at) - total_paused.
      3. Set status = INTERRUPTED, duration_seconds = actual_duration.

    This uses last_seen_at (not now()) for the duration cutoff because
    it represents the last reliable moment the client was active.
    """
    asyncio.run(_detect_orphan_sessions_async())


async def _detect_orphan_sessions_async() -> None:
    """Async implementation of orphan detection."""
    now = datetime.now(timezone.utc)
    active_cutoff = now - ACTIVE_STALE_THRESHOLD
    paused_cutoff = now - PAUSED_STALE_THRESHOLD

    async with _async_session_factory() as db:
        async with db.begin():
            # Find all orphan candidates in a single query
            result = await db.execute(
                select(SessionModel)
                .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
                .where(
                    # ACTIVE and stale
                    (
                        (SessionModel.status == "ACTIVE")
                        & (SessionModel.last_seen_at < active_cutoff)
                    )
                    |
                    # PAUSED and abandoned
                    (
                        (SessionModel.status == "PAUSED")
                        & (SessionModel.last_seen_at < paused_cutoff)
                    )
                )
            )
            orphans = result.scalars().all()

            if not orphans:
                logger.info(
                    "orphan_detection_complete",
                    extra={"orphan_count": 0},
                )
                return

            interrupted_count = 0
            for session in orphans:
                try:
                    await _interrupt_session(session, db)
                    interrupted_count += 1
                except Exception:
                    logger.exception(
                        "orphan_interruption_failed",
                        extra={"session_id": str(session.id)},
                    )

            logger.info(
                "orphan_detection_complete",
                extra={
                    "orphan_count": len(orphans),
                    "interrupted_count": interrupted_count,
                },
            )


async def _interrupt_session(session: SessionModel, db: AsyncSession) -> None:
    """
    Transition a single orphaned session to INTERRUPTED.

    Steps:
      1. Close any open pause record (duration calculated up to last_seen_at).
      2. Sum all pause durations.
      3. actual_duration = (last_seen_at - created_at) - total_paused_seconds.
      4. UPDATE session → INTERRUPTED with calculated duration.
    """
    # Ensure timezone-aware timestamps for arithmetic
    last_seen = _ensure_aware(session.last_seen_at)
    created_at = _ensure_aware(session.created_at)

    # Step 1: Close any open pause
    open_pause_result = await db.execute(
        select(SessionPauseModel)
        .where(SessionPauseModel.session_id == session.id)
        .where(SessionPauseModel.pause_duration_seconds == 0)
        .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
        .limit(1)
    )
    open_pause = open_pause_result.scalars().first()

    if open_pause is not None:
        pause_created = _ensure_aware(open_pause.created_at)
        # Duration up to last_seen_at (not now), because the client
        # was last confirmed alive at that point.
        pause_duration = max(0, int((last_seen - pause_created).total_seconds()))
        await db.execute(
            update(SessionPauseModel)
            .where(SessionPauseModel.id == open_pause.id)
            .values(pause_duration_seconds=pause_duration)
        )

    # Step 2: Sum all resolved pause durations (including the one just closed)
    await db.flush()
    total_paused_result = await db.execute(
        select(func.coalesce(func.sum(SessionPauseModel.pause_duration_seconds), 0))
        .where(SessionPauseModel.session_id == session.id)
        .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
    )
    total_paused_seconds: int = total_paused_result.scalar() or 0

    # Step 3: Calculate actual duration
    wall_clock = int((last_seen - created_at).total_seconds())
    actual_duration = max(0, wall_clock - total_paused_seconds)

    # Step 4: Mark INTERRUPTED
    await db.execute(
        update(SessionModel)
        .where(SessionModel.id == session.id)
        .values(
            status="INTERRUPTED",
            duration_seconds=actual_duration,
        )
    )

    logger.info(
        "session_interrupted",
        extra={
            "session_id": str(session.id),
            "user_id": str(session.user_id),
            "previous_status": session.status,
            "actual_duration_seconds": actual_duration,
            "total_paused_seconds": total_paused_seconds,
        },
    )


# ---------------------------------------------------------------------------
# Task 2: User Stats Reconciliation
# ---------------------------------------------------------------------------

@celery_app.task(
    name="study_sessions.reconcile_user_stats",
    bind=True,
    acks_late=True,
    reject_on_worker_lost=True,
    max_retries=2,
    default_retry_delay=60,
    time_limit=300,
    soft_time_limit=240,
)
def reconcile_user_stats(self) -> None:  # type: ignore[override]
    """
    Periodic task: re-aggregate session data into user_stats.

    Heals any drift between the canonical `sessions` table and the
    derived `user_stats` table by recomputing totals from scratch.

    This is a full reconciliation — it aggregates ALL non-deleted sessions
    for each user who has at least one session, then UPSERTs the totals
    into user_stats.
    """
    asyncio.run(_reconcile_user_stats_async())


async def _reconcile_user_stats_async() -> None:
    """Async implementation of user stats reconciliation."""
    async with _async_session_factory() as db:
        async with db.begin():
            # Aggregate session metrics per user directly in SQL
            # This is more efficient than loading all sessions into Python.
            #
            # user_stats.total_study_time = SUM(duration_seconds) for
            # COMPLETED and INTERRUPTED sessions (these have accurate durations).
            reconcile_sql = text("""
                WITH locked_stats AS (
                    SELECT user_id
                    FROM user_stats
                    WHERE deleted_at IS NULL
                    FOR UPDATE
                )
                UPDATE user_stats
                SET total_study_time = agg.total_duration
                FROM (
                    SELECT
                        s.user_id,
                        COALESCE(SUM(s.duration_seconds), 0) AS total_duration
                    FROM sessions s
                    JOIN locked_stats ls ON s.user_id = ls.user_id
                    WHERE s.deleted_at IS NULL
                      AND s.status IN ('COMPLETED', 'INTERRUPTED')
                    GROUP BY s.user_id
                ) AS agg
                WHERE user_stats.user_id = agg.user_id
            """)

            result = await db.execute(reconcile_sql)
            rows_updated = result.rowcount  # type: ignore[union-attr]

            logger.info(
                "user_stats_reconciliation_complete",
                extra={"rows_updated": rows_updated},
            )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC). Safe for naive DB values."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
