import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, TaskResponseData, SubjectAnalytics } from '../types/planner';
import { fetchWithAuth } from '../lib/api-utils'; // Using the centralized api-utils wrapper

interface SubjectState {
  subjects: Subject[];
  activeSubjectId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveSubject: (id: string | null) => void;
  fetchSubjects: () => Promise<void>;
  createSubject: (subjectData: Partial<Subject>) => Promise<Subject>;
  updateSubject: (subjectId: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
}

export const useSubjectStore = create<SubjectState>()(
  persist(
    (set, get) => ({
      subjects: [],
      activeSubjectId: null,
      isLoading: false,
      error: null,

      setActiveSubject: (id: string | null) => set({ activeSubjectId: id }),

      fetchSubjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetchWithAuth('/subjects'); 
          if (!response.ok) throw new Error('Failed to fetch subjects');
          const data = await response.json();
          set({ subjects: data, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch subjects', isLoading: false });
        }
      },

      createSubject: async (subjectData: Partial<Subject>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetchWithAuth('/subjects', {
            method: 'POST',
            body: JSON.stringify(subjectData)
          });
          if (!response.ok) throw new Error('Failed to create subject');
          const data = await response.json();
          set(state => ({
            subjects: [...state.subjects, data],
            isLoading: false
          }));
          return data;
        } catch (err: any) {
          set({ error: err.message || 'Failed to create subject', isLoading: false });
          throw err;
        }
      },

      updateSubject: async (subjectId: string, updates: Partial<Subject>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetchWithAuth(`/subjects/${subjectId}`, {
            method: 'PATCH', // Assumes PATCH or PUT is standard
            body: JSON.stringify(updates)
          });
          if (!response.ok) throw new Error('Failed to update subject');
          const updatedData = await response.json();
          set(state => ({
            subjects: state.subjects.map(s => s.id === subjectId ? { ...s, ...updatedData } : s),
            isLoading: false
          }));
        } catch (err: any) {
          set({ error: err.message || 'Failed to update subject', isLoading: false });
          throw err;
        }
      },

      deleteSubject: async (subjectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetchWithAuth(`/subjects/${subjectId}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete subject');
          set(state => ({
            subjects: state.subjects.filter(s => s.id !== subjectId),
            activeSubjectId: state.activeSubjectId === subjectId ? null : state.activeSubjectId,
            isLoading: false
          }));
        } catch (err: any) {
          set({ error: err.message || 'Failed to delete subject', isLoading: false });
          throw err;
        }
      }
    }),
    {
      name: 'subject-storage',
      partialize: (state) => ({ subjects: state.subjects, activeSubjectId: state.activeSubjectId }),
    }
  )
);

/**
 * Pure Derivation Function for Local Subject Analytics Calculation
 * Derives statistics instantly for UI display without requiring an API hit.
 */
export function computeSubjectAnalytics(subjectId: string, tasks: TaskResponseData[]): SubjectAnalytics {
  const subjectTasks = tasks.filter(t => t.subject_id === subjectId);
  let totalMinutes = 0;
  let completedCount = 0;
  let onTimeCount = 0;

  subjectTasks.forEach(task => {
    if (task.task_status === 'COMPLETED') {
      completedCount++;
      if (task.completion_status === 'ON_TIME') {
        onTimeCount++;
      }
      
      const start = new Date(task.planned_start).getTime();
      const end = new Date(task.planned_end).getTime();
      const durationMins = (end - start) / (1000 * 60);
      const overtime = task.overtime_buffer_minutes || 0;
      
      totalMinutes += (durationMins + overtime);
    }
  });

  const onTimeRate = completedCount > 0 ? (onTimeCount / completedCount) * 100 : 0;

  return {
    total_actual_minutes: Math.round(totalMinutes),
    on_time_completion_rate: Number(onTimeRate.toFixed(2)),
    total_closed_tasks: completedCount,
  };
}
