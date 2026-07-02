# 📜 API Contracts — AI StudyFlow

> **Single Source of Truth** for frontend ↔ backend coordination.
>
> - **Frontend agent:** Antigravity
> - **Backend agent:** Jules
> - **Last updated:** 2026-06-27

---

## 1. Quy tắc API Contract

| # | Rule |
|---|------|
| 1 | **KHÔNG** thay đổi response shape của endpoints hiện có (LOCKED). |
| 2 | Chỉ **ADD** fields — KHÔNG remove / rename fields đã tồn tại. |
| 3 | Breaking changes → ghi vào **§5 Breaking Changes** → chờ **user duyệt** trước khi implement. |
| 4 | New endpoints → ghi vào **§4 Requested Endpoints** (nếu Antigravity cần) hoặc **§6 Planned New Endpoints** (nếu Jules backlog). |

> [!CAUTION]
> Bất kỳ thay đổi nào vi phạm các quy tắc trên **sẽ gây regression** cho phía còn lại. Luôn cập nhật doc này trước khi code.

---

## 2. Response Standards

### Standard Envelope (Sessions only)

```jsonc
{
  "success": true,
  "data": T,
  "meta": {
    "trace_id": "uuid-v4",
    "timestamp": "ISO-8601",
    "version": "1.0"
  }
}
```

### Direct Response (Most endpoints)

Most endpoints return the resource directly — **no envelope wrapper**.

### Error Format

```jsonc
// HTTP 4xx / 5xx
{
  "detail": "Human-readable error message"
}
```

### Pagination

Query params: `?offset=0&limit=20`

### Authentication

| Transport | Mechanism |
|-----------|-----------|
| REST | `Authorization: Bearer {access_token}` header |
| SSE | `?token={access_token}` query param |
| Refresh | `HttpOnly` cookie (auto-attached by browser) |

---

## 3. Existing Endpoints (🔒 LOCKED)

> [!IMPORTANT]
> All endpoints below are **LOCKED**. Do not modify their request/response shapes without following §1 rules.

---

### Auth — `/api/v1/auth`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `POST` | `/register` | No | `{ email, password, display_name, timezone }` | `{ data: { access_token }, meta }` | ✅ Stable |
| `POST` | `/login` | No | `{ email, password }` | `{ data: { access_token }, meta }` | ✅ Stable |
| `POST` | `/refresh` | Cookie | — | `{ data: { access_token } }` | ✅ Stable |
| `POST` | `/logout` | No | — | `204 No Content` | ✅ Stable |
| `PUT` | `/preferences` | JWT | `{ display_name?, soul_color_hex?, lite_mode_enabled? }` | `UserSummary` | ✅ Stable |
| `GET` | `/export` | JWT | — | GDPR data dump | ✅ Stable |
| `GET` | `/settings/llm` | JWT | — | `{ provider, api_key }` | ✅ Stable |
| `PUT` | `/settings/llm` | JWT | `{ provider, api_key? }` | `LLMSettings` | ✅ Stable |

---

### Sessions — `/api/v1/sessions`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `POST` | `/start` | JWT | `{ client_session_id?, title, topic_ids?, notes?, task_id? }` | `ApiEnvelope<SessionResponse>` | ✅ Stable |
| `POST` | `/{id}/heartbeat` | JWT | — | `ApiEnvelope<HeartbeatResponse>` | ✅ Stable |
| `POST` | `/{id}/pause` | JWT | — | `ApiEnvelope<PauseResponse>` | ✅ Stable |
| `POST` | `/{id}/resume` | JWT | — | `ApiEnvelope<ResumeResponse>` | ✅ Stable |
| `POST` | `/{id}/end` | JWT | — | `ApiEnvelope<EndResponse>` | ✅ Stable |

---

### Subjects — `/api/v1/subjects`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `POST` | `/` | JWT | `{ title, description?, priority, color? }` | `Subject` | ✅ Stable |
| `GET` | `/` | JWT | — | `Subject[]` | ✅ Stable |
| `GET` | `/{id}/analytics` | JWT | — | `SubjectAnalytics` | ✅ Stable |
| `DELETE` | `/{id}` | JWT | — | `204 No Content` | ✅ Stable |

---

### Tasks — `/api/v1/tasks`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `POST` | `/` | JWT | `TaskCreatePayload` | `TaskResponseData` | ✅ Stable |
| `GET` | `/` | JWT | `?start_date&end_date` | `TaskResponseData[]` | ✅ Stable |
| `GET` | `/{id}` | JWT | — | `TaskResponseData` | ✅ Stable |
| `PATCH` | `/{id}` | JWT | `TaskUpdatePayload` (partial) | `TaskResponseData` | ✅ Stable |
| `PATCH` | `/{id}/state` | JWT | `{ new_state, failed_reason? }` | `TaskResponseData` | ✅ Stable |
| `POST` | `/{id}/rollover` | JWT | `{ new_date }` | `TaskResponseData` | ✅ Stable |
| `DELETE` | `/{id}` | JWT | — | `204 No Content` (soft delete) | ✅ Stable |

---

