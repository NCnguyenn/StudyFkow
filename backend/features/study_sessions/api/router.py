"""
study_sessions — API Router

Endpoints:
  POST /sessions/start            → Start a new session (idempotent)
  POST /sessions/{id}/heartbeat   → Client heartbeat ping
  POST /sessions/{id}/pause       → Pause an active session
  POST /sessions/{id}/resume      → Resume a paused session
  POST /sessions/{id}/end         → End a session (COMPLETED)

Contract rules (from api_contracts.md):
  - All responses use the standard { success, data, meta } envelope
  - 201 for a new session, 200 for an idempotent replay
  - 400 ACTIVE_SESSION_EXISTS if user already has a live session
  - 409 SESSION_NOT_ACTIVE if heartbeat/pause hits a non-active session
  - 409 SESSION_NOT_PAUSED if resume hits a non-paused session
  - 409 SESSION_ALREADY_ENDED if any mutation hits a COMPLETED session
  - Auth required on all endpoints (get_current_user dependency)
"""

import uuid as _uuid
from datetime import datetime, timezone
from typing import NoReturn
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user
from backend.features.user_auth.domain.models import UserSummary
from backend.features.analytics.application.insight_generator import generate_rule_based_insights
from ..domain.models import SessionStartRequest, SessionResponse, SessionStatus
from ..domain.exceptions import (
    ActiveSessionExistsError,
    SessionNotActiveError,
    SessionNotFoundError,
    SessionNotPausedError,
    SessionAlreadyEndedError,
)
from ..application import service


