'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import {
  Link2, Unlink, FileDown, FileText, BookOpen, ChevronDown
} from 'lucide-react';

interface EditorHeaderProps {
  noteId: string;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ noteId }) => {
  const { notes, updateLocalNote, syncNoteToServer, exportNoteToLocal, localDirHandle } = useNoteStore();
  const { tasks } = useTaskStore();
  const { subjects } = useSubjectStore();
  const note = notes[noteId];

  const [title, setTitle] = useState(note?.title || '');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    setTitle(note?.title || '');
  }, [noteId, note?.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateLocalNote(noteId, { title: newTitle });
    syncNoteToServer(noteId, { title: newTitle });
  };

  const linkedTask = useMemo(() => tasks.find(t => t.id === note?.task_id), [tasks, note?.task_id]);
  const linkedSubject = useMemo(() => subjects.find(s => s.id === note?.subject_id), [subjects, note?.subject_id]);

  const handleLinkTask = (taskId: string | null) => {
    updateLocalNote(noteId, { task_id: taskId });
    syncNoteToServer(noteId, { task_id: taskId });
    setShowTaskDropdown(false);
  };

  const handleLinkSubject = (subjectId: string | null) => {
    updateLocalNote(noteId, { subject_id: subjectId });
    syncNoteToServer(noteId, { subject_id: subjectId });
    setShowSubjectDropdown(false);
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    const md = `# ${note.title}\n\nExported from AI StudyFlow`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.title || 'Untitled').replace(/[<>:"/\\|?*]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!note) return null;

  return (
    <div className="px-6 py-4 border-b border-slate-200 bg-white/60 backdrop-blur-xl shrink-0 relative z-[60]">
      {/* Title Row */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled Note"
        className="w-full text-2xl lg:text-3xl font-bold bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none mb-3"
      />

      {/* Metadata Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Link to Task (Optional) */}
        <div className="relative z-[100]">
          <button
            onClick={() => setShowTaskDropdown(!showTaskDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors ${
              note.task_id
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-white/70 border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {linkedTask ? linkedTask.title : 'Link to Task'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTaskDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 glass-card shadow-xl border border-slate-200 rounded-xl p-1 z-[100] max-h-48 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => handleLinkTask(null)}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 text-slate-400 flex items-center gap-2"
              >
                <Unlink className="w-3 h-3" /> None (Unlink)
              </button>
              {tasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleLinkTask(t.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 transition-colors ${note.task_id === t.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'}`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link to Subject (Optional) */}
        <div className="relative z-[100]">
          <button
            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors ${
              note.subject_id
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-white/70 border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {linkedSubject ? linkedSubject.title : 'Link to Subject'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSubjectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-52 glass-card shadow-xl border border-slate-200 rounded-xl p-1 z-[100] max-h-48 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => handleLinkSubject(null)}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 text-slate-400 flex items-center gap-2"
              >
                <Unlink className="w-3 h-3" /> None (Unlink)
              </button>
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleLinkSubject(s.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 transition-colors ${note.subject_id === s.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-700'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export Buttons */}
        <button
          onClick={handleExportMarkdown}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          title="Export as Markdown"
        >
          <FileDown className="w-3.5 h-3.5" />
          .md
        </button>

        {localDirHandle && (
          <button
            onClick={() => exportNoteToLocal(noteId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            title="Save to local folder"
          >
            <FileText className="w-3.5 h-3.5" />
            Save Local
          </button>
        )}
      </div>
    </div>
  );
};
