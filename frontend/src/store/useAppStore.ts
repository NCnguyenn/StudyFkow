import { create } from 'zustand';
import { useNoteStore } from './useNoteStore';

interface AppState {
  isSplitViewOpen: boolean;
  splitViewTaskId: string | null;
  splitViewNoteId: string | null;
  isZenMode: boolean;
  soulColor: string;
  isLiteMode: boolean;
  isGlobalSearchOpen: boolean;

  setGlobalSearchOpen: (isOpen: boolean) => void;

  openSplitView: (taskId: string, taskTitle: string, noteId?: string | null) => Promise<void>;
  closeSplitView: () => void;
  setZenMode: (isZenMode: boolean) => void;
  setSoulColor: (color: string) => void;
  setLiteMode: (isLiteMode: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isSplitViewOpen: false,
  splitViewTaskId: null,
  splitViewNoteId: null,
  isZenMode: false,
  soulColor: '#6366f1',
  isLiteMode: false,
  isGlobalSearchOpen: false,

  setGlobalSearchOpen: (isOpen: boolean) => set({ isGlobalSearchOpen: isOpen }),

  openSplitView: async (taskId: string, taskTitle: string, noteId?: string | null) => {
    if (noteId) {
      set({ isSplitViewOpen: true, splitViewTaskId: taskId, splitViewNoteId: noteId });
    } else {
      // Optimistically open Split View showing the loading state for the note
      set({ isSplitViewOpen: true, splitViewTaskId: taskId, splitViewNoteId: null });
      
      const noteStore = useNoteStore.getState();
      
      try {
        // Create note with the task link
        const newNoteId = await noteStore.createNote(null, `${taskTitle} - Notes`, [taskId]);
        set({ splitViewNoteId: newNoteId });
      } catch (e) {
        console.error("Failed to auto-generate note for split view", e);
        // Optionally close it if failed
        // set({ isSplitViewOpen: false });
      }
    }
  },

  closeSplitView: () => {
    set({ isSplitViewOpen: false, splitViewTaskId: null, splitViewNoteId: null });
  },
  setZenMode: (isZenMode) => set({ isZenMode }),
  setSoulColor: (color) => set({ soulColor: color }),
  setLiteMode: (isLiteMode) => set({ isLiteMode }),
}));
