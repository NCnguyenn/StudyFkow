'use client';

import React from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { ChevronRight, FileText, FolderOpen, LayoutGrid } from 'lucide-react';

export const CanvasToolbar: React.FC = () => {
  const {
    activeNoteId,
    activeFolderId,
    notes,
    folders,
    setActiveNote,
    setActiveFolder,
    setCanvasViewMode
  } = useNoteStore();

  // Build breadcrumb segments
  const breadcrumbs = React.useMemo(() => {
    const crumbs: { label: string; icon: React.ReactNode; onClick: () => void }[] = [];

    // Root: Workspace
    crumbs.push({
      label: 'Workspace',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      onClick: () => {
        setActiveNote(null);
        setActiveFolder(null);
        setCanvasViewMode('bookshelf');
      }
    });

    // Active folder
    if (activeFolderId) {
      const folder = folders.find(f => f.id === activeFolderId);
      if (folder) {
        crumbs.push({
          label: folder.name,
          icon: <FolderOpen className="w-3.5 h-3.5" />,
          onClick: () => {
            setActiveNote(null);
            setCanvasViewMode('dashboard');
          }
        });
      }
    }

    // Active note
    if (activeNoteId) {
      const note = notes[activeNoteId];
      if (note) {
        crumbs.push({
          label: note.title || 'Untitled Note',
          icon: note.ui_metadata?.icon
            ? <span className="text-sm">{note.ui_metadata.icon}</span>
            : <FileText className="w-3.5 h-3.5" />,
          onClick: () => {} // Current item, no action
        });
      }
    }

    return crumbs;
  }, [activeNoteId, activeFolderId, notes, folders, setActiveNote, setActiveFolder, setCanvasViewMode]);

  return (
    <div className="canvas-toolbar sticky top-0 z-40 flex items-center justify-between h-12 px-6 border-b border-white/[0.08] backdrop-blur-xl bg-white/[0.04] shrink-0">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 min-w-0 flex-1">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <button
              onClick={crumb.onClick}
              disabled={idx === breadcrumbs.length - 1}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium truncate max-w-[200px] transition-colors ${
                idx === breadcrumbs.length - 1
                  ? 'text-slate-800 dark:text-slate-100 cursor-default'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer'
              }`}
            >
              {crumb.icon}
              <span className="truncate">{crumb.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};
