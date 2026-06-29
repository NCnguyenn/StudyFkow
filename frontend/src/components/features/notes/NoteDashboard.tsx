'use client';

import React, { useState, useMemo } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { FileText, Plus, Trash2, ArrowLeft } from 'lucide-react';

export const NoteDashboard: React.FC = () => {
  const {
    folders,
    notes,
    activeFolderId,
    setActiveFolder,
    setActiveNote,
    createFolder,
    createNote,
    renameFolder,
    deleteFolder,
    deleteNote
  } = useNoteStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const currentFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);
  const parentFolder = useMemo(() => {
    if (!currentFolder?.parent_id) return null;
    return folders.find(f => f.id === currentFolder.parent_id);
  }, [folders, currentFolder]);

  const subCovers = useMemo(() =>
    folders.filter(f => f.parent_id === activeFolderId).sort((a, b) => a.name.localeCompare(b.name)),
    [folders, activeFolderId]
  );

  const writingPages = useMemo(() => {
    return Object.values(notes).filter(n => n.folder_id === activeFolderId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [notes, activeFolderId]);

  if (!currentFolder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-medium">Folder not found.</p>
        <button onClick={() => setActiveFolder(null)} className="mt-4 px-4 py-2 bg-indigo-600 text-xs text-white rounded-lg cursor-pointer">
          Back to Workspace
        </button>
      </div>
    );
  }

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim() && titleInput.trim() !== currentFolder.name) {
      renameFolder(currentFolder.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const startEditingTitle = () => {
    setTitleInput(currentFolder.name);
    setIsEditingTitle(true);
  };

  const handleCreateSubCover = () => {
    createFolder("Untitled Sub-cover", currentFolder.id);
  };

  const handleCreatePage = async () => {
    const newNoteId = await createNote(currentFolder.id, "Untitled Page");
    if (newNoteId) {
      setActiveNote(newNoteId);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Back Button */}
      <div>
        <button
          onClick={() => setActiveFolder(currentFolder.parent_id)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {parentFolder ? parentFolder.name : 'Back to Workspace'}
        </button>
      </div>

      {/* Folder Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl select-none">{currentFolder.ui_metadata?.icon || '📁'}</span>
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex-1">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              className="text-2xl font-bold bg-transparent border-b border-indigo-500 focus:outline-none w-full text-slate-800 dark:text-white"
              autoFocus
            />
          </form>
        ) : (
          <h1
            onClick={startEditingTitle}
            className="text-2xl font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 px-2 py-0.5 rounded-lg transition-colors"
          >
            {currentFolder.name}
          </h1>
        )}
      </div>

      {/* Grid containing Sub-covers & Writing Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Sub Covers column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sub-covers</h2>
            <button
              onClick={handleCreateSubCover}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> New Sub-cover
            </button>
          </div>

          <div className="space-y-2">
            {subCovers.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No sub-covers created yet.</p>
            ) : (
              subCovers.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => setActiveFolder(sub.id)}
                  className="flex items-center justify-between p-3 room-glass border-l-[3px] rounded-xl cursor-pointer hover:border-indigo-500/50 transition-all group"
                  style={{ borderLeftColor: 'var(--sf-room-accent-lavender)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{sub.ui_metadata?.icon || '📁'}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{sub.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${sub.name}"?`)) deleteFolder(sub.id);
                    }}
                    className="p-1 text-slate-450 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Writing Pages column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Writing Pages</h2>
            <button
              onClick={handleCreatePage}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> New Page
            </button>
          </div>

          <div className="space-y-2">
            {writingPages.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No pages created yet.</p>
            ) : (
              writingPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => setActiveNote(page.id)}
                  className="flex items-center justify-between p-3 room-glass border-l-[3px] rounded-xl cursor-pointer hover:border-indigo-500/50 transition-all group"
                  style={{ borderLeftColor: 'var(--sf-room-accent-mint)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-550" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{page.title || 'Untitled Page'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${page.title}"?`)) deleteNote(page.id);
                    }}
                    className="p-1 text-slate-450 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
