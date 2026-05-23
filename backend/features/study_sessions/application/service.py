"""
study_sessions — Application Service Layer

Business rules enforced here:
  1. Idempotency: If client_session_id already exists → return existing row (no duplicate).
  2. State machine constraint: If user has ACTIVE or PAUSED session → raise ActiveSessionExistsError.
  3. Heartbeat processing: Updates last_seen_at; transitions from non-terminal states only.
  4. Pause: ACTIVE → PAUSED. Inserts a pause record into session_pauses.
  5. Resume: PAUSED → ACTIVE. Closes the open pause record with calculated duration.
  6. End: ACTIVE/PAUSED → COMPLETED. Calculates actual_duration_seconds on server.

Transaction management:
  All write operations use `async with db.begin():` per database.md §7.1.
  The Repository layer does NOT start transactions — it operates within ours.

Duration Calculation (CRITICAL):
  actual_duration_seconds = (end_time - created_at_in_seconds) - total_paused_seconds
  - Never trust client-sent durations.
  - All timestamps are UTC timezone-aware.
  - Open pauses at end time are auto-closed with their pro-rated duration.
"""

from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ..domain.models import (
    SessionStatus,
    SessionStartRequest,
    SessionHeartbeatResponse,
    PauseResponse,
    ResumeResponse,
    EndResponse,
)
from ..domain.exceptions import (
    ActiveSessionExistsError,
    SessionNotActiveError,
    SessionNotFoundError,
    SessionNotPausedError,
    SessionAlreadyEndedError,
)
from ..infrastructure.orm import SessionModel
from ..infrastructure.repository import StudySessionRepository
from backend.features.task_management.infrastructure.orm import TaskModel

# Terminal states that reject heartbeats
_TERMINAL_STATES = {"COMPLETED", "INTERRUPTED", "ERROR"}


# ---------------------------------------------------------------------------
# Session Start
# ---------------------------------------------------------------------------

async def start_session(
    user_id: UUID,
    request: SessionStartRequest,
    db: AsyncSession,
) -> tuple[SessionModel, bool]:
    """
    Start a new study session.

    Returns:
        (SessionModel, is_new_creation)
        - is_new_creation=True  → caller should return HTTP 201
        - is_new_creation=False → idempotent repeat; caller returns HTTP 200

    Raises:
        ActiveSessionExistsError: If the user already has a session in
                                  ACTIVE or PAUSED state (→ HTTP 400).
    """
    repo = StudySessionRepository

    # --- Guard 1: Idempotency check ---
    existing = await repo.get_by_client_session_id(
        client_session_id=request.client_session_id,
        user_id=user_id,
        db=db,
    )
    if existing is not None:
        return existing, False

    # --- Guard 2: State machine constraint ---
    live_session = await repo.find_active_or_paused(user_id=user_id, db=db)
    if live_session is not None:
        raise ActiveSessionExistsError(str(live_session.id))

    # --- Guard 3: Task Validation (IDOR prevention) ---
    if request.task_id is not None:
        stmt = select(TaskModel).where(
            TaskModel.id == request.task_id,
            TaskModel.user_id == user_id,
            TaskModel.is_deleted == False
        )
        task_result = await db.execute(stmt)
        task = task_result.scalars().first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or does not belong to the user."
            )

    now = datetime.now(timezone.utc)
    new_row = SessionModel(
        id=request.client_session_id,  # server adopts client UUID (offline-first)
        user_id=user_id,
        task_id=request.task_id,
        title=request.title,
        notes=request.notes,
        topic_ids=request.topic_ids,
        status=SessionStatus.PENDING.value,
        duration_seconds=0,
        last_seen_at=now,
    )

    created = await repo.create(new_row, db)
    await db.commit()

    return created, True


# ---------------------------------------------------------------------------
# Heartbeat
# ---------------------------------------------------------------------------

