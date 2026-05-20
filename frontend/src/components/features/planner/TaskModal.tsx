import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { TaskResponseData } from '@/types/planner';
import { X, Plus, Trash2 } from 'lucide-react';

interface TaskModalProps {
  initialStart?: Date;
  initialEnd?: Date;
  editTask?: TaskResponseData;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ initialStart, initialEnd, editTask, onClose }) => {
  const { createTask, updateTask } = useTaskStore();
  const { subjects, fetchSubjects } = useSubjectStore();
  
  const [title, setTitle] = useState(editTask?.title || '');
  const [subjectId, setSubjectId] = useState(editTask?.subject_id || '');
  const [priority, setPriority] = useState(editTask?.priority || 2);
  const [overtimeBuffer, setOvertimeBuffer] = useState(editTask?.overtime_buffer_minutes || 30);
  const [subtasks, setSubtasks] = useState<{title: string; is_completed: boolean}[]>(
    editTask?.subtasks || []
  );
  const [newSubtask, setNewSubtask] = useState('');

  const start = editTask ? new Date(editTask.planned_start) : initialStart!;
  const end = editTask ? new Date(editTask.planned_end) : initialEnd!;

  const formatTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const [startTimeStr, setStartTimeStr] = useState(formatTime(start));
  const [endTimeStr, setEndTimeStr] = useState(formatTime(end));

  useEffect(() => {
    if (subjects.length === 0) fetchSubjects();
  }, [subjects, fetchSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const finalStart = new Date(start);
    const [startH, startM] = startTimeStr.split(':').map(Number);
    finalStart.setHours(startH, startM, 0, 0);

    const finalEnd = new Date(end);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    finalEnd.setHours(endH, endM, 0, 0);

    const payloadSubtasks = subtasks.map(st => ({
      id: (st as any).id || crypto.randomUUID(),
      title: st.title,
      is_completed: st.is_completed
    }));

    if (editTask) {
      await updateTask(editTask.id, {
        title,
        subject_id: subjectId || undefined,
        priority,
        planned_start: finalStart.toISOString(),
        planned_end: finalEnd.toISOString(),
        overtime_buffer_minutes: overtimeBuffer,
        subtasks: payloadSubtasks,
      });
    } else {
      await createTask({
        title,
        subject_id: subjectId || undefined,
        priority,
        planned_start: finalStart.toISOString(),
        planned_end: finalEnd.toISOString(),
        overtime_buffer_minutes: overtimeBuffer,
        subtasks: payloadSubtasks,
        task_status: 'PENDING'
      });
    }
    onClose();
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask.trim(), is_completed: false }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">{editTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Title *</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50" 
              placeholder="e.g., Read Chapter 4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Subject Link</label>
              <select 
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">None</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Start Time</label>
              <input 
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">End Time</label>
              <input 
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Buffer (mins)</label>
              <input 
                type="number"
                value={overtimeBuffer}
                onChange={(e) => setOvertimeBuffer(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Subtasks</label>
            <div className="flex gap-2 mb-2">
              <input 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50" 
                placeholder="Add step..."
              />
              <button type="button" onClick={addSubtask} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
              {subtasks.map((st, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-md px-3 py-1.5">
                  <span className="text-sm text-gray-300">{st.title}</span>
                  <button type="button" onClick={() => removeSubtask(i)} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
            {editTask ? 'Save Changes' : 'Schedule Task'}
          </button>
        </form>
      </div>
    </div>
  );
};
