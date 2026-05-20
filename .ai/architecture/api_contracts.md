# 📋 AI StudyFlow — API Contracts

> **Canonical Authority:** This document is the single source of truth for all HTTP API contracts
> in the AI StudyFlow system. AI agents generating frontend or backend code MUST validate their
> implementations against this document. Undocumented endpoints MUST NOT be invoked or created.

---

## 1. GLOBAL API CONVENTIONS

### 1.1 Base URL Structure

```
Production:  https://api.studyflow.app/api/v1
Staging:     https://staging-api.studyflow.app/api/v1
Development: http://localhost:8000/api/v1
```

### 1.2 Standard Response Envelope

All API responses MUST conform to this envelope structure. No raw arrays or flat payloads at the top level.

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-09-15T08:30:00Z",
    "version": "v1"
  }
}
```

**Paginated List Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-09-15T08:30:00Z",
    "pagination": {
      "cursor": "eyJpZCI6ICI1NTBlODQwMCJ9",
      "has_next": true,
      "page_size": 20
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request payload is invalid",
    "details": [
      { "field": "duration_minutes", "issue": "must be between 1 and 480" }
    ]
  },
  "meta": {
    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-09-15T08:30:00Z"
  }
}
```

### 1.3 Standard HTTP Status Codes

| Code | When to Use |
|---|---|
| `200 OK` | Successful read (GET), successful update (PUT/PATCH) |
| `201 Created` | Successful resource creation (POST) |
| `202 Accepted` | Async task enqueued (POST to AI generation endpoint) |
| `204 No Content` | Successful deletion (DELETE) |
| `400 Bad Request` | Invalid request payload (Pydantic validation failed) |
| `401 Unauthorized` | Missing or invalid authentication token |
| `403 Forbidden` | Authenticated but not authorized for the resource |
| `404 Not Found` | Resource does not exist OR soft-deleted |
| `409 Conflict` | Optimistic lock conflict, duplicate resource |
| `422 Unprocessable Entity` | Semantically invalid request (business rule violation) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error (MUST NOT expose stack traces) |

### 1.4 Authentication

All endpoints except `/auth/*` and `/health` MUST require JWT Bearer token authentication.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token must contain: `user_id`, `email`, `subscription_tier`, `exp`.

---

## 2. AUTHENTICATION ENDPOINTS

### `POST /auth/register`

**Purpose:** Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "display_name": "Chi Nguyen",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "Chi Nguyen",
    "subscription_tier": "free"
  },
  "meta": { ... }
}
```

**Errors:** `400` validation, `409` email already registered.

---

### `POST /auth/login`

**Purpose:** Authenticate and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "meta": { ... }
}
```

**Errors:** `400` invalid credentials, `429` too many attempts.

---

### `POST /auth/refresh`

**Purpose:** Exchange a refresh token for a new access token.

**Request:**
```json
{ "refresh_token": "eyJ..." }
```

**Response `200`:** Returns new `access_token` and `expires_in`.

---

### `POST /auth/logout`

**Purpose:** Invalidate the current refresh token.

**Auth:** Required.

**Response `204`:** No content.

---

## 3. STUDY SESSION ENDPOINTS

> **Implementation Status Legend:** `[ACTIVE]` = Implemented & tested | `[DRAFT]` = Designed, not yet built

---

### `POST /sessions/start` — [ACTIVE]

**Purpose:** Start a new study session for the authenticated user.

**Auth:** Required.

**Idempotency:** If `client_session_id` already exists for this user, the existing session is returned with `200 OK` instead of creating a duplicate.

**State machine constraint:** Returns `400 ACTIVE_SESSION_EXISTS` if the user already has a session in `ACTIVE`, `PAUSED`, or `PENDING` state.

**Request:**
```json
{
  "client_session_id": "uuid-v4-generated-by-client",
  "title": "Linear Algebra Chapter 3",
  "topic_ids": ["uuid1", "uuid2"],
  "notes": "Focus on eigenvalues and eigenvectors"
}
```

