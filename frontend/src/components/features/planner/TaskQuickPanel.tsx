import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import { X, CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';
import { TaskModal } from './TaskModal';

interface TaskQuickPanelProps {
  taskId: string;
}

export const TaskQuickPanel: React.FC<TaskQuickPanelProps> = ({ taskId }) => {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const { closeSplitView } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id);
      closeSplitView();
    }
  };

  const toggleSubtask = (index: number) => {
    if (!task.subtasks) return;
    const newSubtasks = [...task.subtasks];
    newSubtasks[index] = { 
      ...newSubtasks[index], 
      is_completed: !newSubtasks[index].is_completed 
    };
    updateTask(task.id, { subtasks: newSubtasks });
  };

  return (
    <div className="h-full w-full backdrop-blur-2xl bg-black/20 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">{task.title}</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors" title="Edit Task">
            <Pencil className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-red-400 transition-colors" title="Delete Task">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={closeSplitView} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {task.description && (
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{task.description}</p>
        )}

        <h3 className="text-xs font-bold text-indigo-400/80 mb-3 tracking-[0.2em] uppercase">Checklist</h3>
        <div className="space-y-2 mb-8">
          {task.subtasks?.map((st, i) => (
            <div 
              key={i} 
              onClick={() => toggleSubtask(i)}
              className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl cursor-pointer transition-colors group"
            >
              {st.is_completed ? (
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500 group-hover:text-gray-400 shrink-0" />
              )}
              <span className={`text-sm ${st.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                {st.title}
              </span>
            </div>
          ))}
          {(!task.subtasks || task.subtasks.length === 0) && (
            <p className="text-xs text-gray-500 italic">No subtasks defined.</p>
          )}
        </div>
      </div>
      {isEditing && (
        <TaskModal editTask={task} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
};
