/**
 * Analytics — API Client
 *
 * Thin HTTP layer for GET /api/v1/analytics/summary.
 * Mirrors the AnalyticsSummary Pydantic schema from the backend.
 */

import { fetchWithAuth } from "@/lib/api-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

// ─── Types ────────────────────────────────────────────────────────

export interface DailyTrendPoint {
  date: string;    // "2026-05-11"
  minutes: number;
}

export interface TaskBreakdown {
  task_id: string | null;
  title: string;
  color_code: string | null;
  minutes: number;
}

export interface TaskMastery {
  on_time: number;
  late: number;
  incomplete: number;
}

export interface SubjectBalance {
  category_name: string;
  color_code: string;
  percentage: number;
}

export interface AnalyticsSummary {
  total_minutes_today: number;
  total_minutes_this_week: number;
  current_streak_days: number;
  total_sessions_completed: number;
  daily_trend: DailyTrendPoint[];
  task_breakdown: TaskBreakdown[];
  task_mastery: TaskMastery;
  subject_balance: SubjectBalance[];
}

// ─── Fetch ────────────────────────────────────────────────────────

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetchWithAuth("/analytics/summary", {
    method: "GET",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<AnalyticsSummary>;
}
