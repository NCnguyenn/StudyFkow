import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import { TaskBlock } from './TaskBlock';
import { TaskResponseData } from '@/types/planner';
import { useTaskStore } from '@/store/useTaskStore';
import { useShallow } from 'zustand/react/shallow';
import { getWeekDays } from '@/lib/calendar-utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

// ---------------------------------------------------------------------------
// P2: Overlap layout algorithm
// Returns each task augmented with { column, totalColumns } for side-by-side
// rendering within the same day column.
// ---------------------------------------------------------------------------
interface OverlapLayoutItem {
  task: TaskResponseData;
  column: number;
  totalColumns: number;
}

function computeOverlapLayout(tasks: TaskResponseData[]): OverlapLayoutItem[] {
  if (tasks.length === 0) return [];

  // 1. Sort ascending by start time
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()
  );

  // 2. Greedy column assignment
  // Each slot tracks the end time of the last task assigned to it.
  const slotEndTimes: number[] = [];
  const taskColumns: number[] = [];

  for (const task of sorted) {
    const taskStart = new Date(task.planned_start).getTime();
    const taskEnd = new Date(task.planned_end).getTime();

    // Find the first slot whose last task already ended
    let assigned = -1;
    for (let i = 0; i < slotEndTimes.length; i++) {
      if (slotEndTimes[i] <= taskStart) {
        assigned = i;
        break;
      }
    }

    if (assigned === -1) {
      // No free slot — open a new column
      assigned = slotEndTimes.length;
      slotEndTimes.push(taskEnd);
    } else {
      slotEndTimes[assigned] = taskEnd;
    }

    taskColumns.push(assigned);
  }

  const totalColumns = slotEndTimes.length;

  // 3. Second pass: determine effective totalColumns per *overlap group*
  // For simplicity (and correctness for the greedy case) we use the global
  // max column count for tasks that share time with at least one neighbour.
  // We can refine per-group, but the global max is safe and simple.
  return sorted.map((task, i) => ({
    task,
    column: taskColumns[i],
    totalColumns,
  }));
}

interface DayColumnProps {
  dayStr: string;
  isToday: boolean;
  nowTop: number;
  onSlotClick: (hour: number, minutes: number, dayStr: string) => void;
  children: React.ReactNode;
}