**Response `201` (new session):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "title": "Linear Algebra Chapter 3",
    "status": "PENDING",
    "duration_seconds": 0,
    "last_seen_at": "2026-05-09T12:00:00Z",
    "created_at": "2026-05-09T12:00:00Z",
    "updated_at": "2026-05-09T12:00:00Z"
  },
  "meta": { "trace_id": "...", "timestamp": "...", "version": "v1" }
}
```

**Response `200` (idempotent replay):** Same body as `201` but with the existing session.

**Errors:**
- `400 ACTIVE_SESSION_EXISTS` — user already has a live session.
- `400` — Pydantic validation failure.

---

### `POST /sessions/{session_id}/heartbeat` — [ACTIVE]

**Purpose:** Client heartbeat to keep a session alive and confirm liveness.

**Auth:** Required. User MUST own the session.

**Heartbeat interval:** Client MUST call this every ≤5 minutes. If no heartbeat is received within the threshold, the Celery `detect_orphan_sessions` job transitions the session to `INTERRUPTED`.

**State transitions on heartbeat:**
- `PENDING → ACTIVE` (first heartbeat activates the session)
- `ACTIVE → ACTIVE` (updates `last_seen_at`)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ACTIVE",
    "server_time": "2026-05-09T12:00:30Z"
  },
  "meta": { "trace_id": "...", "timestamp": "...", "version": "v1" }
}
```

**Errors:**
- `404 SESSION_NOT_FOUND` — session does not exist or is soft-deleted.
- `409 SESSION_NOT_ACTIVE` — session is in a terminal state (`COMPLETED`, `INTERRUPTED`).

---

### `GET /sessions`

**Purpose:** List authenticated user's study sessions with pagination.

**Auth:** Required.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor from previous response |
| `page_size` | int | 20 | Records per page (max 100) |
| `status` | string | null | Filter: `active`, `paused`, `completed` |
| `from_date` | ISO8601 | null | Filter sessions created after this date |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Linear Algebra Chapter 3",
      "status": "completed",
      "duration_minutes": 45,
      "created_at": "2025-09-15T08:00:00Z",
      "updated_at": "2025-09-15T08:45:00Z"
    }
  ],
  "meta": {
    "pagination": { "cursor": "...", "has_next": false, "page_size": 20 }
  }
}
```

---

### `POST /sessions`

**Purpose:** Create a new study session.

**Auth:** Required.

**Request:**
```json
{
  "title": "Linear Algebra Chapter 3",
  "duration_minutes": 45,
  "topic_ids": ["uuid1", "uuid2"],
  "notes": "Focus on eigenvalues and eigenvectors"
}
```

**Response `201`:** Full session object as defined in GET response.

**Errors:** `400` validation, `422` quota exceeded (free tier limit).

---

### `GET /sessions/{session_id}`

**Purpose:** Get a single session by ID.

**Auth:** Required. User MUST own the session.

**Response `200`:** Full session object with nested topic summaries.

**Errors:** `404` not found or soft-deleted, `403` not owner.

---

### `PATCH /sessions/{session_id}`

**Purpose:** Update a session (title, status, notes).

**Auth:** Required. User MUST own the session.

**Request:**
```json
{
  "title": "Updated Title",
  "status": "paused",
  "notes": "Updated notes"
}
```

All fields are optional. Only provided fields are updated.

**Response `200`:** Updated session object.

**Errors:** `409` optimistic lock conflict (include `version` field to prevent).

---

### `DELETE /sessions/{session_id}`

**Purpose:** Soft-delete a session.

**Auth:** Required. User MUST own the session.

**Response `204`:** No content.

---

## 4. FLASHCARD ENDPOINTS

### `GET /decks/{deck_id}/flashcards`

**Purpose:** List flashcards in a deck with pagination.

**Auth:** Required.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "front": "What is an eigenvector?",
      "back": "A vector whose direction is unchanged by a linear transformation.",
      "difficulty": "medium",
      "next_review_at": "2025-09-20T10:00:00Z",
      "created_at": "2025-09-15T08:00:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

---

### `POST /decks/{deck_id}/flashcards/generate`

**Purpose:** Enqueue an AI generation task to create flashcards from study notes.

**Auth:** Required.

**Request:**
```json
{
  "source_content": "Long-form study notes text...",
  "card_count": 10,
  "difficulty_preference": "adaptive",
  "language": "en"
}
```

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "task_id": "task-uuid",
    "status": "queued",
    "estimated_completion_seconds": 15,
    "poll_url": "/tasks/task-uuid/status"
  },
  "meta": { ... }
}
```

**WHY `202` not `201`:** Flashcard generation is an async Celery task. The cards do not exist yet. The client must poll `/tasks/{task_id}/status` for completion.

---

## 5. AI TASK STATUS ENDPOINTS

