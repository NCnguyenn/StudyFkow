import { useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';

export function useNoteKeyboardShortcuts(
  onToggleShortcutsModal: () => void,
  onToggleSidebar?: () => void
) {
  const { createNote, setActiveNote, setCanvasViewMode, activeFolderId } = useNoteStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + / to toggle shortcuts modal
      if (mod && e.key === '/') {
        e.preventDefault();
        onToggleShortcutsModal();
      }

      // Ctrl/Cmd + \ to toggle sidebar (expanded → collapsed → hidden)
      if (mod && e.key === '\\') {
        e.preventDefault();
        onToggleSidebar?.();
      }

      // Ctrl + N to create a new note
      if (mod && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
        createNote(activeFolderId, `Untitled — ${dateStr}`).then((newId) => {
          if (newId) {
            setActiveNote(newId);
            setCanvasViewMode("editor");
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleShortcutsModal, onToggleSidebar, activeFolderId, createNote, setActiveNote, setCanvasViewMode]);
}