const DayColumn: React.FC<DayColumnProps> = ({ dayStr, isToday, nowTop, onSlotClick, children }) => {
  const { setNodeRef } = useDroppable({ id: dayStr });

  const handleColumnClick = (e: React.MouseEvent) => {
    // Only capture clicks on the empty slot area, not inside TaskBlocks
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const hour = Math.floor(y / HOUR_HEIGHT);
    const minutes = Math.floor((y % HOUR_HEIGHT) / (HOUR_HEIGHT / 60));
    const snapMinutes = Math.floor(minutes / 15) * 15; // 15 min intervals

    onSlotClick(hour, snapMinutes, dayStr);
  };

  return (
    <div ref={setNodeRef} onClick={handleColumnClick} className="relative border-l border-slate-200 min-h-full cursor-pointer hover:bg-slate-500/5 transition-colors">
      {isToday && (
        <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${nowTop}px` }}>
          <div className="h-[2px] bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] relative">
            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

interface CalendarGridProps {
  baseDate: Date;
  onTaskMove?: (taskId: string, newStart: string, newEnd: string) => void;
  onEmptySlotClick?: (start: Date, end: Date) => void;
  onTaskFailed?: (taskId: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ baseDate, onTaskMove, onEmptySlotClick, onTaskFailed }) => {
  const tasks = useTaskStore(useShallow(state => state.tasks));
  const weekDays = React.useMemo(() => getWeekDays(baseDate), [baseDate]);
  const [nowTop, setNowTop] = useState(0);

  const layoutItemsByDay = React.useMemo(() => {
    const map = new Map<string, OverlapLayoutItem[]>();
    for (const day of weekDays) {
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      const dayStr = `${yyyy}-${mm}-${dd}`;
      const dayTasks = tasks.filter(t => t.planned_start.startsWith(dayStr));
      map.set(dayStr, computeOverlapLayout(dayTasks));
    }
    return map;
  }, [tasks, weekDays]);

  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date();
      const top = (now.getHours() * HOUR_HEIGHT) + ((now.getMinutes() / 60) * HOUR_HEIGHT);
      setNowTop(top);
    };

    updateNowLine();
    const interval = setInterval(updateNowLine, 60000);
    return () => clearInterval(interval);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;
    if (!over || !active) return;

    const task = active.data.current?.task as TaskResponseData;
    if (!task) return;

    const start = new Date(task.planned_start);
    const end = new Date(task.planned_end);
    const durationMs = end.getTime() - start.getTime();

    const minutesShift = Math.round(delta.y);

    const newDateStr = over.id as string;
    const [year, month, date] = newDateStr.split('-').map(Number);

    const newStart = new Date(year, month - 1, date, start.getHours(), start.getMinutes() + minutesShift);
    const newEnd = new Date(newStart.getTime() + durationMs);

    if (onTaskMove) {
      onTaskMove(task.id, newStart.toISOString(), newEnd.toISOString());
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  };

  const handleSlotClick = (hour: number, minutes: number, dayStr: string) => {
    if (!onEmptySlotClick) return;
    const [year, month, date] = dayStr.split('-').map(Number);
    const start = new Date(year, month - 1, date, hour, minutes);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hr default
    onEmptySlotClick(start, end);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-white/30 backdrop-blur-md overflow-hidden text-slate-800">
        <div className="grid grid-cols-7 border-b border-slate-200 ml-16">
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 text-center border-l border-slate-200 ${isToday(day) ? 'bg-blue-500/5' : ''}`}>
              <div className="text-xs text-slate-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-500' : 'text-slate-700'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
            <div className="w-16 flex flex-col border-r border-slate-200 sticky left-0 bg-white/60 backdrop-blur-md z-20">
              {HOURS.map(hour => (
                <div key={hour} className="text-xs text-slate-500 pr-2 text-right relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                  <span className="absolute -top-2 right-2 bg-white/70 shadow-sm border border-slate-100 px-1 rounded">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 relative">
              <div className="absolute inset-0 pointer-events-none">
                {HOURS.map(hour => (
                  <div key={hour} className="border-t border-slate-200 w-full" style={{ height: `${HOUR_HEIGHT}px` }} />
                ))}
              </div>

              {weekDays.map((day, colIndex) => {
                const yyyy = day.getFullYear();
                const mm = String(day.getMonth() + 1).padStart(2, '0');
                const dd = String(day.getDate()).padStart(2, '0');
                const dayStr = `${yyyy}-${mm}-${dd}`;

                const layoutItems = layoutItemsByDay.get(dayStr) || [];

                return (
                  <DayColumn key={colIndex} dayStr={dayStr} isToday={isToday(day)} nowTop={nowTop} onSlotClick={handleSlotClick}>
                    {layoutItems.map(({ task, column, totalColumns }) => {
                      const start = new Date(task.planned_start);
                      const end = new Date(task.planned_end);
                      const startHours = start.getHours() + start.getMinutes() / 60;
                      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                      const top = startHours * HOUR_HEIGHT;
                      const height = Math.max(durationHours * HOUR_HEIGHT, 20);

                      // Overlap positioning: divide column width, offset by column index
                      // Add a 2px gap between adjacent tasks via a small inset
                      const widthPct = 100 / totalColumns;
                      const leftPct = (column / totalColumns) * 100;

                      return (
                        // Wrapper div handles the overlap geometry; TaskBlock signature unchanged
                        <div
                          key={task.id}
                          className="absolute pr-0.5"
                          style={{
                            top,
                            height,
                            width: `${widthPct}%`,
                            left: `${leftPct}%`,
                          }}
                        >
                          <TaskBlock
                            task={task}
                            styleParams={{ top: 0, height }}
                            onTaskFailed={onTaskFailed}
                          />
                        </div>
                      );
                    })}
                  </DayColumn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

