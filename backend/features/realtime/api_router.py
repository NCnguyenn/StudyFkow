"""
realtime — SSE (Server-Sent Events) Router

Exposes a GET /stream endpoint that:
  1. Authenticates via JWT query-parameter (EventSource-compatible).
  2. Subscribes to the per-user Redis Pub/Sub channel
     ``channel:user_events:{user_id}`` and forwards messages to the browser.
  3. Sends a heartbeat ping every 15 seconds to keep the connection alive.
  4. Gracefully handles client disconnection (asyncio.CancelledError and
     request.is_disconnected()) without leaking coroutines or log noise.

Concurrency strategy — NO blocking loops:
  The native ``async for msg in pubsub.listen()`` blocks until a Redis message
  arrives, which would prevent the 15-second heartbeat from ever firing.

  Instead, each iteration of the generator calls:
      asyncio.wait_for(pubsub.get_message(ignore_subscribe_messages=True), timeout=1.0)

  This gives up after 1 second if no message is waiting.  A monotonic clock
  comparison then decides whether the 15-second heartbeat is due.  Both the
  pub/sub channel and the heartbeat are serviced within the same coroutine,
  on the same event-loop thread, with zero extra tasks or threads.

Resource protection:
  A try…finally block guarantees ``pubsub.unsubscribe()``, ``pubsub.close()``,
  and ``redis_client.aclose()`` are called on every exit path, including
  CancelledError and is_disconnected() breaks.
"""

import asyncio
import json
import time
from typing import AsyncGenerator

import redis.asyncio as aioredis

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from backend.app.core.celery_app import REDIS_URL
from backend.features.user_auth.api.dependencies import get_current_user_ws
from backend.features.user_auth.domain.models import UserSummary

# Note: The prefix here is "/realtime", and it will be attached to "/api/v1" in main.py
router = APIRouter(prefix="/realtime", tags=["Realtime"])

_HEARTBEAT_INTERVAL_SECONDS = 15
_POLL_TIMEOUT_SECONDS = 1.0   # max wait per get_message() call


async def _event_generator(request: Request, user_id: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings indefinitely.

    SSE wire format (per spec):
        data: <json_payload>\n\n

    Yields:
        - Domain events from ``channel:user_events:{user_id}`` immediately.
        - A ``ping`` heartbeat every 15 s.
    """
    channel = f"channel:user_events:{user_id}"
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()

    try:
        await pubsub.subscribe(channel)
        last_ping = time.monotonic()

        while True:
            # ── Disconnection guard ────────────────────────────────────────
            # Starlette sets request.is_disconnected() without a CancelledError
            # when the client closes the tab / network drops.
            if await request.is_disconnected():
                break

            # ── Poll Redis (non-blocking, 1-second max wait) ───────────────
            try:
                msg = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True),
                    timeout=_POLL_TIMEOUT_SECONDS,
                )
            except asyncio.TimeoutError:
                msg = None

            # ── Forward domain event if one arrived ────────────────────────
            if msg is not None and msg.get("data"):
                raw = msg["data"]
                # Validate it is JSON before forwarding (drop corrupt frames)
                try:
                    json.loads(raw)
                    yield f"data: {raw}\n\n"
                except (json.JSONDecodeError, TypeError):
                    pass  # silently drop malformed messages

            # ── Heartbeat check ────────────────────────────────────────────
            now = time.monotonic()
            if now - last_ping >= _HEARTBEAT_INTERVAL_SECONDS:
                payload = json.dumps({"type": "ping", "user_id": user_id})
                yield f"data: {payload}\n\n"
                last_ping = now

    except asyncio.CancelledError:
        # FastAPI cancelled the generator when the HTTP connection closed.
        # Fall through to `finally` for cleanup.
        pass
    finally:
        # ── Resource cleanup — always runs ─────────────────────────────────
        # Prevents zombie subscriptions from accumulating in Redis.
        try:
            await pubsub.unsubscribe(channel)
        except Exception:
            pass
        try:
            await pubsub.aclose()
        except Exception:
            pass
        try:
            await redis_client.aclose()
        except Exception:
            pass


@router.get(
    "/stream",
    summary="SSE event stream",
    description=(
        "Opens a persistent Server-Sent Events stream for the authenticated user. "
        "Forwards real-time domain events (e.g. VOICE_NOTE_READY) published to the "
        "user's Redis channel, plus a heartbeat `ping` every 15 seconds. "
        "Authenticate via `?token=<jwt>` (required because the browser EventSource API "
        "cannot attach custom HTTP headers)."
    ),
    response_class=StreamingResponse,
    # Exclude from OpenAPI schema body docs — the response is a stream, not JSON.
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def stream_events(
    request: Request,
    current_user: UserSummary = Depends(get_current_user_ws),
) -> StreamingResponse:
    """Authenticated SSE endpoint. Returns a never-ending event stream."""
    return StreamingResponse(
        _event_generator(request=request, user_id=str(current_user.user_id)),
        media_type="text/event-stream",
        headers={
            # Prevent proxy / CDN buffering from breaking the stream
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            # Allow EventSource clients on other origins to read headers
            "Access-Control-Allow-Origin": "*",
        },
    )
