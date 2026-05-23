/**
 * Task Management — API Client
 *
 * Thin HTTP layer for task CRUD endpoints.
 * Follows the same pattern as study_sessions/api/sessionApi.ts.
 *
 * Rules:
 *   - All calls include Authorization: Bearer <token> header.
 *   - The backend returns TaskResponse objects directly (no envelope).
 *   - Errors throw structured TaskApiError objects.
 */

import { fetchWithAuth } from "@/lib/api-utils";

// ─── Types ───────────────────────────────────────────────────────

export interface TaskResponseData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  color_code: string | null;
  planned_start: string; // ISO 8601
  planned_end: string;   // ISO 8601
  priority: number;
  status: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  category_id?: string;
  color_code?: string;
  planned_start: string; // ISO 8601 UTC
  planned_end: string;   // ISO 8601 UTC
  priority: number;
  status?: string;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  color_code?: string | null;
  planned_start?: string;
  planned_end?: string;
  priority?: number;
  status?: string;
}

// ─── Internals ───────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export class TaskApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "TaskApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();

  if (!res.ok) {
    const errorMessage = body?.detail ?? body?.message ?? res.statusText;
    throw new TaskApiError(res.status, `HTTP_${res.status}`, errorMessage);
  }

  return body as T;
}

// ─── API Functions ───────────────────────────────────────────────

/**
 * Fetch tasks for a specific date range (week view).
 * Both start_date and end_date must be ISO 8601 UTC strings.
 */
export async function fetchTasks(
  startDate: string,
  endDate: string,
): Promise<TaskResponseData[]> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const res = await fetchWithAuth(`/tasks?${params.toString()}`, {
    method: "GET",
  });

  return handleResponse<TaskResponseData[]>(res);
}

/**
 * Fetch a single task by ID.
 */
export async function getTaskById(taskId: string): Promise<TaskResponseData> {
  const res = await fetchWithAuth(`/tasks/${taskId}`, {
    method: "GET",
  });

  return handleResponse<TaskResponseData>(res);
}

/**
 * Create a new task.
 */
export async function createTask(
  payload: TaskCreatePayload,
): Promise<TaskResponseData> {
  const res = await fetchWithAuth("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse<TaskResponseData>(res);
}

/**
 * Update an existing task (partial update via PATCH).
 */
export async function updateTask(
  taskId: string,
  payload: TaskUpdatePayload,
): Promise<TaskResponseData> {
  const res = await fetchWithAuth(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return handleResponse<TaskResponseData>(res);
}

/**
 * Delete (soft-delete) a task by ID.
 */
export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetchWithAuth(`/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMessage = body?.detail ?? res.statusText;
    throw new TaskApiError(res.status, `HTTP_${res.status}`, errorMessage);
  }
}
