import { create } from 'zustand';
import { NoteFolder, NoteItem, WorkspaceData } from '../types/notes';
import { fetchWithAuth } from '../lib/api-utils';

interface NoteState {
  folders: NoteFolder[];
  notes: Record<string, NoteItem>;
  activeFolderId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  localDirHandle: FileSystemDirectoryHandle | null;

  setActiveFolder: (id: string | null) => void;
  setActiveNote: (id: string | null) => void;

  fetchWorkspaceData: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createNote: (folderId?: string | null, title?: string, taskId?: string | null, subjectId?: string | null) => Promise<string | undefined>;
  renameNote: (id: string, newTitle: string) => void;
  deleteNote: (id: string) => Promise<void>;

  // Auto-save mechanisms
  updateLocalNote: (id: string, updates: Partial<NoteItem>) => void;
  syncNoteToServer: (id: string, updates: Partial<NoteItem>) => void;

  // Local file sync
  pickLocalDirectory: () => Promise<void>;
  exportNoteToLocal: (id: string) => Promise<void>;
}

// Map to store timeout IDs for debouncing per note
const debounceTimers: Record<string, NodeJS.Timeout> = {};

// P2: Track the latest unsynced payload per note so we can flush on unload.
// This is updated every time syncNoteToServer is called, and cleared after
// a successful server sync.
const pendingNoteUpdates: Record<string, { id: string; updates: Record<string, unknown> }> = {};

// P2: Retrieve the stored auth token for keepalive requests.
// We cannot use fetchWithAuth on beforeunload because the browser cancels
// standard async fetch calls during page teardown.
const getStoredToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('studyflow_access_token') : null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// P2: Register a single beforeunload handler at module initialization time.
// It runs once when the module is first imported (client-side only).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const pendingIds = Object.keys(pendingNoteUpdates);
    if (pendingIds.length === 0) return;

    const token = getStoredToken();

    for (const noteId of pendingIds) {
      const { updates } = pendingNoteUpdates[noteId];

      // Cancel the debounce timer — we're about to fire immediately
      if (debounceTimers[noteId]) {
        clearTimeout(debounceTimers[noteId]);
        delete debounceTimers[noteId];
      }

      // Primary: keepalive fetch — browser guarantees delivery even on tab close
      if (token) {
        try {
          fetch(`${API_BASE}/notes/${noteId}`, {
            method: 'PATCH',
            keepalive: true,                    // ← key: survives page unload
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });
        } catch {
          // keepalive fetch itself can throw synchronously in some edge cases
        }
      }
    }

    // Emergency fallback: dump everything to localStorage so the next session
    // can detect and re-sync unsynced notes.
    // Recovery logic (reading this key on load) can be added in fetchWorkspaceData.
    try {
      const existing = JSON.parse(localStorage.getItem('studyflow_unsynced_notes') ?? '{}');
      const merged = { ...existing, ...pendingNoteUpdates };
      localStorage.setItem('studyflow_unsynced_notes', JSON.stringify(merged));
    } catch {
      // Quota exceeded or Safari private mode — non-fatal
    }
  });
}

/** Convert Tiptap JSON to simple Markdown */
function tiptapJsonToMarkdown(json: Record<string, any>): string {
  if (!json?.content) return '';
  return json.content.map((node: any) => blockToMd(node)).join('\n');
}

function blockToMd(node: any): string {
  if (!node) return '';
  const text = node.content?.map((child: any) => inlineToMd(child)).join('') ?? '';

  switch (node.type) {
    case 'heading': return `${'#'.repeat(node.attrs?.level || 1)} ${text}`;
    case 'paragraph': return text;
    case 'bulletList': return node.content?.map((li: any) => `- ${blockToMd(li)}`).join('\n') ?? '';
    case 'orderedList': return node.content?.map((li: any, i: number) => `${i + 1}. ${blockToMd(li)}`).join('\n') ?? '';
    case 'listItem': return node.content?.map((c: any) => blockToMd(c)).join('\n') ?? '';
    case 'taskList': return node.content?.map((li: any) => {
      const checked = li.attrs?.checked ? 'x' : ' ';
      return `- [${checked}] ${li.content?.map((c: any) => blockToMd(c)).join('') ?? ''}`;
    }).join('\n') ?? '';
    case 'codeBlock': return `\`\`\`${node.attrs?.language || ''}\n${text}\n\`\`\``;
    case 'blockquote': return `> ${text}`;
    case 'horizontalRule': return '---';
    case 'table': return tableToMd(node);
    default: return text;
  }
}