router = APIRouter(prefix="/sessions", tags=["Study Sessions"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_meta() -> dict:
    """Build the standard response meta block."""
    return {
        "trace_id": str(_uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "v1",
    }


def _raise_not_found() -> NoReturn:
    """Raise a 404 for missing/soft-deleted sessions."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "code": "SESSION_NOT_FOUND",
            "message": "Session not found or has been deleted.",
        },
    )


def _raise_not_active(exc: SessionNotActiveError) -> NoReturn:
    """Raise a 409 for non-active sessions."""
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "code": "SESSION_NOT_ACTIVE",
            "message": f"Session is in state '{exc.current_status}' and cannot be modified.",
            "session_id": exc.session_id,
        },
    )


def _raise_already_ended(exc: SessionAlreadyEndedError) -> NoReturn:
    """Raise a 409 for COMPLETED sessions."""
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "code": "SESSION_ALREADY_ENDED",
            "message": "Session is already COMPLETED and is immutable.",
            "session_id": exc.session_id,
        },
    )


# ---------------------------------------------------------------------------
# POST /sessions/start
# ---------------------------------------------------------------------------

@router.post(
    "/start",
    summary="Start a study session (idempotent)",
    status_code=status.HTTP_201_CREATED,
)
async def start_session(
    request: SessionStartRequest,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> JSONResponse:
    """
    Starts a new study session for the authenticated user.

    **Idempotency:** Sending the same `client_session_id` twice returns the
    existing session with `200 OK` instead of creating a duplicate.

    **State machine:** Returns `400 ACTIVE_SESSION_EXISTS` if the user already
    has a session in `ACTIVE` or `PAUSED` state.
    """
    try:
        session_row, is_new = await service.start_session(
            user_id=current_user.user_id,
            request=request,
            db=db,
        )
        response_data = SessionResponse(
            id=session_row.id,
            user_id=session_row.user_id,
            title=session_row.title,
            status=SessionStatus(session_row.status),
            duration_seconds=session_row.duration_seconds,
            last_seen_at=session_row.last_seen_at,
            created_at=session_row.created_at,
            updated_at=session_row.updated_at,
            task_id=session_row.task_id,
        )

        http_status = status.HTTP_201_CREATED if is_new else status.HTTP_200_OK

        return JSONResponse(
            status_code=http_status,
            content={
                "success": True,
                "data": response_data.model_dump(mode="json"),
                "meta": _build_meta(),
            },
        )
    except ActiveSessionExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "ACTIVE_SESSION_EXISTS",
                "message": "User already has an active or paused session.",
                "existing_session_id": exc.existing_session_id,
            },
        )


# ---------------------------------------------------------------------------
# POST /sessions/{id}/heartbeat
# ---------------------------------------------------------------------------

@router.post(
    "/{session_id}/heartbeat",
    summary="Send client heartbeat ping",
    status_code=status.HTTP_200_OK,
)
async def heartbeat(
    session_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> JSONResponse:
    """
    Client heartbeat endpoint.

    The client MUST call this every ≤5 minutes to keep the session alive.
    If no heartbeat is received within the threshold, the server-side
    auto-pause job will transition the session to PAUSED.

    **Terminal sessions:** Returns `409 SESSION_NOT_ACTIVE` if the session
    is COMPLETED, INTERRUPTED, or ERROR.
    """
    try:
        result = await service.process_heartbeat(
            session_id=session_id,
            user_id=current_user.user_id,
            db=db,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": result.model_dump(mode="json"),
                "meta": _build_meta(),
            },
        )
    except SessionNotFoundError:
        _raise_not_found()
    except SessionNotActiveError as exc:
        _raise_not_active(exc)


# ---------------------------------------------------------------------------
# POST /sessions/{id}/pause
# ---------------------------------------------------------------------------

@router.post(
    "/{session_id}/pause",
    summary="Pause an active study session",
    status_code=status.HTTP_200_OK,
)
async def pause(
    session_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> JSONResponse:
    """
    Pause the authenticated user's active study session.

    **State machine:** Only sessions in `ACTIVE` state can be paused.
    - `409 SESSION_NOT_ACTIVE` if session is PAUSED or other non-active state.
    - `409 SESSION_ALREADY_ENDED` if session is COMPLETED.
    - `404 SESSION_NOT_FOUND` if session doesn't exist or is soft-deleted.
    """
    try:
        result = await service.pause_session(
            session_id=session_id,
            user_id=current_user.user_id,
            db=db,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": result.model_dump(mode="json"),
                "meta": _build_meta(),
            },
        )
    except SessionNotFoundError:
        _raise_not_found()
    except SessionAlreadyEndedError as exc:
        _raise_already_ended(exc)
    except SessionNotActiveError as exc:
        _raise_not_active(exc)


# ---------------------------------------------------------------------------
# POST /sessions/{id}/resume
# ---------------------------------------------------------------------------

@router.post(
    "/{session_id}/resume",
    summary="Resume a paused study session",
    status_code=status.HTTP_200_OK,
)
async def resume(
    session_id: UUID,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> JSONResponse:
    """
    Resume the authenticated user's paused study session.

    **State machine:** Only sessions in `PAUSED` state can be resumed.
    - `409 SESSION_NOT_PAUSED` if session is ACTIVE or other non-paused state.
    - `409 SESSION_ALREADY_ENDED` if session is COMPLETED.
    - `404 SESSION_NOT_FOUND` if session doesn't exist or is soft-deleted.
    """
    try:
        result = await service.resume_session(
            session_id=session_id,
            user_id=current_user.user_id,
            db=db,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": result.model_dump(mode="json"),
                "meta": _build_meta(),
            },
        )
    except SessionNotFoundError:
        _raise_not_found()
    except SessionAlreadyEndedError as exc:
        _raise_already_ended(exc)
    except SessionNotPausedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SESSION_NOT_PAUSED",
                "message": f"Session is in state '{exc.current_status}', not PAUSED.",
                "session_id": exc.session_id,
            },
        )


# ---------------------------------------------------------------------------
# POST /sessions/{id}/end
# ---------------------------------------------------------------------------

@router.post(
    "/{session_id}/end",
    summary="End a study session",
    status_code=status.HTTP_200_OK,
)
async def end(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> JSONResponse:
    """
    End the authenticated user's study session.

    **State machine:** Sessions in `ACTIVE` or `PAUSED` state can be ended.
    If currently PAUSED, the open pause is auto-closed before calculating
    the final duration.

    **Duration math (CRITICAL):**
    `actual_duration = (end_time - created_at) - total_paused_seconds`

    All calculations are performed entirely on the server using UTC timestamps.
    No client-sent durations are trusted.

    - `409 SESSION_ALREADY_ENDED` if session is COMPLETED.
    - `409 SESSION_NOT_ACTIVE` if session is in an unexpected state.
    - `404 SESSION_NOT_FOUND` if session doesn't exist or is soft-deleted.
    """
    try:
        result = await service.end_session(
            session_id=session_id,
            user_id=current_user.user_id,
            db=db,
        )
        
        # Non-blocking trigger for insights engine
        background_tasks.add_task(generate_rule_based_insights, current_user.user_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": result.model_dump(mode="json"),
                "meta": _build_meta(),
            },
        )
    except SessionNotFoundError:
        _raise_not_found()
    except SessionAlreadyEndedError as exc:
        _raise_already_ended(exc)
    except SessionNotActiveError as exc:
        _raise_not_active(exc)
