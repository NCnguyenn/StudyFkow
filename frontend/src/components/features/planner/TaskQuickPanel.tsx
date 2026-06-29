import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Circle, Pencil, Trash2, FileText, Plus, Loader2 } from 'lucide-react';
import TaskModal from '@/components/features/tasks/TaskModal';
import QuickToast from '@/components/room/QuickToast';

interface TaskQuickPanelProps {
  taskId: string;
}

export const TaskQuickPanel: React.FC<TaskQuickPanelProps> = ({ taskId }) => {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  const { notes, createNote } = useNoteStore();
  const { closeSplitView, openSplitView } = useAppStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Micro-animation state — short-lived, purely presentational
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  // Filter notes attached to this task — pure Zustand read, no fetch
  const attachedNotes = Object.values(notes).filter(n => n.task_ids?.includes(taskId));

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      closeSplitView();
    }
  };

  const toggleSubtask = (index: number) => {
    if (!task.subtasks) return;
    const wasCompleted = task.subtasks[index].is_completed;
    const newSubtasks = [...task.subtasks];
    newSubtasks[index] = {
      ...newSubtasks[index],
      is_completed: !newSubtasks[index].is_completed,
    };
    updateTask(task.id, { subtasks: newSubtasks });

    // Trigger micro-animation only on completion (not un-completion)
    if (!wasCompleted) {
      setAnimatingIndex(index);
      setShowToast(true);
      setTimeout(() => setAnimatingIndex(null), 500);
    }
  };

  const handleCreateNote = async () => {
    setIsCreatingNote(true);
    try {
      // Inherit both task_ids and subject_ids to maintain Graph integrity
      const newNoteId = await createNote(
        null,
        `Note for: ${task.title}`,
        [task.id],
        task.subject_id ? [task.subject_id] : [],
      );
      if (newNoteId) {
        const noteStore = useNoteStore.getState();
        const initialContent = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'smartTask',
                  attrs: { taskId: task.id, title: task.title, checked: task.task_status === 'COMPLETED' }
                }
              ]
            },
            {
              type: 'paragraph'
            }
          ]
        };
        noteStore.updateLocalNote(newNoteId, { content_json: initialContent });
        noteStore.syncNoteToServer(newNoteId, { content_json: initialContent });
        
        router.push(`/notes/${newNoteId}`);
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
                className={`flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl cursor-pointer transition-colors group ${animatingIndex === i ? 'task-complete-flash' : ''}`}
              >
                {st.is_completed ? (
                  <svg className={`w-5 h-5 shrink-0 ${animatingIndex === i ? 'task-check-draw' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" className="text-indigo-400" />
                    <path d="M8 12.5 L11 15.5 L16.5 9" className="text-indigo-400" />
                  </svg>
                ) : (
                  <Circle className="w-5 h-5 text-gray-500 group-hover:text-gray-400 shrink-0" />
                )}
                <span className={`text-sm ${st.is_completed ? `text-gray-500 line-through ${animatingIndex === i ? 'task-strike-sweep' : ''}` : 'text-gray-200'}`}>
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
        <TaskModal isOpen={isEditing} editTask={task as any} onClose={() => setIsEditing(false)} onSubmit={async (updated) => { await updateTask(task.id, updated); }} />
      )}

      {showToast && <QuickToast message="✅ Nice!" onDone={() => setShowToast(false)} />}
    </div>
  );
};