### `GET /tasks/{task_id}/status`

**Purpose:** Poll the status of an async AI generation task.

**Auth:** Required. User MUST own the task.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "task_id": "task-uuid",
    "status": "processing",
    "progress_percent": 60,
    "result_url": null,
    "error": null
  },
  "meta": { ... }
}
```

**Terminal States:**

| `status` | Description | `result_url` populated? |
|---|---|---|
| `queued` | Task waiting in Celery queue | No |
| `processing` | Celery worker actively executing | No |
| `completed` | Task succeeded | Yes |
| `failed` | Task failed after all retries | No |

**Response `200` (completed):**
```json
{
  "success": true,
  "data": {
    "task_id": "task-uuid",
    "status": "completed",
    "progress_percent": 100,
    "result_url": "/decks/deck-uuid/flashcards?generated_batch=task-uuid",
    "error": null
  }
}
```

---

## 6. SYNCHRONIZATION ENDPOINTS (Offline-First)

### `POST /sync/push`

**Purpose:** Push locally-queued mutations from the offline-first client to the server.

**Auth:** Required.

**Request:**
```json
{
  "client_id": "device-uuid",
  "mutations": [
    {
      "operation": "UPDATE",
      "entity": "study_session",
      "entity_id": "session-uuid",
      "payload": { "status": "completed", "notes": "..." },
      "client_timestamp": "2025-09-15T08:45:00Z",
      "client_version": 3
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "applied": ["session-uuid"],
    "conflicts": [],
    "rejected": []
  },
  "meta": { ... }
}
```

**Conflict Resolution:** Last-Write-Wins based on `client_timestamp`. The server's `updated_at` is authoritative. If a server mutation is newer than the client's timestamp, the mutation is placed in `conflicts` and the server's current state is returned so the client can reconcile.

---

### `GET /sync/pull`

**Purpose:** Pull server-side changes since the client's last sync timestamp.

**Auth:** Required.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `since` | ISO8601 | Pull changes made after this timestamp |
| `client_id` | UUID | Client device identifier |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "entity": "study_session",
        "entity_id": "uuid",
        "operation": "UPDATE",
        "payload": { ... },
        "server_timestamp": "2025-09-15T09:00:00Z"
      }
    ],
    "server_timestamp": "2025-09-15T09:00:00Z"
  }
}
```

---

## 7. API VERSIONING & DEPRECATION POLICY

### 7.1 Version Lifecycle

| Phase | Duration | Description |
|---|---|---|
| **Active** | Indefinite | Current supported version |
| **Deprecated** | 30 days minimum | Old version still works; deprecation header sent |
| **Sunset** | Immediate after deprecation | Returns `410 Gone` |

### 7.2 Deprecation Headers

When a v1 endpoint is deprecated in favor of v2, responses from v1 MUST include:

```http
Deprecation: true
Sunset: Sat, 15 Oct 2025 00:00:00 GMT
Link: </api/v2/sessions>; rel="successor-version"
```

### 7.3 Breaking vs Non-Breaking Changes

| Change Type | Classification | Action Required |
|---|---|---|
| Add optional response field | Non-breaking | No versioning needed |
| Add optional request field | Non-breaking | No versioning needed |
| Remove response field | Breaking | New API version required |
| Change field type | Breaking | New API version required |
| Remove endpoint | Breaking | New API version + 30-day deprecation |
| Change pagination strategy | Breaking | New API version required |

---

## 8. RATE LIMITING

| Endpoint Group | Free Tier | Pro Tier | Per Minute |
|---|---|---|---|
| `/auth/*` | 10 req/min | 10 req/min | Per IP |
| `/sessions/*` (read) | 60 req/min | 300 req/min | Per user |
| `/sessions/*` (write) | 20 req/min | 100 req/min | Per user |
| `/flashcards/generate` | 5 req/hour | 50 req/hour | Per user |
| `/sync/*` | 30 req/min | 200 req/min | Per user |

Rate limit headers MUST be included in all responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1694772660
```

---

*End of API Contracts — Last reviewed: 2026-05-07*


## 5. Analytics & Insights
**Base Path:** \/api/v1\

### 5.1 Analytics
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | \/analytics/summary\ | Req | Fetch aggregated user study stats |

### 5.2 Insights
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | \/insights\ | Req | List non-dismissed insights for the user |
| POST | \/insights/{id}/feedback\ | Req | Submit feedback or dismiss insight |

