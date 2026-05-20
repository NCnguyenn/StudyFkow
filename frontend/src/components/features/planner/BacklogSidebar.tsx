import React, { useEffect, useState } from 'react';
import { useSubjectStore } from '@/store/useSubjectStore';
import { useTaskStore } from '@/store/useTaskStore';
import { SubjectCard } from './SubjectCard';
import { Calendar, Plus, X, Loader2, AlertCircle, FileText, Check } from 'lucide-react';
import { TaskPriority } from '@/types/planner';
import { useNoteStore } from '@/store/useNoteStore';

const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', 
  '#BAE1FF', '#E6B3FF', '#FFC8E3', '#D4F0F0', 
  '#E1E8EB', '#F3FFE3', '#FFE3D8', '#E3D8FF'
];

export const BacklogSidebar: React.FC = () => {
  const { subjects, activeSubjectId, isLoading, error, fetchSubjects, setActiveSubject, createSubject, updateSubject, deleteSubject } = useSubjectStore();
  const { tasks } = useTaskStore();
  const { createNote } = useNoteStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [newColor, setNewColor] = useState(PASTEL_COLORS[4]); // Default to Pastel Blue
  const [attachNote, setAttachNote] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      const payload: any = { 
        title: newTitle, 
        priority: newPriority, 
        description: newDescription, 
        color: newColor 
      };
      
      if (editingSubjectId) {
        await updateSubject(editingSubjectId, payload);
      } else {
        const createdSubject = await createSubject(payload);
        if (attachNote && createdSubject?.id) {
          createNote(null, `${newTitle} Notes`);
        }
      }

      setNewTitle('');
      setNewDescription('');
      setNewPriority('MEDIUM');
      setNewColor(PASTEL_COLORS[4]);
      setAttachNote(false);
      setIsAdding(false);
      setEditingSubjectId(null);
    } catch (err) {
      console.error('Failed to save subject:', err);
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubjectId(subject.id);
    setNewTitle(subject.title);
    setNewDescription(subject.description || '');
    setNewPriority(subject.priority);
    setNewColor(subject.color || PASTEL_COLORS[4]);
    setIsAdding(true);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (window.confirm("Are you sure you want to delete this Subject? Linked tasks might be affected.")) {
      await deleteSubject(subjectId);
    }
  };

  const toggleAdding = () => {
    setIsAdding(!isAdding);
    if (isAdding) setEditingSubjectId(null); // Reset on close
  };

  return (
    <aside className="w-80 h-full flex flex-col border-r border-white/60 bg-white/50 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-white/60 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 tracking-wide">Strategic Backlog</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/60 transition-colors text-slate-500 hover:text-slate-800">
            <Calendar className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleAdding}
            className="p-2 rounded-lg bg-white/40 hover:bg-white/80 transition-colors text-slate-700 border border-white/80 shadow-sm"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-600 shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Add Subject Inline Form */}
      {isAdding && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm">
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Subject Title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-colors"
            />
            
            <textarea
              placeholder="Description (optional)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="bg-white/50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-colors resize-none h-16"
            />

            {/* Color Selector */}
            <div className="flex items-center gap-1.5 py-1 flex-wrap">
              {PASTEL_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c, border: newColor === c ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.1)' }}
                >
                  {newColor === c && <Check className="w-3 h-3 text-indigo-700 opacity-70" />}
                </button>
              ))}
              <div className="w-px h-5 bg-slate-300 mx-1"></div>
              <label 
                className="relative flex items-center justify-center w-6 h-6 rounded-full cursor-pointer border shadow-sm transition-transform hover:scale-110 overflow-hidden" 
                style={{ backgroundColor: newColor, borderColor: newColor === PASTEL_COLORS.find(p => p===newColor) ? 'rgba(0,0,0,0.1)' : '#6366f1' }}
                title="Custom Color"
              >
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="absolute inset-0 w-10 h-10 -top-2 -left-2 cursor-pointer opacity-0"
                />
              </label>
            </div>

            {/* Connect Note Toggle */}
            <button
              type="button"
              onClick={() => setAttachNote(!attachNote)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                attachNote 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white/80 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{attachNote ? 'Connected Note included' : 'Add connected Note'}</span>
            </button>

            <div className="flex items-center justify-between mt-1">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="bg-white/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              
              <button 
                type="submit"
                disabled={isLoading || !newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px] shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingSubjectId ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subject List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading && (!subjects || subjects.length === 0) ? (
          // Skeleton Loader
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl bg-white/40 animate-pulse border border-white/60" />
            ))}
          </div>
        ) : (!subjects || subjects.length === 0) && !isAdding ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center px-4">
            <p>No subjects found.</p>
            <p className="mt-1">Click the + icon to create your first strategic subject.</p>
          </div>
        ) : (
          // Subject Cards
          (subjects || []).map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              tasks={tasks.filter(t => t.subject_id === subject.id)}
              isActive={activeSubjectId === subject.id}
              onClick={() => setActiveSubject(subject.id)}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
            />
          ))
        )}
      </div>
    </aside>
  );
};
