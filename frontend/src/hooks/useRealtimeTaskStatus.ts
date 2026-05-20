import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TaskResponseData, TaskRealtimeStatus } from '../types/planner';

export interface RealtimeTaskComputed {
  taskId: string;
  realtimeStatus: TaskRealtimeStatus;
  borderColor: string;
}

const getStatusColor = (status: TaskRealtimeStatus): string => {
  switch (status) {
    case 'IDLE': return 'border-gray-300';
    case 'ACTIVE': return 'border-blue-500';
    case 'USING_OVERTIME': return 'border-yellow-500';
    case 'FAILED': return 'border-red-500';
    case 'COMPLETED': return 'border-green-500';
    default: return 'border-gray-200';
  }
};

/**
 * Highly optimized realtime hook to compute task states based on a ticking timer.
 * Minimizes unnecessary React re-renders by deeply memoizing dependencies.
 *
 * P1 FIX: `tasks` (an array reference) is removed from the setInterval dependency
 * array. Instead we use a stable string key derived from task IDs + statuses.
 * The interval only tears down and restarts when the actual task set changes,
 * not on every render that produces a new array reference.
 */
export const useRealtimeTaskStatus = (tasks: TaskResponseData[], tickIntervalMs: number = 60000) => {
  const [tick, setTick] = useState<number>(0);

  // Stable key: only changes when task IDs or their persisted statuses change.
  // This avoids restarting the interval on every parent re-render.
  const taskStabilityKey = useMemo(
    () => (tasks ?? []).map(t => `${t.id}:${t.task_status}`).join('|'),
    [tasks],
  );

  // Keep a ref so the interval callback always reads the latest tasks
  // without being listed as a dependency.
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  });

  useEffect(() => {
    if (!tasksRef.current || tasksRef.current.length === 0) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, tickIntervalMs);

    return () => clearInterval(interval);
    // tasksRef is intentionally excluded — the ref update above keeps it fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStabilityKey, tickIntervalMs]);

  // Pure calculation logic extracted into useCallback to avoid re-creation
  const calculateTaskStatus = useCallback((task: TaskResponseData, now: number): TaskRealtimeStatus => {
    // If the server explicitly marked it as finished, respect that over current time
    if (task.task_status === 'COMPLETED') return 'COMPLETED';
    if (task.task_status === 'FAILED') return 'FAILED';
    
    const startTime = new Date(task.planned_start).getTime();
    const endTime = new Date(task.planned_end).getTime();
    const overtimeMs = (task.overtime_buffer_minutes || 0) * 60 * 1000;
    const dropDeadTime = endTime + overtimeMs;

    if (now < startTime) {
      return 'IDLE';
    } else if (now >= startTime && now <= endTime) {
      return 'ACTIVE';
    } else if (now > endTime && now <= dropDeadTime) {
      return 'USING_OVERTIME';
    } else {
      return 'FAILED';
    }
  }, []);

  // Compute states mapping, strictly tied to dependencies
  const computedStatuses = useMemo(() => {
    const now = Date.now();
    const resultMap = new Map<string, RealtimeTaskComputed>();

    (tasks || []).forEach(task => {
      const status = calculateTaskStatus(task, now);
      resultMap.set(task.id, {
        taskId: task.id,
        realtimeStatus: status,
        borderColor: getStatusColor(status)
      });
    });

    return resultMap;
  }, [tasks, tick, calculateTaskStatus]);

  return computedStatuses;
};
