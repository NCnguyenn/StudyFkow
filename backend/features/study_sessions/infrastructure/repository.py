"""
study_sessions — Repository Layer

All database access for the `sessions` and `session_pauses` tables. Each method:
  1. Filters `deleted_at IS NULL` by default (database.md §4.2).
  2. Includes `user_id` in every WHERE clause for sessions (database.md §8.1 — IDOR prevention).
  3. Does NOT manage transactions (database.md §7.1 — that's the Service's job).
"""

from uuid import UUID
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from .orm import SessionModel, SessionPauseModel


class StudySessionRepository:
    """Async repository for the `sessions` table."""

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    @staticmethod
    async def get_by_id(
        session_id: UUID,
        user_id: UUID,
        db: AsyncSession,
    ) -> Optional[SessionModel]:
        """
        Fetch a single session by PK, scoped to the authenticated user.
        Soft-deleted records are excluded.
        """
        result = await db.execute(
            select(SessionModel)
            .where(SessionModel.id == session_id)
            .where(SessionModel.user_id == user_id)
            .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_client_session_id(
        client_session_id: UUID,
        user_id: UUID,
        db: AsyncSession,
    ) -> Optional[SessionModel]:
        """
        Idempotency lookup: find an existing session by its client-generated
        UUID. Returns None if not found or soft-deleted.

        NOTE: The `sessions` table currently does not have a dedicated
        `client_session_id` column. We use `id` as the client_session_id
        because the server adopts the client's UUID as the PK (offline-first).
        """
        return await StudySessionRepository.get_by_id(
            session_id=client_session_id,
            user_id=user_id,
            db=db,
        )

    @staticmethod
    async def find_active_or_paused(
        user_id: UUID,
        db: AsyncSession,
    ) -> Optional[SessionModel]:
        """
        Check if the user has any session in ACTIVE or PAUSED state.
        Used by the state machine guard to enforce the one-live-session rule.

        Uses the partial index `idx_sessions_user_status` for performance.
        """
        result = await db.execute(
            select(SessionModel)
            .where(SessionModel.user_id == user_id)
            .where(SessionModel.status.in_(["ACTIVE", "PAUSED", "PENDING"]))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .limit(1)
        )
        return result.scalars().first()

    # ------------------------------------------------------------------
    # Writes — Session
    # ------------------------------------------------------------------

    @staticmethod
    async def create(
        session_model: SessionModel,
        db: AsyncSession,
    ) -> SessionModel:
        """
        Insert a new session row. Caller is responsible for transaction scope.
        """
        db.add(session_model)
        await db.flush()     # push to DB within the caller's transaction
        await db.refresh(session_model)  # reload server-default columns
        return session_model

    @staticmethod
    async def update_last_seen(
        session_id: UUID,
        user_id: UUID,
        now: datetime,
        db: AsyncSession,
        duration_delta: int = 0,
    ) -> int:
        """
        Heartbeat update — set `last_seen_at` to the current UTC time.
        Returns the number of rows affected (0 = not found / soft-deleted).

        `updated_at` is handled automatically by the DB trigger.
        """
        result = await db.execute(
            update(SessionModel)
            .where(SessionModel.id == session_id)
            .where(SessionModel.user_id == user_id)
            .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .values(
                last_seen_at=now,
                duration_seconds=SessionModel.duration_seconds + duration_delta,
            )
        )
        return result.rowcount  # type: ignore[return-value]

    @staticmethod
    async def update_status_and_last_seen(
        session_id: UUID,
        user_id: UUID,
        new_status: str,
        now: datetime,
        db: AsyncSession,
        duration_delta: int = 0,
    ) -> int:
        """
        Transition session status and update `last_seen_at` atomically.
        Returns the number of rows affected.
        """
        result = await db.execute(
            update(SessionModel)
            .where(SessionModel.id == session_id)
            .where(SessionModel.user_id == user_id)
            .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .values(
                status=new_status,
                last_seen_at=now,
                duration_seconds=SessionModel.duration_seconds + duration_delta,
            )
        )
        return result.rowcount  # type: ignore[return-value]

    @staticmethod
    async def end_session(
        session_id: UUID,
        user_id: UUID,
        now: datetime,
        actual_duration_seconds: int,
        db: AsyncSession,
    ) -> int:
        """
        Mark a session as COMPLETED with the server-calculated duration.

        Sets:
          - status = COMPLETED
          - duration_seconds = actual_duration_seconds (server-calculated)
          - last_seen_at = now

        Returns the number of rows affected.
        """
        result = await db.execute(
            update(SessionModel)
            .where(SessionModel.id == session_id)
            .where(SessionModel.user_id == user_id)
            .where(SessionModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .values(
                status="COMPLETED",
                duration_seconds=actual_duration_seconds,
                last_seen_at=now,
            )
        )
        return result.rowcount  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Writes — Session Pauses
    # ------------------------------------------------------------------

    @staticmethod
    async def record_pause(
        session_id: UUID,
        db: AsyncSession,
    ) -> SessionPauseModel:
        """
        Insert a new pause record for the given session.

        The `created_at` server default acts as the `paused_at` timestamp.
        `pause_duration_seconds` remains 0 until resume fills it.
        """
        pause = SessionPauseModel(session_id=session_id)
        db.add(pause)
        await db.flush()
        await db.refresh(pause)
        return pause

    @staticmethod
    async def get_open_pause(
        session_id: UUID,
        db: AsyncSession,
    ) -> Optional[SessionPauseModel]:
        """
        Find the currently open (unresolved) pause for a session.

        An open pause is identified by `pause_duration_seconds == 0`
        (not yet resumed). There should be at most one open pause per session
        at any time.
        """
        result = await db.execute(
            select(SessionPauseModel)
            .where(SessionPauseModel.session_id == session_id)
            .where(SessionPauseModel.pause_duration_seconds == 0)
            .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .order_by(SessionPauseModel.created_at.desc())  # pyright: ignore[reportAttributeAccessIssue]
            .limit(1)
        )
        return result.scalars().first()

    @staticmethod
    async def record_resume(
        pause_id: UUID,
        duration_seconds: int,
        db: AsyncSession,
    ) -> int:
        """
        Close an open pause record by filling in its duration.

        The `updated_at` column is auto-set by the DB trigger and
        effectively acts as the `resumed_at` timestamp.

        Returns the number of rows affected.
        """
        result = await db.execute(
            update(SessionPauseModel)
            .where(SessionPauseModel.id == pause_id)
            .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
            .values(pause_duration_seconds=duration_seconds)
        )
        return result.rowcount  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Reads — Pause Aggregates
    # ------------------------------------------------------------------

    @staticmethod
    async def get_pause_count(
        session_id: UUID,
        db: AsyncSession,
    ) -> int:
        """Count total pause records for a session (including open ones)."""
        result = await db.execute(
            select(func.count())
            .select_from(SessionPauseModel)
            .where(SessionPauseModel.session_id == session_id)
            .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
        )
        return result.scalar() or 0

    @staticmethod
    async def get_total_paused_seconds(
        session_id: UUID,
        db: AsyncSession,
    ) -> int:
        """
        Sum of all resolved pause durations for a session.

        NOTE: This does NOT include the duration of a currently-open pause.
        The caller must account for that separately if needed.
        """
        result = await db.execute(
            select(func.coalesce(func.sum(SessionPauseModel.pause_duration_seconds), 0))
            .where(SessionPauseModel.session_id == session_id)
            .where(SessionPauseModel.deleted_at.is_(None))  # pyright: ignore[reportArgumentType, reportAttributeAccessIssue]
        )
        return result.scalar() or 0
