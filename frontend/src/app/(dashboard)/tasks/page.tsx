"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import { BacklogSidebar } from '@/components/features/planner/BacklogSidebar';
import { CalendarGrid } from '@/components/features/planner/CalendarGrid';
import TaskModal from '@/components/features/tasks/TaskModal';
import { RolloverPopup } from '@/components/features/planner/RolloverPopup';
import { TaskQuickPanel } from '@/components/features/planner/TaskQuickPanel';
import { TiptapEditor } from '@/components/features/notes/TiptapEditor';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function PlannerPage() {
  const { tasks, isLoading, fetchTasks, moveTask, createTask } = useTaskStore();
  const { isSplitViewOpen, splitViewTaskId, splitViewNoteId } = useAppStore();

  const [modalTimes, setModalTimes] = useState<{start: Date, end: Date} | null>(null);
  const [failedTaskId, setFailedTaskId] = useState<string | null>(null);

  const [baseDate, setBaseDate] = useState<Date>(new Date());
  
  const { startStr, endStr } = useMemo(() => {
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    return { 
      startStr: startOfWeek.toISOString(), 
      endStr: endOfWeek.toISOString() 
    };
  }, [baseDate]);

  useEffect(() => {
    fetchTasks(startStr, endStr).catch(err => {
      console.error("fetchTasks Error:", err);
    });
  }, [fetchTasks, startStr, endStr]);

  const handlePrevWeek = () => {
    setBaseDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setBaseDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setBaseDate(new Date(e.target.value));
    }
  };

  const handleEmptySlotClick = (start: Date, end: Date) => {
    setModalTimes({ start, end });
  };

  const handleTaskFailed = (taskId: string) => {
    setFailedTaskId(taskId);
  };

  const failedTask = useMemo(() => tasks.find(t => t.id === failedTaskId), [tasks, failedTaskId]);

  return (
    <div className="flex flex-row h-screen w-full text-slate-800 overflow-hidden">
      <BacklogSidebar />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {isLoading && tasks.length === 0 ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-500 tracking-wide">Syncing your master schedule...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative flex overflow-hidden">
            <div className={`transition-all duration-500 ease-in-out w-full h-full shrink-0 flex flex-col ${isSplitViewOpen ? '-ml-[100%]' : 'ml-0'}`}>
              
              {/* Calendar Header / Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 glass-panel shrink-0 z-10 relative">
                <div className="flex items-center gap-2">
                  <button onClick={handleToday} className="px-3 py-1.5 rounded-lg glass-card hover:bg-white/80 text-sm font-medium text-slate-700 transition-colors">
                    Today
                  </button>
                  <div className="flex items-center bg-white/50 rounded-lg p-0.5 border border-white/60">
                    <button onClick={handlePrevWeek} className="p-1.5 rounded-md hover:bg-white/60 text-slate-600 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={handleNextWeek} className="p-1.5 rounded-md hover:bg-white/60 text-slate-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-800 tracking-wide">
                    {baseDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="relative flex items-center">
                    <CalendarIcon className="w-5 h-5 text-slate-500 absolute left-2 pointer-events-none" />
                    <input 
                      type="date" 
                      onChange={handleDateChange} 
                      className="pl-8 pr-2 py-1.5 rounded-lg glass-input text-sm cursor-pointer"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <CalendarGrid 
                  baseDate={baseDate}
                  onTaskMove={moveTask} 
                  onEmptySlotClick={handleEmptySlotClick}
                  onTaskFailed={handleTaskFailed}
                />
              </div>
            </div>
            
            {/* Split View Content sliding in from right */}
            <div className={`absolute inset-0 flex transition-transform duration-500 ease-in-out ${isSplitViewOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="w-1/2 h-full glass-sidebar">
                {splitViewTaskId && <TaskQuickPanel taskId={splitViewTaskId} />}
              </div>
              <div className="w-1/2 h-full border-l border-white/60">
                {splitViewNoteId ? (
                   <TiptapEditor noteId={splitViewNoteId} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                     <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                     <p className="text-sm text-slate-500">Generating connected note...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {modalTimes && (
        <TaskModal 
          isOpen={!!modalTimes}
          initialStart={modalTimes.start} 
          initialEnd={modalTimes.end} 
          onClose={() => setModalTimes(null)} 
          onSubmit={createTask}
        />
      )}

      {failedTaskId && failedTask && (
        <RolloverPopup 
          task={failedTask}
          onClose={() => setFailedTaskId(null)}
        />
      )}
    </div>
  );
}