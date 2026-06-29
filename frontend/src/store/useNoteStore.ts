import { create } from 'zustand';
import { NoteFolder, NoteItem, WorkspaceData } from '../types/notes';
import { fetchWithAuth } from '../lib/api-utils';

type SidebarState = 'expanded' | 'collapsed' | 'hidden';
export type CanvasViewMode = 'bookshelf' | 'dashboard' | 'editor';

export const SILK_GRADIENTS = [
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

interface NoteState {
  folders: NoteFolder[];
  notes: Record<string, NoteItem>;
  activeFolderId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  syncState: 'SAVED' | 'SAVING' | 'OFFLINE';

  // Sidebar
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;

  // Canvas
  canvasViewMode: CanvasViewMode;
  setCanvasViewMode: (mode: CanvasViewMode) => void;

  setActiveFolder: (id: string | null) => void;
  setActiveNote: (id: string | null) => void;

  fetchWorkspaceData: (folderId?: string | null, limit?: number, offset?: number) => Promise<WorkspaceData | undefined>;
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createNote: (folderId?: string | null, title?: string, taskIds?: string[], subjectIds?: string[], tagIds?: string[]) => Promise<string | undefined>;
  renameNote: (id: string, newTitle: string) => void;
  deleteNote: (id: string) => Promise<void>;

  updateLocalNote: (id: string, updates: Partial<NoteItem>) => void;
  syncNoteToServer: (id: string, updates: Partial<NoteItem>) => void;
  updateLocalFolder: (id: string, updates: Partial<NoteFolder>) => void;
  syncFolderToServer: (id: string, updates: Partial<NoteFolder>) => void;

  // Compatibility Stubs
  canvasZoom: number;
  setCanvasZoom: (zoom: number) => void;
  searchResults: any[];
  isSearching: boolean;
  searchNotes: (q: string, filters?: any) => Promise<void>;
  tags: any[];
  createTag: (name: string, color?: string) => Promise<void>;
  updateNoteTags: (noteId: string, tagIds: string[]) => void;
  isDesignMode: boolean;
  toggleDesignMode: () => void;
  pickLocalDirectory: () => Promise<void>;
  localDirHandle: any;
  recentlyOpenedNoteIds: string[];
  exportNoteToLocal: (id: string) => Promise<void>;
  themes: any[];
  fetchThemes: () => Promise<void>;
  updateNoteTheme: (noteId: string, themeId: string) => Promise<void>;
  createSyncedBlock: (contentJson: Record<string, any>) => Promise<any>;
  fetchSyncedBlock: (blockId: string) => Promise<any>;
  updateSyncedBlock: (blockId: string, contentJson: Record<string, any>) => Promise<void>;
  noteVersions: Record<string, any[]>;
  fetchNoteVersions: (noteId: string) => Promise<void>;
  fetchNoteVersionContent: (noteId: string, versionId: string) => Promise<any>;
  restoreNoteVersion: (noteId: string, versionId: string) => Promise<void>;
  createNoteCheckpoint: (noteId: string, name: string) => Promise<void>;
  applyWorkspaceKit: (kitId: string, payload: any) => Promise<void>;
}

const debounceTimers: Record<string, NodeJS.Timeout> = {};

export const useNoteStore = create<NoteState>((set, get) => ({
  folders: [],
  notes: {},
  activeFolderId: null,
  activeNoteId: null,
  isLoading: false,
  error: null,
  hasMore: true,
  syncState: 'SAVED',

  // Sidebar
  sidebarState: 'expanded',
  setSidebarState: (state) => set({ sidebarState: state }),
  toggleSidebar: () => set((s) => {
    const cycle: Record<SidebarState, SidebarState> = {
      expanded: 'collapsed',
      collapsed: 'hidden',
      hidden: 'expanded',
    };
    return { sidebarState: cycle[s.sidebarState] };
  }),

  // Canvas
  canvasViewMode: 'bookshelf',
  setCanvasViewMode: (mode) => set({ canvasViewMode: mode }),

  setActiveFolder: (id) => set({ activeFolderId: id, hasMore: true }),
  setActiveNote: (id) => set({ activeNoteId: id }),

  fetchWorkspaceData: async (folderId = null, limit = 50, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (folderId) params.append('folder_id', folderId);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await fetchWithAuth(`/notes/workspace?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data: WorkspaceData = await response.json();

      const notesDict: Record<string, NoteItem> = { ...get().notes };
      data.notes.forEach(note => {
        notesDict[note.id] = note;
      });

      // Merge folders
      const existingFolders = get().folders;
      const foldersMap = new Map<string, NoteFolder>();
      existingFolders.forEach(f => foldersMap.set(f.id, f));
      data.folders.forEach(f => foldersMap.set(f.id, f));
      const mergedFolders = Array.from(foldersMap.values());

      const requestedLimit = limit ?? 50;
      const hasMoreData = data.notes.length >= requestedLimit || data.folders.length >= requestedLimit;

      set({ folders: mergedFolders, notes: notesDict, isLoading: false, hasMore: hasMoreData });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false, hasMore: false });
      return undefined;
    }
  },

  createFolder: async (name, parentId = null) => {
    try {
      const response = await fetchWithAuth('/notes/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parent_id: parentId })
      });
      if (!response.ok) throw new Error('Failed to create folder');
      const created = await response.json();
      set(state => ({ folders: [...state.folders, created] }));
    } catch (err) {
      console.error(err);
    }
  },

  renameFolder: async (id, newName) => {
    set(state => ({
      folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
    }));
    try {
      const response = await fetchWithAuth(`/notes/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName })
      });
      if (!response.ok) throw new Error('Failed to rename folder');
    } catch (err) {
      console.error(err);
    }
  },

  deleteFolder: async (id) => {
    const originalFolders = [...get().folders];

    // Find all descendant folder IDs recursively
    const getDescendants = (folderId: string): string[] => {
      const descendants: string[] = [];
      const queue = [folderId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = get().folders.filter(f => f.parent_id === currentId);
        children.forEach(c => {
          descendants.push(c.id);
          queue.push(c.id);
        });
      }
      return descendants;
    };

    const folderIdsToRemove = [id, ...getDescendants(id)];

    set(state => ({
      folders: state.folders.filter(f => !folderIdsToRemove.includes(f.id)),
      activeFolderId: state.activeFolderId && folderIdsToRemove.includes(state.activeFolderId) ? null : state.activeFolderId
    }));

    try {
      const response = await fetchWithAuth(`/notes/folders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('API failed');
    } catch (err) {
      console.error(err);
      set({ folders: originalFolders });
    }
  },

  createNote: async (folderId = null, title = 'Untitled Note', taskIds = [], subjectIds = [], tagIds = []) => {
    try {
      const response = await fetchWithAuth('/notes/', {
        method: 'POST',
        body: JSON.stringify({ title, folder_id: folderId, task_ids: taskIds, subject_ids: subjectIds, tag_ids: tagIds })
      });
      if (!response.ok) throw new Error('Failed to create note');
      const created = await response.json();
      set(state => ({
        notes: { ...state.notes, [created.id]: created },
        activeNoteId: created.id
      }));
      return created.id;
    } catch (err) {
      console.error(err);
    }
  },

  renameNote: (id, newTitle) => {
    get().updateLocalNote(id, { title: newTitle });
    get().syncNoteToServer(id, { title: newTitle });
  },

  deleteNote: async (id) => {
    const original = get().notes[id];
    set(state => {
      const newNotes = { ...state.notes };
      delete newNotes[id];
      return {
        notes: newNotes,
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
      };
    });
    try {
      const response = await fetchWithAuth(`/notes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
    } catch (err) {
      console.error(err);
      if (original) {
        set(state => ({ notes: { ...state.notes, [id]: original } }));
      }
    }
  },

  updateLocalNote: (id, updates) => {
    set(state => {
      const existing = state.notes[id];
      if (!existing) return state;
      return {
        notes: {
          ...state.notes,
          [id]: { ...existing, ...updates, updated_at: new Date().toISOString() }
        }
      };
    });
  },

  syncNoteToServer: (id, updates) => {
    if (debounceTimers[id]) clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(async () => {
      try {
        const response = await fetchWithAuth(`/notes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          set({ syncState: 'SAVED' });
        }
      } catch (err) {
        console.error(err);
        set({ syncState: 'OFFLINE' });
      }
    }, 1000);
  },

  updateLocalFolder: (id, updates) => {
    set(state => ({
      folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  },

  syncFolderToServer: (id, updates) => {
    fetchWithAuth(`/notes/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }).catch(console.error);
  },

  // Stubs for Backwards Compatibility
  canvasZoom: 1,
  setCanvasZoom: () => {},
  searchResults: [],
  isSearching: false,
  searchNotes: async () => {},
  tags: [],
  createTag: async () => {},
  updateNoteTags: () => {},
  isDesignMode: false,
  toggleDesignMode: () => {},
  pickLocalDirectory: async () => {},
  localDirHandle: null,
  recentlyOpenedNoteIds: [],
  exportNoteToLocal: async () => {},
  themes: [],
  fetchThemes: async () => {},
  updateNoteTheme: async () => {},
  createSyncedBlock: async () => ({}),
  fetchSyncedBlock: async () => ({}),
  updateSyncedBlock: async () => {},
  noteVersions: {},
  fetchNoteVersions: async () => {},
  fetchNoteVersionContent: async () => ({}),
  restoreNoteVersion: async () => {},
  createNoteCheckpoint: async () => {},
  applyWorkspaceKit: async () => {}
}));
