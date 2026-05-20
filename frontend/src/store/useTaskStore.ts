import { create } from 'zustand';
import { TaskResponseData } from '../types/planner';
import { fetchWithAuth } from '../lib/api-utils';

interface TaskState {
  tasks: TaskResponseData[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (startDate: string, endDate: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  moveTask: (taskId: string, newStart: string, newEnd: string) => Promise<void>;
  updateTaskState: (taskId: string, newStatus: string, failedReason?: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskResponseData>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  rolloverTask: (taskId: string, targetDate: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`[TaskStore] Fetching tasks from ${startDate} to ${endDate}`);
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const response = await fetchWithAuth(`/tasks?${params.toString()}`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }
      const data = (await response.json()) as TaskResponseData[];
      console.log(`[TaskStore] Fetched ${data.length} tasks successfully.`);
      set({ tasks: data, isLoading: false });
    } catch (err: any) {
      console.error('[TaskStore] fetchTasks error:', err);
      set({ error: err.message || 'Error fetching tasks', isLoading: false });
    }
  },

  createTask: async (taskData: any) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[TaskStore] Creating task:', taskData);
      const response = await fetchWithAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }
      const newTask = (await response.json()) as TaskResponseData;
      set(state => ({ tasks: [...state.tasks, newTask], isLoading: false }));
    } catch (err: any) {
      console.error('[TaskStore] createTask error:', err);
      set({ error: err.message || 'Error creating task', isLoading: false });
      throw err;
    }
  },

  moveTask: async (taskId: string, newStart: string, newEnd: string) => {
    const { tasks } = get();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const originalTask = { ...tasks[taskIndex] };
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...originalTask, planned_start: newStart, planned_end: newEnd };
    set({ tasks: updatedTasks });

    try {
      console.log(`[TaskStore] Moving task ${taskId} to ${newStart} - ${newEnd}`);
      const response = await fetchWithAuth(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ planned_start: newStart, planned_end: newEnd })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }
    } catch (err: any) {
      console.error('[TaskStore] Optimistic UI Rollback on moveTask:', err);
      const currentTasks = [...get().tasks];
      const revertIndex = currentTasks.findIndex(t => t.id === taskId);
      if (revertIndex !== -1) {
        currentTasks[revertIndex] = originalTask;
        set({ tasks: currentTasks, error: 'Failed to save move. Reverted.' });
      }
    }
  },

  updateTaskState: async (taskId: string, newStatus: string, failedReason?: string) => {
    try {
      const response = await fetchWithAuth(`/tasks/${taskId}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ task_status: newStatus, failed_reason: failedReason })
      });
      if (!response.ok) throw new Error('Failed to update state');
      const updatedTask = (await response.json()) as TaskResponseData;
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateTask: async (taskId: string, updates: Partial<TaskResponseData>) => {
    const { tasks } = get();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const originalTask = { ...tasks[taskIndex] };
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...originalTask, ...updates };
    set({ tasks: updatedTasks });

    try {
      const response = await fetchWithAuth(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('API failed to update task');
      const confirmedTask = (await response.json()) as TaskResponseData;
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? confirmedTask : t)
      }));
    } catch (err: any) {
      console.error('Optimistic UI Rollback:', err);
      const currentTasks = [...get().tasks];
      const revertIndex = currentTasks.findIndex(t => t.id === taskId);
      if (revertIndex !== -1) {
        currentTasks[revertIndex] = originalTask;
        set({ tasks: currentTasks, error: 'Failed to save task update. Reverted.' });
      }
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const response = await fetchWithAuth(`/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('API failed to delete task');
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      set({ error: err.message || 'Error deleting task' });
      throw err;
    }
  },

  rolloverTask: async (taskId: string, targetDate: string) => {
    try {
      const response = await fetchWithAuth(`/tasks/${taskId}/rollover`, {
        method: 'POST',
        body: JSON.stringify({ target_date: targetDate })
      });
      if (!response.ok) throw new Error('Failed to rollover task');
      const newTask = (await response.json()) as TaskResponseData;
      
      // Update original task to failed (visually) and append the new task
      set(state => ({
        tasks: state.tasks.map(t => {
          if (t.id === taskId) return { ...t, task_status: 'FAILED' as const };
          return t;
        }).concat(newTask)
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  }
}));
