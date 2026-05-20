/**
 * study_sessions — Frontend Domain Types
 *
 * Mirrors the backend domain models from:
 *   backend/features/study_sessions/domain/models.py
 *
 * Rules:
 *   - All timestamps are ISO 8601 UTC strings.
 *   - Frontend NEVER calculates authoritative durations (global.md §2).
 *   - Frontend timezone conversion is presentation-only (global.md §3).
 */

// ---------------------------------------------------------------------------
// Frontend State Machine (from 01_SYSTEM_SPEC)
// ---------------------------------------------------------------------------

/**
 * Client-side UI states. NOT the same as backend SessionStatus.
 *
 * IDLE       → No active session. "Start Focus Session" button visible.
 * REQUESTING → POST /sessions/start is in-flight.
 * ACTIVE     → Session is running. Timer counts up. Heartbeats are sent.
 * PAUSED     → Session is paused. Timer is frozen.
 * ENDING     → POST /sessions/{id}/end is in-flight.
 * SUMMARY    → Session has ended. Summary view is shown.
 * ERROR      → An unrecoverable error occurred.
 */
export type FrontendSessionState =
  | "IDLE"
  | "REQUESTING"
  | "ACTIVE"
  | "PAUSED"
  | "ENDING"
  | "SUMMARY"
  | "ERROR";

// ---------------------------------------------------------------------------
// Backend Enum Mirror
// ---------------------------------------------------------------------------

export type BackendSessionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "INTERRUPTED";

// ---------------------------------------------------------------------------
// API Request/Response Types (from api_contracts.md §3)
// ---------------------------------------------------------------------------

export interface SessionStartRequest {
  client_session_id: string;
  title: string;
  topic_ids?: string[];
  notes?: string;
}

export interface SessionResponseData {
  id: string;
  user_id: string;
  title: string;
  status: BackendSessionStatus;
  duration_seconds: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface HeartbeatResponseData {
  session_id: string;
  status: BackendSessionStatus;
  server_time: string;
}

export interface PauseResponseData {
  session_id: string;
  status: "PAUSED";
  paused_at: string;
  pause_count: number;
}

export interface ResumeResponseData {
  session_id: string;
  status: "ACTIVE";
  resumed_at: string;
  pause_duration_seconds: number;
  total_paused_seconds: number;
}

export interface EndResponseData {
  session_id: string;
  status: "COMPLETED";
  ended_at: string;
  actual_duration_seconds: number;
  total_paused_seconds: number;
  pause_count: number;
}

// ---------------------------------------------------------------------------
// Standard API Envelope (from api_contracts.md §1.2)
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    trace_id: string;
    timestamp: string;
    version: string;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
  meta: {
    trace_id: string;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------------
// localStorage Persistence Key
// ---------------------------------------------------------------------------

export interface PersistedSession {
  session_id: string;
  title: string;
  status: BackendSessionStatus;
  started_at: string;
  last_heartbeat_server_time: string | null;
  total_paused_seconds: number;
}

export const LOCAL_STORAGE_KEY = "studyflow_pending_session" as const;
