import React, { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { TaskResponseData } from '@/types/planner';
import { useRealtimeTaskStatus } from '@/hooks/useRealtimeTaskStatus';
import { ExternalLink, ListTodo } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface TaskBlockProps {
  task: TaskResponseData;
  styleParams: { top: number; height: number };
  onTaskFailed?: (taskId: string) => void;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ task, styleParams, onTaskFailed }) => {
  const { openSplitView } = useAppStore();
  
  const statusMap = useRealtimeTaskStatus([task]);
  const currentStatus = statusMap.get(task.id);
  const borderColor = currentStatus?.borderColor || 'border-gray-500';
  const realtimeStatus = currentStatus?.realtimeStatus;

  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    // Fire callback only on initial transition to FAILED state
    if (realtimeStatus === 'FAILED' && prevStatusRef.current !== 'FAILED' && prevStatusRef.current !== null) {
      onTaskFailed?.(task.id);
    }
    prevStatusRef.current = realtimeStatus || null;
  }, [realtimeStatus, task.id, onTaskFailed]);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style: React.CSSProperties = {
    top: `${styleParams.top}px`,
    height: `${styleParams.height}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: transform ? 50 : 10,
  };

  const priorityColor = task.priority === 3 ? 'text-red-400' : 
                        task.priority === 2 ? 'text-yellow-400' : 'text-blue-400';

  const pendingSubtasks = task.subtasks?.filter(st => !st.is_completed).length || 0;

  // Done-state detection: completed tasks get strike-through + reduced opacity
  const isDone = task.status === 'DONE' || task.status === 'COMPLETED';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute w-full px-1 py-1 cursor-grab active:cursor-grabbing ${isDone ? 'opacity-60' : ''}`}
    >
      <div 
        className={`h-full w-full rounded-md border-l-4 ${borderColor} p-2 flex flex-col shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative`}
        style={{ backgroundColor: task.color_code || '#e2e8f0' }}
      >
        {/* Push-pin icon — corkboard aesthetic */}
        <span className="absolute -top-0.5 right-1.5 text-[10px] select-none opacity-70 drop-shadow-sm" aria-hidden="true">📌</span>

        {/* Glass shimmer overlay */}
        <div className="absolute inset-0 rounded-md bg-white/10 pointer-events-none" />

        <div className="flex justify-between items-start gap-1 relative z-10">
          <span className={`text-xs font-semibold text-slate-900 truncate leading-tight ${isDone ? 'line-through decoration-slate-600' : ''}`}>{task.title}</span>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => openSplitView(task.id, task.title, null)}
            className="text-slate-600 hover:text-slate-900 transition-colors p-0.5 rounded-sm hover:bg-black/10 shrink-0 opacity-0 group-hover:opacity-100"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-auto pt-1 relative z-10">
          <span className={`text-[9px] font-bold tracking-wider text-slate-700`}>
             {task.priority === 3 ? 'HIGH' : task.priority === 2 ? 'MED' : 'LOW'}
          </span>
          {pendingSubtasks > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <ListTodo className="w-3 h-3" />
              {pendingSubtasks}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
