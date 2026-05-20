/**
 * study_sessions — API Client
 *
 * Thin HTTP layer for session endpoints. No business logic here.
 * Consumed exclusively by useStudySession hook.
 *
 * Rules:
 *   - All calls include Authorization: Bearer <token> header.
 *   - Responses are typed against the ApiEnvelope from types/.
 *   - Errors throw structured objects (never swallowed silently).
 */

import type {
  ApiEnvelope,
  SessionStartRequest,
  SessionResponseData,
  HeartbeatResponseData,
  PauseResponseData,
  ResumeResponseData,
  EndResponseData,
} from "../types";

import { fetchWithAuth } from "@/lib/api-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";



/**
 * Parses a fetch Response into a typed ApiEnvelope or throws.
 */
async function parseResponse<T>(res: Response): Promise<ApiEnvelope<T>> {
  const body = await res.json();

  if (!res.ok || body.success === false) {
    const errorCode = body?.error?.code ?? body?.detail?.code ?? "UNKNOWN_ERROR";
    const errorMessage =
      body?.error?.message ?? body?.detail?.message ?? res.statusText;

    throw new SessionApiError(res.status, errorCode, errorMessage);
  }

  return body as ApiEnvelope<T>;
}

// ---------------------------------------------------------------------------
// Custom error class for structured API errors
// ---------------------------------------------------------------------------

export class SessionApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SessionApiError";
  }
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function startSession(
  request: SessionStartRequest,
): Promise<{ data: SessionResponseData; isNew: boolean }> {
  const res = await fetchWithAuth("/sessions/start", {
    method: "POST",
    body: JSON.stringify(request),
  });

  const envelope = await parseResponse<SessionResponseData>(res);

  return {
    data: envelope.data,
    isNew: res.status === 201,
  };
}

export async function sendHeartbeat(
  sessionId: string,
): Promise<HeartbeatResponseData> {
  const res = await fetchWithAuth(`/sessions/${sessionId}/heartbeat`, {
    method: "POST",
  });

  const envelope = await parseResponse<HeartbeatResponseData>(res);
  return envelope.data;
}

export async function pauseSession(
  sessionId: string,
): Promise<PauseResponseData> {
  const res = await fetchWithAuth(`/sessions/${sessionId}/pause`, {
    method: "POST",
  });
  const envelope = await parseResponse<PauseResponseData>(res);
  return envelope.data;
}

export async function resumeSession(
  sessionId: string,
): Promise<ResumeResponseData> {
  const res = await fetchWithAuth(`/sessions/${sessionId}/resume`, {
    method: "POST",
  });
  const envelope = await parseResponse<ResumeResponseData>(res);
  return envelope.data;
}

export async function endSession(
  sessionId: string,
): Promise<EndResponseData> {
  const res = await fetchWithAuth(`/sessions/${sessionId}/end`, {
    method: "POST",
  });

  const envelope = await parseResponse<EndResponseData>(res);
  return envelope.data;
}