### Notes — `/api/v1/notes`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `GET` | `/workspace` | JWT | `?folder_id&limit&offset` | `WorkspaceData` | ✅ Stable |
| `POST` | `/folders` | JWT | `{ name, parent_id? }` | `NoteFolderRead` | ✅ Stable |
| `PATCH` | `/folders/{id}` | JWT | `{ name?, parent_id? }` | `NoteFolderRead` | ✅ Stable |
| `DELETE` | `/folders/{id}` | JWT | — | `204 No Content` | ✅ Stable |
| `POST` | `/` | JWT | `NoteCreate` | `NoteRead` | ✅ Stable |
| `GET` | `/{id}` | JWT | — | `NoteRead` | ✅ Stable |
| `PATCH` | `/{id}` | JWT | `NoteUpdate` (partial) | `NoteRead` | ✅ Stable |
| `DELETE` | `/{id}` | JWT | — | `204 No Content` | ✅ Stable |
| `GET` | `/search` | JWT | `NoteSearchQuery` params | `NoteSearchResponse` | ✅ Stable |
| `GET` | `/templates` | JWT | — | `NoteTemplateRead[]` | ✅ Stable |
| `POST` | `/templates` | JWT | `NoteTemplateCreate` | `NoteTemplateRead` | ✅ Stable |
| `GET` | `/templates/{id}` | JWT | — | `NoteTemplateRead` | ✅ Stable |
| `PATCH` | `/templates/{id}` | JWT | `NoteTemplateUpdate` | `NoteTemplateRead` | ✅ Stable |
| `DELETE` | `/templates/{id}` | JWT | — | `204 No Content` | ✅ Stable |
| `GET` | `/{id}/versions` | JWT | — | `NoteVersionRead[]` | ✅ Stable |
| `POST` | `/{id}/versions/{version_id}/restore` | JWT | — | `NoteRead` | ✅ Stable |
| `GET` | `/{id}/links` | JWT | — | `NoteLinksResponse` | ✅ Stable |
| `POST` | `/{id}/links` | JWT | `NoteLinksUpdateRequest` | `204 No Content` | ✅ Stable |

### Themes & Workspace Kits (B3)
*Deferred to future phase (Database models not yet implemented).*

---

### Analytics — `/api/v1/analytics`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `GET` | `/analytics/summary` | JWT | — | `AnalyticsSummary` | ✅ Stable |

---

### Insights — `/api/v1/insights`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `GET` | `/insights` | JWT | — | `InsightResponse[]` | ✅ Stable |
| `POST` | `/insights/{id}/feedback` | JWT | `{ score, dismiss? }` | `200 OK` | ✅ Stable |
| `POST` | `/insights/generate-llm` | JWT | — | `InsightResponse` | ✅ Stable |

---

### Chat — `/api/v1/chat`

| Method | Path | Auth | Request Body | Response | Status |
|--------|------|:----:|-------------|----------|:------:|
| `POST` | `/ask` | JWT | `{ query }` | `{ answer, success }` | ⚠️ LLM mocked |

---

### Realtime — `/api/v1/realtime`

| Protocol | Path | Auth | Events | Status |
|----------|------|:----:|--------|:------:|
| SSE | `/stream?token=JWT` | Query param | `heartbeat`, `VOICE_NOTE_READY` | ✅ Stable |

---

### Health

| Method | Path | Auth | Response | Status |
|--------|------|:----:|----------|:------:|
| `GET` | `/health` | No | `{ status: "ok" }` | ✅ Stable |

---

## Response Type Registry

### TaskCreatePayload
```jsonc
{
  "title": "string (max 100)",
  "description": "string | null",
  "category_id": "uuid | null",
  "subject_id": "uuid | null",
  "subtasks": [
    {
      "id": "string",
      "title": "string",
      "is_completed": "boolean"
    }
  ],
  "recurrence_rule": "string | null",
  "overtime_buffer_minutes": "integer | null",
  "color_code": "string (hex pattern) | null",
  "planned_start": "datetime",
  "planned_end": "datetime",
  "priority": "integer (1-3)",
  "status": "string",
  "task_status": "'PENDING' | 'IN_PROGRESS' | 'USING_OVERTIME' | 'FAILED' | 'COMPLETED'",
  "failed_reason": "string | null",
  "linked_note_id": "uuid | null"
}
```

### TaskUpdatePayload
```jsonc
{
  // All fields from TaskCreatePayload are optional, plus:
  "completion_status": "'ON_TIME' | 'LATE' | 'INCOMPLETE' | null",
  "is_deleted": "boolean | null"
}
```

### TaskResponseData
```jsonc
{
  // All fields from TaskCreatePayload, plus:
  "id": "uuid",
  "user_id": "uuid",
  "completion_status": "string",
  "is_deleted": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 4. Requested Endpoints (📥 QUEUE — Antigravity requests here)

> [!NOTE]
> Antigravity adds rows here when the frontend needs a new endpoint. Jules picks up and implements.

| Priority | Method | Path | Request | Response | Requested By | Status |
|:--------:|--------|------|---------|----------|:------------:|:------:|
| — | — | — | — | — | — | *(empty)* |

<!-- Example row (delete when adding real requests):
| 🔴 HIGH | `GET` | `/api/v1/notes/search?q=` | `?q=string&limit=20` | `NoteRead[]` | Antigravity | ⏳ Pending |
-->

---

## 5. Breaking Changes (⚠️ requires user approval)

> [!WARNING]
> Any row here **blocks implementation** until the user explicitly approves.

| Date | Endpoint | Current Shape | Proposed Change | Reason | Approved? |
|------|----------|--------------|-----------------|--------|:---------:|
| — | — | — | — | — | *(empty)* |

---

## 6. Planned New Endpoints (📋 Jules backlog)

### Notes Expansion (B3)

| Method | Path | Purpose | Priority |
|--------|------|---------|:--------:|
| `GET` | `/notes/graph` | Knowledge graph data | 🟡 MEDIUM |

### Chat Enhancement (B4)

| Method | Path | Purpose | Priority |
|--------|------|---------|:--------:|
| `POST` | `/chat/ask` | Real LLM response (replace mock) | 🔴 HIGH |
| `GET` | `/chat/history` | Conversation history | 🔵 LOW |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-06-27 | User | Initial contract created — all existing endpoints locked. |
