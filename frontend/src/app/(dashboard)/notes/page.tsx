"use client";

import React, { useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { NoteCanvas } from '@/components/features/notes/NoteCanvas';
import { useNoteKeyboardShortcuts } from '@/hooks/useNoteKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/features/notes/KeyboardShortcutsModal';

export default function NotesPage() {
  const { fetchWorkspaceData, toggleSidebar } = useNoteStore();
  const [showShortcutsModal, setShowShortcutsModal] = React.useState(false);

  useNoteKeyboardShortcuts(
    () => setShowShortcutsModal(prev => !prev),
    toggleSidebar
  );

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  return (
    <div
      className="flex h-full w-full text-slate-100 bg-transparent overflow-hidden relative"
      style={{ animation: 'room-fade-in 350ms ease-out' }}
    >
      {/* Canvas Shell (Toolbar + View Router) */}
      <NoteCanvas />

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
