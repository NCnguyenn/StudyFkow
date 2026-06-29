'use client';

import React, { useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { CanvasToolbar } from './CanvasToolbar';
import { NoteCardGrid } from './NoteCardGrid';
import { NoteDashboard } from './NoteDashboard';
import GlassCard from '@/components/room/GlassCard';

/* ── Lazy-load TiptapEditor (heavy dependency) ── */
const TiptapEditor = dynamic(
  () => import('./TiptapEditor').then(mod => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm text-slate-500 tracking-wide">Loading editor...</p>
      </div>
    )
  }
);

/* ── Loading Overlay ── */
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      <p className="text-sm text-slate-500 tracking-wide">Loading workspace...</p>
    </div>
  </div>
);

/* ── Note Editor Router ── */
const NoteEditorRouter: React.FC<{ noteId: string }> = ({ noteId }) => {
  return <TiptapEditor noteId={noteId} />;
};

/* ── Canvas View Router ── */
const CanvasViewRouter: React.FC<{
  isLoading: boolean;
  activeNoteId: string | null;
  activeFolderId: string | null;
}> = ({ isLoading, activeNoteId, activeFolderId }) => {
  const { setCanvasViewMode } = useNoteStore();

  useEffect(() => {
    if (activeNoteId) {
      setCanvasViewMode('editor');
    } else if (activeFolderId) {
      setCanvasViewMode('dashboard');
    } else {
      setCanvasViewMode('bookshelf');
    }
  }, [activeNoteId, activeFolderId, setCanvasViewMode]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (activeNoteId) {
    return <NoteEditorRouter noteId={activeNoteId} />;
  }

  if (activeFolderId) {
    return <NoteDashboard />;
  }

  return <NoteCardGrid />;
};

/* ── NoteCanvas (Master Wrapper) ── */
export const NoteCanvas: React.FC = () => {
  const { isLoading, activeNoteId, activeFolderId } = useNoteStore();

  return (
    <GlassCard hover={false} className="flex-1 relative overflow-hidden flex flex-col">
      {/* Toolbar: breadcrumb + view mode + actions */}
      <CanvasToolbar />

      {/* View Router: fills remaining space */}
      <div className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
        <CanvasViewRouter
          isLoading={isLoading}
          activeNoteId={activeNoteId}
          activeFolderId={activeFolderId}
        />
      </div>
    </GlassCard>
  );
};
