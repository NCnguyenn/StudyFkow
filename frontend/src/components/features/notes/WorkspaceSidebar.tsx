'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { NoteFolder, NoteItem } from '@/types/notes';
import {
  Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2, Search,
  Pencil, FolderPlus, HardDrive, Check, X, AlertTriangle, Network
} from 'lucide-react';
import { NetworkGraphModal } from './NetworkGraphModal';

/* ── Delete Confirmation Popup ── */
const DeleteConfirmPopup: React.FC<{
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ itemName, onConfirm, onCancel }) => (
  <div className="absolute right-0 top-full mt-1 w-56 glass-card shadow-xl border border-red-200 rounded-xl p-3 z-50">
    <div className="flex items-start gap-2 mb-3">
      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-slate-600">
        Delete <strong className="text-slate-800">{itemName}</strong>? This cannot be undone.
      </p>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 px-2 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
);

/* ── Inline Rename Input ── */
const InlineRename: React.FC<{
  defaultValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}> = ({ defaultValue, onSave, onCancel }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSave(value.trim() || defaultValue); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(value.trim() || defaultValue)}
        className="flex-1 min-w-0 text-sm bg-white/80 border border-indigo-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800"
      />
    </div>
  );
};

/* ── Note Item Row ── */
const NoteRow: React.FC<{
  note: NoteItem;
  depth: number;
}> = ({ note, depth }) => {
  const { activeNoteId, setActiveNote, renameNote, deleteNote } = useNoteStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isActive = activeNoteId === note.id;

  return (
    <div className="relative">
      <div
        onClick={() => !isRenaming && setActiveNote(note.id)}
        className={`group flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-all ${
          isActive
            ? 'bg-indigo-100 text-indigo-700 font-medium'
            : 'hover:bg-slate-500/5 text-slate-500 hover:text-slate-700'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8 + 14}px` }}
      >
        <FileText className="w-3.5 h-3.5 shrink-0 mr-2 opacity-60" />
        {isRenaming ? (
          <InlineRename
            defaultValue={note.title}
            onSave={(val) => { renameNote(note.id, val); setIsRenaming(false); }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <span className="text-sm truncate flex-1">{note.title || 'Untitled Note'}</span>
        )}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700" title="Rename">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {showDeleteConfirm && (
        <DeleteConfirmPopup
          itemName={note.title || 'Untitled Note'}
          onConfirm={() => { deleteNote(note.id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

/* ── Folder Node ── */
interface FolderNodeProps {
  folder: NoteFolder;
  allFolders: NoteFolder[];
  allNotes: NoteItem[];
  depth: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({ folder, allFolders, allNotes, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { createNote, createFolder, deleteFolder, renameFolder } = useNoteStore();

  const childFolders = useMemo(() => {
    return allFolders.filter(f => f.parent_id === folder.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allFolders, folder.id]);

  const childNotes = useMemo(() => {
    const notes = allNotes.filter(n => n.folder_id === folder.id);
    return notes.sort((a, b) => {
      // Subject-linked notes pinned at top
      if (a.subject_id && !b.subject_id) return -1;
      if (!a.subject_id && b.subject_id) return 1;
      // Then chronological (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [allNotes, folder.id]);

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    createNote(folder.id, 'New Note');
  };

  const handleAddSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    const name = prompt('Subfolder name:');
    if (name) createFolder(name, folder.id);
  };

  return (
    <div className="w-full relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-between py-1.5 px-2 hover:bg-slate-500/5 rounded-lg cursor-pointer text-slate-600 hover:text-slate-800 transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <Folder className="w-4 h-4 shrink-0 text-indigo-400/60" />
          {isRenaming ? (
            <InlineRename
              defaultValue={folder.name}
              onSave={(val) => { renameFolder(folder.id, val); setIsRenaming(false); }}
              onCancel={() => setIsRenaming(false)}
            />
          ) : (
            <span className="text-sm truncate">{folder.name}</span>
          )}
        </div>
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={handleAddNote} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700" title="New Note">
              <Plus className="w-3 h-3" />
            </button>
            <button onClick={handleAddSubfolder} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700" title="New Subfolder">
              <FolderPlus className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700" title="Rename">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmPopup
          itemName={folder.name}
          onConfirm={() => { deleteFolder(folder.id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {isOpen && (
        <div className="w-full">
          {childFolders.map(child => (
            <FolderNode key={child.id} folder={child} allFolders={allFolders} allNotes={allNotes} depth={depth + 1} />
          ))}
          {childNotes.map(note => (
            <NoteRow key={note.id} note={note} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main Sidebar ── */
export const WorkspaceSidebar = () => {
  const { folders, notes, activeNoteId, setActiveNote, createFolder, createNote, pickLocalDirectory, localDirHandle } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const allNotes = useMemo(() => Object.values(notes), [notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return allNotes;
    const lowerQ = searchQuery.toLowerCase();
    return allNotes.filter(n =>
      n.title.toLowerCase().includes(lowerQ) ||
      n.content_json?.content?.some?.((block: any) => JSON.stringify(block).toLowerCase().includes(lowerQ))
    );
  }, [allNotes, searchQuery]);

  const rootFolders = useMemo(() => folders.filter(f => !f.parent_id).sort((a, b) => a.name.localeCompare(b.name)), [folders]);
  const rootNotes = useMemo(() => {
    const notes = filteredNotes.filter(n => !n.folder_id);
    return notes.sort((a, b) => {
      if (a.subject_id && !b.subject_id) return -1;
      if (!a.subject_id && b.subject_id) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredNotes]);

  const handleCreateRootFolder = () => {
    const name = prompt('Folder name:');
    if (name) createFolder(name, null);
  };

  return (
    <aside className="w-64 h-full glass-sidebar flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">Workspace</h2>
          <div className="flex gap-1">
            <button onClick={() => createNote(null, 'New Note')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="New Note">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={handleCreateRootFolder} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="New Folder">
              <Folder className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm glass-input bg-white/70"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-0.5">
        {!searchQuery && rootFolders.map(folder => (
          <FolderNode key={folder.id} folder={folder} allFolders={folders} allNotes={allNotes} depth={0} />
        ))}
        {searchQuery && filteredNotes.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-sm">No notes found.</div>
        )}
        {rootNotes.map(note => (
          <NoteRow key={note.id} note={note} depth={0} />
        ))}
      </div>

      {/* Actions Pane */}
      <div className="p-3 border-t border-slate-200 shrink-0 space-y-2">
        <button
          onClick={() => setIsGraphOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100/50 hover:border-indigo-200 transition-colors"
        >
          <Network className="w-3.5 h-3.5" />
          View Knowledge Graph
        </button>

        <button
          onClick={pickLocalDirectory}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl border transition-colors ${
            localDirHandle
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          {localDirHandle ? 'Local Backup Connected ✓' : 'Set Local Backup Folder'}
        </button>
      </div>

      {isGraphOpen && <NetworkGraphModal isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} />}
    </aside>
  );
};
