import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useAppStore } from '@/store/useAppStore';
import { X, CheckCircle2, Circle, Pencil, Trash2, FileText, Plus, Loader2 } from 'lucide-react';
import TaskModal from '@/components/features/tasks/TaskModal';

interface TaskQuickPanelProps {
  taskId: string;
}

export const TaskQuickPanel: React.FC<TaskQuickPanelProps> = ({ taskId }) => {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const { notes, createNote } = useNoteStore();
  const { closeSplitView, openSplitView } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  // Filter notes attached to this task — pure Zustand read, no fetch
  const attachedNotes = Object.values(notes).filter(n => n.task_id === taskId);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      closeSplitView();
    }
  };

  const toggleSubtask = (index: number) => {
    if (!task.subtasks) return;
    const newSubtasks = [...task.subtasks];
    newSubtasks[index] = {
      ...newSubtasks[index],
      is_completed: !newSubtasks[index].is_completed,
    };
    updateTask(task.id, { subtasks: newSubtasks });
  };

  const handleCreateNote = async () => {
    setIsCreatingNote(true);
    try {
      // Inherit both task_id and subject_id to maintain Graph integrity
      const newNoteId = await createNote(
        null,
        `${task.title} — Notes`,
        task.id,
        task.subject_id ?? null,
      );
      if (newNoteId) {
        await openSplitView(task.id, task.title, newNoteId);
      }
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleOpenNote = async (noteId: string) => {
    await openSplitView(task.id, task.title, noteId);
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

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        {task.description && (
          <p className="text-gray-400 text-sm leading-relaxed">{task.description}</p>
        )}

        {/* ── Checklist ─────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-indigo-400/80 mb-3 tracking-[0.2em] uppercase">Checklist</h3>
          <div className="space-y-2">
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
        </section>

        {/* ── Attached Notes ────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-violet-400/80 mb-3 tracking-[0.2em] uppercase">Attached Notes</h3>
          <div className="space-y-1.5 mb-3">
            {attachedNotes.length === 0 && (
              <p className="text-xs text-gray-500 italic">No notes linked to this task yet.</p>
            )}
            {attachedNotes.map(note => (
              <button
                key={note.id}
                onClick={() => handleOpenNote(note.id)}
                className="w-full flex items-center gap-2.5 p-2.5 bg-white/[0.03] hover:bg-violet-500/10 border border-white/[0.05] hover:border-violet-500/30 rounded-xl transition-all group text-left"
              >
                <FileText className="w-4 h-4 text-violet-400/60 group-hover:text-violet-400 shrink-0 transition-colors" />
                <span className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                  {note.title || 'Untitled Note'}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNote}
            disabled={isCreatingNote}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/[0.08] text-violet-400 hover:text-violet-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingNote ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {isCreatingNote ? 'Creating…' : '+ Create Note for this Task'}
          </button>
        </section>
      </div>

      {isEditing && (
        <TaskModal isOpen={isEditing} editTask={task} onClose={() => setIsEditing(false)} onSubmit={async (updated) => { await updateTask(task.id, updated); }} />
      )}
    </div>
  );
};
