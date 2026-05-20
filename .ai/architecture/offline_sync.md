# 🔄 AI StudyFlow — Offline-First Sync Architecture

> **Canonical Authority:** This defines the offline-first synchronization engine bridging the Next.js client and FastAPI backend.

## 1. CLIENT-SIDE STORAGE
- **IndexedDB:** Primary local database for the web client (using a wrapper like `dexie`).
- **Persistence:** All read queries in the frontend query IndexedDB first. The UI is updated optimistically.

## 2. OUTBOX QUEUE MECHANISM
- **Mutation Interception:** When the user performs a write (e.g., create a flashcard), the mutation is applied to IndexedDB immediately and appended to a local `sync_outbox` table.
- **Payload Structure:**
  ```json
  {
    "id": "uuid-123",
    "entity_type": "flashcard",
    "operation": "CREATE",
    "payload": { ... },
    "client_timestamp": "2026-05-07T12:00:00Z"
  }
  ```

## 3. SYNC STRATEGY
- **Push:** Client drains the `sync_outbox` by sending a batch `POST /api/v1/sync/push` to the backend.
- **Pull:** Client requests updates via `GET /api/v1/sync/pull?since={last_sync_timestamp}` to fetch server-side changes.

## 4. CONFLICT RESOLUTION (Last Write Wins)
- **LWW Algorithm:** Every entity has an `updated_at` timestamp. If a client pushes a mutation for an entity that has a newer `updated_at` on the server, the server REJECTS the mutation.
- **Merge Rules:** Complex entities (like structured AI notes) implement field-level LWW if possible, otherwise row-level LWW is the fallback.

## 5. RETRY MECHANISM & EXPONENTIAL BACKOFF
- If the `/sync/push` fails due to network error, the outbox retains the items.
- The client retries at intervals: 2s, 4s, 8s, 16s, up to a maximum of 5 minutes.

## 6. IDEMPOTENCY
- Every mutation in the outbox is assigned a unique `idempotency_key` (UUID).
- The backend stores processed keys in Redis for 24 hours. If a retry sends the same key, the backend returns 200 OK without duplicating the operation.

## 7. SYNC TRIGGERS
- **Startup:** Sync initiates immediately when the app loads.
- **Reconnect:** Sync triggers when the browser fires the `online` event.
- **Interval:** Background sync runs every 60 seconds while the app is open.