async def process_heartbeat(
    session_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> SessionHeartbeatResponse:
    """
    Process a heartbeat ping for an active study session.

    State transitions on heartbeat:
      - PENDING → transitions to ACTIVE, update last_seen_at
      - ACTIVE  → stays ACTIVE,  update last_seen_at
      - PAUSED  → stays PAUSED,  update last_seen_at
      - COMPLETED / INTERRUPTED / ERROR → raise SessionNotActiveError (→ 409)

    Raises:
        SessionNotFoundError:  If session doesn't exist or is soft-deleted.
        SessionNotActiveError: If session is in a terminal state.
    """
    repo = StudySessionRepository
    now = datetime.now(timezone.utc)

    # Lookup with IDOR-safe user_id scope
    session = await repo.get_by_id(
        session_id=session_id,
        user_id=user_id,
        db=db,
    )

    if session is None:
        raise SessionNotFoundError(str(session_id))

    # Terminal state guard
    if session.status in _TERMINAL_STATES:
        raise SessionNotActiveError(str(session_id), session.status)

    delta = 0
    if session.status == SessionStatus.ACTIVE.value:
        last_seen = session.last_seen_at.replace(tzinfo=timezone.utc) \
            if session.last_seen_at.tzinfo is None else session.last_seen_at
        delta = max(0, round((now - last_seen).total_seconds()))

    # Persist heartbeat timestamp
    if session.status == SessionStatus.PENDING.value:
        await repo.update_status_and_last_seen(
            session_id=session_id,
            user_id=user_id,
            new_status=SessionStatus.ACTIVE.value,
            now=now,
            duration_delta=0,
            db=db,
        )
        session.status = SessionStatus.ACTIVE.value
    else:
        await repo.update_last_seen(
            session_id=session_id,
            user_id=user_id,
            now=now,
            duration_delta=delta,
            db=db,
        )
    await db.commit()

    return SessionHeartbeatResponse(
        session_id=session_id,
        status=SessionStatus(session.status),
        server_time=now,
    )


# ---------------------------------------------------------------------------
# Pause Session
# ---------------------------------------------------------------------------

async def pause_session(
    session_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> PauseResponse:
    """
    Transition a session from ACTIVE → PAUSED.

    Business rules:
      - Only ACTIVE sessions can be paused.
      - COMPLETED sessions raise SessionAlreadyEndedError (→ 409).
      - PAUSED sessions raise SessionNotActiveError (→ 409).
      - Inserts a new pause record into session_pauses.
      - Updates session status to PAUSED and last_seen_at.

    Raises:
        SessionNotFoundError:    Session doesn't exist or is soft-deleted.
        SessionAlreadyEndedError: Session is COMPLETED (immutable).
        SessionNotActiveError:   Session is not in ACTIVE state.
    """
    repo = StudySessionRepository
    now = datetime.now(timezone.utc)

    # Lookup with IDOR-safe user_id scope
    session = await repo.get_by_id(
        session_id=session_id,
        user_id=user_id,
        db=db,
    )

    if session is None:
        raise SessionNotFoundError(str(session_id))

    # Guard: already completed
    if session.status == SessionStatus.COMPLETED.value:
        raise SessionAlreadyEndedError(str(session_id))

    # Guard: must be ACTIVE to pause
    if session.status != SessionStatus.ACTIVE.value:
        raise SessionNotActiveError(str(session_id), session.status)

    last_seen = session.last_seen_at.replace(tzinfo=timezone.utc) \
        if session.last_seen_at.tzinfo is None else session.last_seen_at
    delta = max(0, round((now - last_seen).total_seconds()))

    # 1. Insert pause record (created_at = paused_at)
    await repo.record_pause(session_id=session_id, db=db)

    # 2. Transition session to PAUSED
    await repo.update_status_and_last_seen(
        session_id=session_id,
        user_id=user_id,
        new_status=SessionStatus.PAUSED.value,
        now=now,
        duration_delta=delta,
        db=db,
    )
    await db.commit()

    # Fetch pause count for response
    pause_count = await repo.get_pause_count(session_id=session_id, db=db)

    return PauseResponse(
        session_id=session_id,
        status=SessionStatus.PAUSED,
        paused_at=now,
        pause_count=pause_count,
    )


# ---------------------------------------------------------------------------
# Resume Session
# ---------------------------------------------------------------------------

async def resume_session(
    session_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> ResumeResponse:
    """
    Transition a session from PAUSED → ACTIVE.

    Business rules:
      - Only PAUSED sessions can be resumed.
      - COMPLETED sessions raise SessionAlreadyEndedError (→ 409).
      - ACTIVE sessions raise SessionNotPausedError (→ 409).
      - Calculates the duration of the pause that just ended.
      - Closes the open pause record in session_pauses.
      - Updates session status to ACTIVE and last_seen_at.

    Duration of the ending pause:
      pause_duration = (now - pause.created_at).total_seconds()

    Raises:
        SessionNotFoundError:    Session doesn't exist or is soft-deleted.
        SessionAlreadyEndedError: Session is COMPLETED (immutable).
        SessionNotPausedError:   Session is not in PAUSED state.
    """
    repo = StudySessionRepository
    now = datetime.now(timezone.utc)

    # Lookup with IDOR-safe user_id scope
    session = await repo.get_by_id(
        session_id=session_id,
        user_id=user_id,
        db=db,
    )

    if session is None:
        raise SessionNotFoundError(str(session_id))

    # Guard: already completed
    if session.status == SessionStatus.COMPLETED.value:
        raise SessionAlreadyEndedError(str(session_id))

    # Guard: must be PAUSED to resume
    if session.status != SessionStatus.PAUSED.value:
        raise SessionNotPausedError(str(session_id), session.status)

    # Find the open pause record
    open_pause = await repo.get_open_pause(session_id=session_id, db=db)

    # Calculate this pause's duration (server-side, UTC)
    this_pause_seconds = 0
    if open_pause is not None:
        delta = now - open_pause.created_at.replace(tzinfo=timezone.utc) \
            if open_pause.created_at.tzinfo is None else now - open_pause.created_at
        this_pause_seconds = max(0, round(delta.total_seconds()))

    # 1. Close the open pause record with calculated duration
    if open_pause is not None:
        await repo.record_resume(
            pause_id=open_pause.id,
            duration_seconds=this_pause_seconds,
            db=db,
        )

    # 2. Transition session to ACTIVE
    await repo.update_status_and_last_seen(
        session_id=session_id,
        user_id=user_id,
        new_status=SessionStatus.ACTIVE.value,
        now=now,
        duration_delta=0,
        db=db,
    )
    await db.commit()

    # Fetch total paused seconds (all resolved pauses including the one just closed)
    total_paused = await repo.get_total_paused_seconds(
        session_id=session_id, db=db,
    )

    return ResumeResponse(
        session_id=session_id,
        status=SessionStatus.ACTIVE,
        resumed_at=now,
        pause_duration_seconds=this_pause_seconds,
        total_paused_seconds=total_paused,
    )


# ---------------------------------------------------------------------------
# End Session
# ---------------------------------------------------------------------------

async def end_session(
    session_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> EndResponse:
    """
    Transition a session to COMPLETED.

    Valid source states: ACTIVE, PAUSED.

    CRITICAL DURATION MATH (all server-side, UTC):
      1. If the session is PAUSED, close the open pause first.
      2. total_paused_seconds = SUM(all pause_duration_seconds)
      3. wall_clock_seconds = (now - session.created_at).total_seconds()
      4. actual_duration_seconds = wall_clock_seconds - total_paused_seconds

    We NEVER trust client-sent durations.

    Raises:
        SessionNotFoundError:     Session doesn't exist or is soft-deleted.
        SessionAlreadyEndedError: Session is already COMPLETED (immutable).
    """
    repo = StudySessionRepository
    now = datetime.now(timezone.utc)

    # Lookup with IDOR-safe user_id scope
    session = await repo.get_by_id(
        session_id=session_id,
        user_id=user_id,
        db=db,
    )

    if session is None:
        raise SessionNotFoundError(str(session_id))

    # Guard: already completed → immutable
    if session.status == SessionStatus.COMPLETED.value:
        raise SessionAlreadyEndedError(str(session_id))

    # Guard: must be in ACTIVE or PAUSED
    if session.status not in (SessionStatus.ACTIVE.value, SessionStatus.PAUSED.value):
        raise SessionNotActiveError(str(session_id), session.status)

    # Step 1: If currently PAUSED, close the open pause
    if session.status == SessionStatus.PAUSED.value:
        open_pause = await repo.get_open_pause(
            session_id=session_id, db=db,
        )
        if open_pause is not None:
            created_at_aware = open_pause.created_at.replace(tzinfo=timezone.utc) \
                if open_pause.created_at.tzinfo is None else open_pause.created_at
            pause_delta = max(0, round((now - created_at_aware).total_seconds()))
            await repo.record_resume(
                pause_id=open_pause.id,
                duration_seconds=pause_delta,
                db=db,
            )

    # Step 2: Calculate total paused seconds (after closing any open pause)
    # We need to flush first to ensure the closed pause is visible
    await db.flush()
    total_paused = await repo.get_total_paused_seconds(
        session_id=session_id, db=db,
    )

    # Step 3: Calculate actual study duration
    delta = 0
    if session.status == SessionStatus.ACTIVE.value:
        last_seen = session.last_seen_at.replace(tzinfo=timezone.utc) \
            if session.last_seen_at.tzinfo is None else session.last_seen_at
        delta = max(0, round((now - last_seen).total_seconds()))

    actual_duration = session.duration_seconds + delta

    # Step 4: Mark session as COMPLETED with calculated duration
    await repo.end_session(
        session_id=session_id,
        user_id=user_id,
        now=now,
        actual_duration_seconds=actual_duration,
        db=db,
    )
    await db.commit()

    # Fetch final pause count for response
    pause_count = await repo.get_pause_count(session_id=session_id, db=db)

    return EndResponse(
        session_id=session_id,
        status=SessionStatus.COMPLETED,
        ended_at=now,
        actual_duration_seconds=actual_duration,
        total_paused_seconds=total_paused,
        pause_count=pause_count,
    )


# ---------------------------------------------------------------------------
# Lookup (for future endpoints)
# ---------------------------------------------------------------------------

async def get_session_by_id(
    user_id: UUID,
    session_id: UUID,
    db: AsyncSession,
) -> Optional[SessionModel]:
    """Retrieve a session by PK, scoped to the authenticated user."""
    return await StudySessionRepository.get_by_id(
        session_id=session_id,
        user_id=user_id,
        db=db,
    )