function inlineToMd(node: any): string {
  if (node.type === 'text') {
    let t = node.text || '';
    const marks = node.marks || [];
    for (const mark of marks) {
      switch (mark.type) {
        case 'bold': t = `**${t}**`; break;
        case 'italic': t = `*${t}*`; break;
        case 'strike': t = `~~${t}~~`; break;
        case 'code': t = `\`${t}\``; break;
        case 'underline': t = `<u>${t}</u>`; break;
        case 'link': t = `[${t}](${mark.attrs?.href || ''})`; break;
      }
    }
    return t;
  }
  if (node.type === 'hardBreak') return '\n';
  return '';
}

function tableToMd(node: any): string {
  if (!node.content) return '';
  const rows = node.content.map((row: any) =>
    '| ' + (row.content?.map((cell: any) =>
      cell.content?.map((c: any) => blockToMd(c)).join(' ') ?? ''
    ).join(' | ') ?? '') + ' |'
  );
  if (rows.length > 0) {
    const colCount = node.content[0]?.content?.length || 1;
    const separator = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    rows.splice(1, 0, separator);
  }
  return rows.join('\n');
}

export const useNoteStore = create<NoteState>((set, get) => ({
  folders: [],
  notes: {},
  activeFolderId: null,
  activeNoteId: null,
  isLoading: false,
  error: null,
  localDirHandle: null,

  setActiveFolder: (id) => set({ activeFolderId: id }),
  setActiveNote: (id) => set({ activeNoteId: id }),

  fetchWorkspaceData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithAuth('/notes/workspace');
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data: WorkspaceData = await response.json();

      const notesDict: Record<string, NoteItem> = {};
      data.notes.forEach(note => {
        notesDict[note.id] = note;
      });

      set({ folders: data.folders, notes: notesDict, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createFolder: async (name: string, parentId: string | null = null) => {
    const tempId = `temp-${Date.now()}`;
    const tempFolder: NoteFolder = {
      id: tempId,
      user_id: 'temp',
      name,
      parent_id: parentId,
      created_at: new Date().toISOString()
    };

    set(state => ({ folders: [...state.folders, tempFolder] }));

    try {
      const response = await fetchWithAuth('/notes/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parent_id: parentId })
      });
      if (!response.ok) throw new Error('API failed');
      const createdFolder = await response.json();

      set(state => ({
        folders: state.folders.map(f => f.id === tempId ? createdFolder : f)
      }));
    } catch (err) {
      console.error('Failed to create folder:', err);
      set(state => ({ folders: state.folders.filter(f => f.id !== tempId) }));
    }
  },

  renameFolder: async (id: string, newName: string) => {
    // Optimistic
    set(state => ({
      folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
    }));
    try {
      const response = await fetchWithAuth(`/notes/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName })
      });
      if (!response.ok) throw new Error('API failed to rename folder');
    } catch (err) {
      console.error('Failed to rename folder:', err);
      // Refetch workspace to correct state
      get().fetchWorkspaceData();
    }
  },

  deleteFolder: async (id: string) => {
    const originalFolders = [...get().folders];

    set(state => ({
      folders: state.folders.filter(f => f.id !== id),
    }));

    try {
      const response = await fetchWithAuth(`/notes/folders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('API failed');
    } catch (err) {
      console.error('Failed to delete folder:', err);
      set({ folders: originalFolders });
    }
  },

  createNote: async (folderId: string | null = null, title: string = 'Untitled Note', taskId: string | null = null, subjectId: string | null = null) => {
    const tempId = `temp-${Date.now()}`;
    const tempNote: NoteItem = {
      id: tempId,
      user_id: 'temp',
      folder_id: folderId,
      subject_id: subjectId,
      task_id: taskId,
      title,
      content_json: {},
      content_markdown: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => ({
      notes: { ...state.notes, [tempId]: tempNote },
      activeNoteId: tempId
    }));

    try {
      const response = await fetchWithAuth('/notes/', {
        method: 'POST',
        body: JSON.stringify({ title, folder_id: folderId, task_id: taskId, subject_id: subjectId })
      });
      if (!response.ok) throw new Error('API failed');
      const createdNote = await response.json();

      set(state => {
        const newNotes = { ...state.notes };
        delete newNotes[tempId];
        newNotes[createdNote.id] = createdNote;
        return {
          notes: newNotes,
          activeNoteId: state.activeNoteId === tempId ? createdNote.id : state.activeNoteId
        };
      });
      return createdNote.id;
    } catch (err) {
      console.error('Failed to create note:', err);
      set(state => {
        const newNotes = { ...state.notes };
        delete newNotes[tempId];
        return {
          notes: newNotes,
          activeNoteId: state.activeNoteId === tempId ? null : state.activeNoteId
        };
      });
    }
  },

  renameNote: (id: string, newTitle: string) => {
    const store = get();
    store.updateLocalNote(id, { title: newTitle });
    store.syncNoteToServer(id, { title: newTitle });
  },

  deleteNote: async (id: string) => {
    const original = get().notes[id];
    
    // Optimistic delete
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
      if (!response.ok) throw new Error('API failed');
    } catch (err) {
      console.error('Failed to delete note:', err);
      if (original) {
        set(state => ({ notes: { ...state.notes, [id]: original } }));
      }
    }
  },

  updateLocalNote: (id: string, updates: Partial<NoteItem>) => {
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

  syncNoteToServer: (id: string, updates: Partial<NoteItem>) => {
    if (debounceTimers[id]) {
      clearTimeout(debounceTimers[id]);
    }

    // P2: Record the latest pending payload so beforeunload can flush it
    pendingNoteUpdates[id] = { id, updates: updates as Record<string, unknown> };

    debounceTimers[id] = setTimeout(async () => {
      try {
        const response = await fetchWithAuth(`/notes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to sync note');
        const syncedNote = await response.json();

        set(state => ({
          notes: {
            ...state.notes,
            [id]: { ...state.notes[id], ...syncedNote }
          }
        }));

        // P2: Sync succeeded — clear the pending record and any localStorage backup
        delete pendingNoteUpdates[id];
        try {
          const stored = JSON.parse(localStorage.getItem('studyflow_unsynced_notes') ?? '{}');
          delete stored[id];
          localStorage.setItem('studyflow_unsynced_notes', JSON.stringify(stored));
        } catch { /* non-fatal */ }

        // Auto-export to local if directory is set
        const dirHandle = get().localDirHandle;
        if (dirHandle) {
          get().exportNoteToLocal(id);
        }
      } catch (err) {
        console.error('Failed to sync note to server:', err);
      }
      delete debounceTimers[id];
    }, 1500);
  },

  pickLocalDirectory: async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use Chrome or Edge.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      set({ localDirHandle: handle });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to pick directory:', err);
      }
    }
  },

  exportNoteToLocal: async (id: string) => {
    const { notes, localDirHandle } = get();
    const note = notes[id];
    if (!note || !localDirHandle) return;

    try {
      const safeName = (note.title || 'Untitled').replace(/[<>:"/\\|?*]/g, '_').trim();
      const fileName = `${safeName}.md`;
      const markdown = tiptapJsonToMarkdown(note.content_json);
      const frontmatter = `---\ntitle: ${note.title}\nid: ${note.id}\nupdated: ${note.updated_at}\n---\n\n`;

      const fileHandle = await localDirHandle.getFileHandle(fileName, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(frontmatter + markdown);
      await writable.close();
    } catch (err) {
      console.error('Failed to export note to local:', err);
    }
  },
}));
