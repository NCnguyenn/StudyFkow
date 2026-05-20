# ⏳ AI StudyFlow — Session State Machine

> **Canonical Authority:** This document defines the business logic and state transitions for Study Sessions.

## 1. STATES
- **ACTIVE:** The user is currently studying. Time is actively accumulating.
- **PAUSED:** The user has paused the session. Time is not accumulating.
- **COMPLETED:** The session is finished. No further actions are allowed.

## 2. STATE TRANSITION DIAGRAM
```text
  [Start]
     │
     ▼
  ACTIVE ────────┐
     │  ▲        │
     │  │        │
     ▼  │        ▼
   PAUSED     COMPLETED
     │           ▲
     └───────────┘
```

## 3. VALID TRANSITIONS
- `[None] -> ACTIVE`: Triggered by session creation. Sets `started_at`.
- `ACTIVE -> PAUSED`: User pauses. Calculates time elapsed since last resume/start and adds to `duration_seconds`.
- `PAUSED -> ACTIVE`: User resumes. Records new `last_resumed_at` timestamp.
- `ACTIVE -> COMPLETED`: User finishes. Final time calculation applied.
- `PAUSED -> COMPLETED`: User finishes while paused.

## 4. BUSINESS RULES & TIME TRACKING
- **Duration Calculation:** Time tracking must be resilient to browser crashes. 
  - The server stores `duration_seconds` (accumulated) and `last_active_timestamp`.
  - When transitioning states, the delta `(now() - last_active_timestamp)` is added to `duration_seconds`.
- **Auto-Pause:** If a client does not send a heartbeat ping every 5 minutes, the server automatically transitions the session from `ACTIVE` to `PAUSED`.

## 5. CONSTRAINTS
- **One Active Session:** A user can only have ONE session in the `ACTIVE` or `PAUSED` state at any given time. Creating a new session automatically marks the previous one as `COMPLETED`.
- **Immutability:** Once a session reaches `COMPLETED`, its `duration_seconds` and associated log entries are locked and immutable.
