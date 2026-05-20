/**
 * study_sessions — useStudySession Hook
 *
 * Client-side state machine for the Focus Session lifecycle.
 *
 * Frontend State Machine:
 *   IDLE → REQUESTING → ACTIVE ⇄ PAUSED → ENDING → SUMMARY
 *
 * Critical rules (from global.md):
 *   - Backend is the single source of truth for duration.
 *   - Frontend timer is display-only; corrected via heartbeat drift detection.
 *   - All authoritative timestamps come from the server.
 *   - localStorage persistence enables crash recovery.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import type {
  FrontendSessionState,
  SessionResponseData,
  EndResponseData,
  PersistedSession,
} from "../types";
import { LOCAL_STORAGE_KEY } from "../types";

import {
  startSession as apiStartSession,
  sendHeartbeat as apiSendHeartbeat,
  pauseSession as apiPauseSession,
  resumeSession as apiResumeSession,
  endSession as apiEndSession,
  SessionApiError,
} from "../api/sessionApi";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Heartbeat interval in milliseconds (30 seconds). */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Timer tick interval for the display timer (1 second). */
const TIMER_TICK_MS = 1_000;

/** Maximum allowed clock drift in ms before correcting the local timer. */
const MAX_DRIFT_MS = 5_000;

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseStudySessionReturn {
  /** Current UI state. */
  state: FrontendSessionState;

  /** Active session data from the server (null when IDLE). */
  session: SessionResponseData | null;

  /** Summary data after session ends (null until SUMMARY state). */
  summary: EndResponseData | null;

  /** Display-only elapsed seconds (not authoritative). */
  elapsedSeconds: number;

  /** Last error message, if any. */
  errorMessage: string | null;

  /** Whether the browser appears to be offline. */
  isOffline: boolean;

  /** Whether a heartbeat has failed recently. */
  heartbeatFailed: boolean;

  /** Start a new focus session. */
  start: (title: string) => Promise<void>;

  /** Pause the active session. */
  pause: () => Promise<void>;

  /** Resume a paused session. */
  resume: () => Promise<void>;

  /** End the session (active or paused). */
  end: () => Promise<void>;

  /** Dismiss summary and return to IDLE. */
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// UUID v4 generator (crypto-safe)
// ---------------------------------------------------------------------------

function generateUUIDv4(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function persistSession(session: SessionResponseData, serverTime: string | null, totalPausedSeconds: number): void {
  const data: PersistedSession = {
    session_id: session.id,
    title: session.title,
    status: session.status,
    started_at: session.created_at,
    last_heartbeat_server_time: serverTime,
    total_paused_seconds: totalPausedSeconds,
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded — non-critical
  }
}

function loadPersistedSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function clearPersistedSession(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // non-critical
  }
}

// ---------------------------------------------------------------------------
// Hook Implementation
// ---------------------------------------------------------------------------

export function useStudySession(): UseStudySessionReturn {
  const [state, setState] = useState<FrontendSessionState>("IDLE");
  const [session, setSession] = useState<SessionResponseData | null>(null);
  const [summary, setSummary] = useState<EndResponseData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [heartbeatFailed, setHeartbeatFailed] = useState(false);

  // Ref to the session start time for local timer calculation
  const startedAtRef = useRef<number>(0);
  // Ref to accumulated time when active (so timer resumes correctly)
  const activeElapsedRef = useRef<number>(0);
  // Ref to total paused seconds (from server)
  const totalPausedSecondsRef = useRef<number>(0);

  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------------------------------------------------------------------
  // Online/Offline detection
  // -------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // -------------------------------------------------------------------
  // Cleanup intervals on unmount
  // -------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // -------------------------------------------------------------------
  // Display timer management
  // -------------------------------------------------------------------

  const startDisplayTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const nowMs = Date.now();
      const runningSeconds = Math.floor((nowMs - startedAtRef.current) / 1000);
      setElapsedSeconds(activeElapsedRef.current + Math.max(0, runningSeconds));
    }, TIMER_TICK_MS);
  }, []);

  const stopDisplayTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------
  // Heartbeat management
  // -------------------------------------------------------------------

  const startHeartbeat = useCallback(
    (sessionId: string, createdAt: string) => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      heartbeatIntervalRef.current = setInterval(async () => {
        try {
          const hbResponse = await apiSendHeartbeat(sessionId);
          setHeartbeatFailed(false);

          // Timer drift detection
          if (hbResponse.server_time) {
            const serverNowMs = new Date(hbResponse.server_time).getTime();
            const startMs = new Date(createdAt).getTime();
            // Expected elapsed active time on server
            const expectedElapsed = Math.max(0, Math.floor((serverNowMs - startMs) / 1000) - totalPausedSecondsRef.current);

            // If the local elapsed time drifted by more than 5 seconds from the server's truth
            if (Math.abs(expectedElapsed - elapsedSeconds) > 5) {
              const nowMs = Date.now();
              const runningSeconds = expectedElapsed - activeElapsedRef.current;
              startedAtRef.current = nowMs - (runningSeconds * 1000);
              setElapsedSeconds(expectedElapsed);
            }
          }

          // Update persisted session with latest server time
          setSession((prev) => {
            if (prev) persistSession(prev, hbResponse.server_time, totalPausedSecondsRef.current);
            return prev;
          });
        } catch (err) {
          setHeartbeatFailed(true);

          if (err instanceof SessionApiError) {
            // 409 = session ended server-side (orphan detection)
            if (err.statusCode === 409 || err.statusCode === 404) {
              stopHeartbeat();
              stopDisplayTimer();
              clearPersistedSession();
              setState("IDLE");
              setSession(null);
              setErrorMessage("Session was ended by the server.");
            }
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [stopDisplayTimer],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------
  // Recovery on mount: check localStorage for an existing session
  // -------------------------------------------------------------------

  useEffect(() => {
    const persisted = loadPersistedSession();
    if (!persisted) return;

    // Only recover ACTIVE or PAUSED sessions
    if (persisted.status === "ACTIVE" || persisted.status === "PENDING") {
      const startMs = new Date(persisted.started_at).getTime();
      const now = Date.now();
      const totalPaused = persisted.total_paused_seconds || 0;
      totalPausedSecondsRef.current = totalPaused;
      
      // Calculate elapsed by assuming client clock progressed normally since start
      const elapsedSinceStart = Math.max(0, Math.floor((now - startMs) / 1000) - totalPaused);
      
      activeElapsedRef.current = elapsedSinceStart;
      startedAtRef.current = now;
      setElapsedSeconds(elapsedSinceStart);

      // Reconstruct a minimal SessionResponseData for the UI
      const recovered: SessionResponseData = {
        id: persisted.session_id,
        user_id: "",
        title: persisted.title,
        status: "ACTIVE",
        duration_seconds: 0,
        last_seen_at: persisted.last_heartbeat_server_time ?? new Date().toISOString(),
        created_at: persisted.started_at,
        updated_at: new Date().toISOString(),
      };

      setSession(recovered);
      setState("ACTIVE");
      startDisplayTimer();
      startHeartbeat(persisted.session_id, persisted.started_at);
    } else if (persisted.status === "PAUSED") {
      const startMs = new Date(persisted.started_at).getTime();
      const lastHeartbeatMs = persisted.last_heartbeat_server_time
        ? new Date(persisted.last_heartbeat_server_time).getTime()
        : Date.now();
      const totalPaused = persisted.total_paused_seconds || 0;
      totalPausedSecondsRef.current = totalPaused;

      // On pause, the total paused seconds so far DOES NOT include the current pause.
      // But we just use the accumulated active time up to the last heartbeat.
      const elapsedActive = Math.max(0, Math.floor((lastHeartbeatMs - startMs) / 1000) - totalPaused);
      
      activeElapsedRef.current = elapsedActive;
      setElapsedSeconds(elapsedActive);

      const recovered: SessionResponseData = {
        id: persisted.session_id,
        user_id: "",
        title: persisted.title,
        status: "PAUSED",
        duration_seconds: 0,
        last_seen_at: persisted.last_heartbeat_server_time ?? new Date().toISOString(),
        created_at: persisted.started_at,
        updated_at: new Date().toISOString(),
      };

      setSession(recovered);
      setState("PAUSED");
    } else {
      // COMPLETED / INTERRUPTED — clean up stale localStorage
      clearPersistedSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  const start = useCallback(
    async (title: string) => {
      if (state !== "IDLE" && state !== "ERROR") return;

      setErrorMessage(null);
      setState("REQUESTING");

      const clientSessionId = generateUUIDv4();

      try {
        const { data } = await apiStartSession({
          client_session_id: clientSessionId,
          title,
        });

        setSession(data);
        activeElapsedRef.current = 0;
        totalPausedSecondsRef.current = 0;
        startedAtRef.current = Date.now();
        persistSession(data, null, 0);

        setState("ACTIVE");
        startDisplayTimer();
        startHeartbeat(data.id, data.created_at);

        // Fire the first heartbeat immediately to transition PENDING → ACTIVE
        try {
          await apiSendHeartbeat(data.id);
        } catch {
          // Non-critical: the interval will retry in 30s
        }
      } catch (err) {
        if (err instanceof SessionApiError && err.code === "ACTIVE_SESSION_EXISTS") {
          setErrorMessage("You already have an active study session.");
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to start session.",
          );
        }
        setState("ERROR");
      }
    },
    [state, startDisplayTimer, startHeartbeat],
  );

  const pause = useCallback(async () => {
    if (state !== "ACTIVE" || !session) return;

    try {
      const res = await apiPauseSession(session.id);

      // Freeze timer
      const nowMs = Date.now();
      const runningSeconds = Math.floor((nowMs - startedAtRef.current) / 1000);
      activeElapsedRef.current = activeElapsedRef.current + Math.max(0, runningSeconds);
      stopDisplayTimer();
      stopHeartbeat();

      const updated = { ...session, status: "PAUSED" as const };
      setSession(updated);
      persistSession(updated, null, totalPausedSecondsRef.current);
      setState("PAUSED");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to pause session.",
      );
    }
  }, [state, session, stopDisplayTimer, stopHeartbeat]);

  const resume = useCallback(async () => {
    if (state !== "PAUSED" || !session) return;

    try {
      const res = await apiResumeSession(session.id);

      // Use the authoritative total_paused_seconds from the server
      const startMs = new Date(session.created_at).getTime();
      const serverNowMs = new Date(res.resumed_at).getTime();
      totalPausedSecondsRef.current = res.total_paused_seconds;
      activeElapsedRef.current = Math.max(0, Math.floor((serverNowMs - startMs) / 1000) - res.total_paused_seconds);

      const updated = { ...session, status: "ACTIVE" as const };
      setSession(updated);
      persistSession(updated, null, res.total_paused_seconds);

      setState("ACTIVE");
      startedAtRef.current = Date.now();
      startDisplayTimer();
      startHeartbeat(session.id, session.created_at);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to resume session.",
      );
    }
  }, [state, session, startDisplayTimer, startHeartbeat]);

  const end = useCallback(async () => {
    if (!session || (state !== "ACTIVE" && state !== "PAUSED")) return;

    setState("ENDING");
    stopDisplayTimer();
    stopHeartbeat();

    try {
      const result = await apiEndSession(session.id);
      setSummary(result);
      clearPersistedSession();
      setState("SUMMARY");
      setSession(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to end session.",
      );
      setState("ERROR");
    }
  }, [session, state, stopDisplayTimer, stopHeartbeat]);

  const dismiss = useCallback(() => {
    setSummary(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    activeElapsedRef.current = 0;
    totalPausedSecondsRef.current = 0;
    setState("IDLE");
  }, []);

  return {
    state,
    session,
    summary,
    elapsedSeconds,
    errorMessage,
    isOffline,
    heartbeatFailed,
    start,
    pause,
    resume,
    end,
    dismiss,
  };
}
