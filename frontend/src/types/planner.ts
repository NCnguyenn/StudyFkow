export type TaskRealtimeStatus = 'IDLE' | 'ACTIVE' | 'USING_OVERTIME' | 'FAILED' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CompletionStatus = 'ON_TIME' | 'LATE' | 'INCOMPLETE';

export interface SubjectAnalytics {
  total_actual_minutes: number;
  on_time_completion_rate: number;
  total_closed_tasks: number;
}

export interface Subject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface SubTask {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface TaskResponseData {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id?: string;
  subject_id?: string;
  subtasks?: SubTask[];
  recurrence_rule?: string;
  overtime_buffer_minutes?: number;
  color_code?: string;
  planned_start: string; // ISO datetime string
  planned_end: string;   // ISO datetime string
  priority: number;
  status: string;        // legacy column
  task_status: 'PENDING' | 'IN_PROGRESS' | 'USING_OVERTIME' | 'FAILED' | 'COMPLETED';
  failed_reason?: string;
  completion_status: CompletionStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
