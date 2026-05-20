"use client";

import React, { useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { WorkspaceSidebar } from '@/components/features/notes/WorkspaceSidebar';
import dynamic from 'next/dynamic';
import { Loader2, FileText } from 'lucide-react';

const TiptapEditor = dynamic(
  () => import('@/components/features/notes/TiptapEditor').then(mod => mod.TiptapEditor),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center bg-white/30 backdrop-blur-md">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm text-slate-500 tracking-wide">Loading editor...</p>
      </div>
    )
  }
);

export default function NotesPage() {
  const { isLoading, fetchWorkspaceData, activeNoteId } = useNoteStore();

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  return (
    <div className="flex h-full w-full text-slate-800 overflow-hidden">
      
      {/* Workspace Sidebar (Recursive Tree) */}
      <WorkspaceSidebar />

      {/* Main Editor Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-500 tracking-wide">Loading workspace...</p>
            </div>
          </div>
        ) : activeNoteId ? (
          <TiptapEditor noteId={activeNoteId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2 text-slate-500">No Note Selected</h3>
            <p className="text-sm text-slate-400">Select a note from the sidebar or create a new one.</p>
          </div>
        )}
      </main>

    </div>
  );
}
