/**
 * useRealtimeEvents
 *
 * Mounts a persistent SSE connection to the backend `/api/v1/realtime/stream`
 * endpoint for the duration of the authenticated dashboard session.
 *
 * Design decisions:
 *  - Uses the browser's native EventSource API (no extra dependency).
 *  - JWT is passed as a query-parameter because EventSource cannot set headers.
 *  - The hook manages its own reconnection lifecycle: EventSource retries
 *    automatically on network drops. On unmount (logout / route change) it
 *    calls `.close()` to release the connection cleanly.
 *  - Parsing errors are caught per-message — a single bad frame never kills
 *    the stream.
 *  - Side-effects (store refresh, router actions) are dispatched via the
 *    Zustand store's static `getState()` accessor to avoid stale closures.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useNoteStore } from '@/store/useNoteStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';
const SSE_PATH = `${API_BASE}/realtime/stream`;
const TOKEN_KEY = 'studyflow_access_token';

// EventSource readyState constants
const ES_CLOSED = 2;

export function useRealtimeEvents(): void {
  // Use a ref so the cleanup function in useEffect always sees the latest
  // EventSource instance, even if the hook re-renders between mount and unmount.
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // SSR guard — EventSource is browser-only
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // Not authenticated yet — skip. The layout guard will redirect anyway.
      return;
    }

    const url = `${SSE_PATH}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // ── Connection opened ──────────────────────────────────────────────────
    es.onopen = () => {
      console.debug('[SSE] Connection established');
    };

    // ── Message handler ────────────────────────────────────────────────────
    es.onmessage = (event: MessageEvent) => {
      let data: Record<string, unknown>;

      // Parse defensively — a malformed frame should never crash the hook
      try {
        data = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        console.warn('[SSE] Received non-JSON frame, ignoring:', event.data);
        return;
      }

      const type = data.type as string | undefined;

      switch (type) {
        case 'ping':
          // Heartbeat — no action needed, just keeps the connection alive
          console.debug('[SSE] Heartbeat received');
          break;

        case 'VOICE_NOTE_READY': {
          const noteId = data.note_id as string;
          console.log('[SSE] Voice Note Ready:', noteId);
          // Refresh the notes workspace so the new note appears immediately
          // without the user needing to reload the page.
          useNoteStore.getState().fetchWorkspaceData();
          break;
        }

        default:
          console.debug('[SSE] Unhandled event type:', type, data);
      }
    };

    // ── Error / disconnection handler ──────────────────────────────────────
    es.onerror = (event) => {
      if (es.readyState === ES_CLOSED) {
        // The browser will attempt to reconnect automatically via SSE spec.
        // Log once so engineers can see reconnect cycles in devtools.
        console.warn('[SSE] Connection closed, browser will reconnect automatically');
      } else {
        console.error('[SSE] Stream error:', event);
      }
    };

    // ── Cleanup on unmount (logout, dashboard navigation away) ────────────
    return () => {
      console.debug('[SSE] Closing connection');
      es.close();
      esRef.current = null;
    };
  }, []); // Empty deps: mount once per dashboard session, token is read from localStorage
}
