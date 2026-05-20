/**
 * study_sessions — Frontend Public Contract
 *
 * Only these exports are available to other features and pages.
 * Internal hooks, API clients, and types are NOT part of the public surface.
 */

export { FocusSessionManager } from "./components/FocusSessionManager";
export { useStudySession } from "./hooks/useStudySession";
export type { UseStudySessionReturn } from "./hooks/useStudySession";
export type { FrontendSessionState } from "./types";
