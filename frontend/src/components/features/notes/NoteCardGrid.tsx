'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNoteStore, SILK_GRADIENTS } from '@/store/useNoteStore';
import { NoteFolder, NoteItem } from '@/types/notes';
import {
  Plus, Search, MoreVertical, Pencil, Trash2, Image,
  Folder, Calendar, ChevronRight, BookOpen, FileText,
  Star, Clock, Tag, Filter, LayoutGrid, List, Hash
} from 'lucide-react';

/* ── Tag / Badge Rendering ── */
const TagBadge: React.FC<{ label: string; color?: string }> = ({ label, color }) => {
  const colors: Record<string, string> = {
    tech: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/15',
    language: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15',
    research: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15',
    default: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/15',
  };
  const colorClass = colors[color || 'default'] || colors.default;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${colorClass}`}>
      <Hash className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

/* ── Status Indicator ── */
const StatusDot: React.FC<{ noteCount: number; recentlyUpdated: boolean }> = ({ noteCount, recentlyUpdated }) => {
  if (noteCount === 0) return <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" title="Empty" />;
  if (recentlyUpdated) return <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Recently updated" />;
  return <span className="w-2 h-2 rounded-full bg-indigo-400" title="Has content" />;
};

/* ── Cover Picker ── */
const CoverPicker: React.FC<{ onSelect: (g: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <div className="absolute right-2 top-10 w-64 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
    <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Cover</h4>
    <div className="grid grid-cols-5 gap-1.5 mb-3">
      {SILK_GRADIENTS.map((gradient, idx) => (
        <button
          key={idx}
          onClick={() => { onSelect(gradient); onClose(); }}
          className="aspect-square rounded-lg border border-slate-200 dark:border-slate-700/50 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 transition-all cursor-pointer"
          style={{ background: gradient }}
        />
      ))}
    </div>
    <button onClick={onClose} className="w-full text-center py-1 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">Close</button>
  </div>
);

/* ── Pastel left-border colors for folder cards ── */
const PASTEL_BORDERS = [
  'var(--sf-room-accent-lavender)',
  'var(--sf-room-accent-mint)',
  'var(--sf-room-accent-amber)',
  'var(--sf-room-accent-sky)',
  'var(--sf-room-accent-rose)',
  'var(--sf-room-accent-primary)',
];

/* ── Folder Card (Enhanced) ── */
const FolderCard: React.FC<{ folder: NoteFolder; onClick: () => void; index: number }> = ({ folder, onClick, index }) => {
  const borderColor = PASTEL_BORDERS[index % PASTEL_BORDERS.length];
  const { notes, folders, renameFolder, deleteFolder, syncFolderToServer } = useNoteStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickingCover, setIsPickingCover] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  const childFolders = useMemo(() => folders.filter(f => f.parent_id === folder.id).length, [folders, folder.id]);
  const childNotes = useMemo(() => Object.values(notes).filter(n => n.folder_id === folder.id), [notes, folder.id]);
  const childNotesCount = childNotes.length;

  // Check if any child note was updated in the last 24 hours
  const recentlyUpdated = useMemo(() => {
    const oneDayAgo = Date.now() - 86400000;
    return childNotes.some(n => n.updated_at && new Date(n.updated_at).getTime() > oneDayAgo);
  }, [childNotes]);

  const coverStyle = folder.ui_metadata?.cover_image_url || SILK_GRADIENTS[0];
  const emojiIcon = folder.ui_metadata?.icon || '📁';
  const preset = folder.ui_metadata?.workspace_preset;

  const handleRenameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== folder.name) renameFolder(folder.id, renameValue.trim());
    setIsRenaming(false);
  };

  const handleSelectCover = (newCover: string) => {
    const meta = { ...(folder.ui_metadata || {}), cover_image_url: newCover };
    useNoteStore.getState().updateLocalFolder(folder.id, { ui_metadata: meta as any });
    syncFolderToServer(folder.id, { ui_metadata: meta as any });
  };

  return (
    <div
      className="note-card-grid-item group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl room-glass border-l-[3px]"
      style={{ borderLeftColor: borderColor }}
    >

      {/* Cover */}
      <div onClick={onClick} className="h-28 sm:h-32 w-full cursor-pointer relative overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110" style={{ background: coverStyle }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        {/* Status */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
          <StatusDot noteCount={childNotesCount} recentlyUpdated={recentlyUpdated} />
        </div>
      </div>

      {/* Menu */}
      <div className="absolute top-2 right-2 z-20">
        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-950/50 hover:bg-white/95 dark:hover:bg-slate-950/80 border border-white/40 dark:border-slate-800 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1 z-40">
              <button onClick={() => { setIsRenaming(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-indigo-600/10 rounded-lg transition-colors cursor-pointer font-medium">
                <Pencil className="w-3.5 h-3.5 text-indigo-500" /> Rename
              </button>
              <button onClick={() => { setIsPickingCover(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-indigo-600/10 rounded-lg transition-colors cursor-pointer font-medium">
                <Image className="w-3.5 h-3.5 text-amber-500" /> Change Cover
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
              <button onClick={() => { if (confirm(`Delete "${folder.name}"?`)) deleteFolder(folder.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-600/10 rounded-lg transition-colors cursor-pointer font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
        {isPickingCover && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsPickingCover(false)} />
            <CoverPicker onSelect={handleSelectCover} onClose={() => setIsPickingCover(false)} />
          </>
        )}
      </div>

      {/* Floating Emoji */}
      <div className="absolute top-[5.5rem] sm:top-[6.5rem] left-3.5 z-10 select-none pointer-events-none drop-shadow-lg">
        <span className="text-2xl">{emojiIcon}</span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 pt-6 flex flex-col justify-between min-h-[120px]">
        <div className="space-y-2">
          {isRenaming ? (
            <form onSubmit={handleRenameSave} onClick={e => e.stopPropagation()}>
              <input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                className="w-full text-sm bg-white/80 dark:bg-slate-900/80 border border-indigo-500/50 rounded-lg px-2 py-1 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </form>
          ) : (
            <h3 onClick={onClick} className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer leading-tight">
              {folder.name}
            </h3>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Folder className="w-3 h-3 opacity-70" />
              {childFolders}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 opacity-70" />
              {childNotesCount}
            </span>
          </div>

          {/* Tags */}
          {preset && preset !== 'default' && (
            <div className="flex flex-wrap gap-1 mt-1">
              <TagBadge label={preset} color={preset} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/40 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Calendar className="w-3 h-3" />
            {new Date(folder.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <button onClick={onClick} className="flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold cursor-pointer">
            Open
            <ChevronRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Filter Bar ── */
type SortMode = 'newest' | 'alphabetical' | 'most-notes';
type FilterTag = string | null;

const FilterBar: React.FC<{
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  availableTags: string[];
  activeTag: FilterTag;
  onTagChange: (t: FilterTag) => void;
  totalCount: number;
}> = ({ searchQuery, onSearchChange, sortMode, onSortChange, availableTags, activeTag, onTagChange, totalCount }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => onTagChange(null)}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${!activeTag ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            All
          </button>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${activeTag === tag ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="flex items-center gap-2">
      {/* Sort */}
      <select
        value={sortMode}
        onChange={e => onSortChange(e.target.value as SortMode)}
        className="text-[10px] font-semibold bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
      >
        <option value="newest">Newest</option>
        <option value="alphabetical">A-Z</option>
        <option value="most-notes">Most Notes</option>
      </select>

      {/* Count */}
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
        {totalCount} items
      </span>
    </div>
  </div>
);

/* ── Empty State ── */
const EmptyState: React.FC<{ hasSearch: boolean; onCreateCover: () => void }> = ({ hasSearch, onCreateCover }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white/15 dark:bg-slate-900/10 border border-dashed border-slate-300/50 dark:border-slate-800/40 rounded-2xl">
    <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
      📖
    </div>
    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
      {hasSearch ? "No matching cover notes" : "No Cover Notes Yet"}
    </h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6 leading-relaxed">
      {hasSearch
        ? "Try a different keyword or create a new cover note."
        : "A cover note organizes your study materials. Create your first one to begin."}
    </p>
    <button onClick={onCreateCover} className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all cursor-pointer">
      <Plus className="w-4 h-4" />
      {hasSearch ? 'Create New Cover' : 'Create First Cover Note'}
    </button>
  </div>
);

/* ── Main NoteCardGrid ── */
export const NoteCardGrid: React.FC = () => {
  const { folders, notes, createFolder, setActiveFolder } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [activeTag, setActiveTag] = useState<FilterTag>(null);

  const rootFolders = useMemo(() => folders.filter(f => !f.parent_id), [folders]);

  // Extract available tags from workspace presets
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    rootFolders.forEach(f => {
      const preset = f.ui_metadata?.workspace_preset;
      if (preset && preset !== 'default') tags.add(preset);
    });
    return Array.from(tags);
  }, [rootFolders]);

  // Filter
  const filteredFolders = useMemo(() => {
    let result = rootFolders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    if (activeTag) {
      result = result.filter(f => f.ui_metadata?.workspace_preset === activeTag);
    }

    return result;
  }, [rootFolders, searchQuery, activeTag]);

  // Sort
  const sortedFolders = useMemo(() => {
    const copy = [...filteredFolders];
    switch (sortMode) {
      case 'newest':
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'alphabetical':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'most-notes': {
        const countNotes = (folderId: string) => Object.values(notes).filter(n => n.folder_id === folderId).length;
        return copy.sort((a, b) => countNotes(b.id) - countNotes(a.id));
      }
      default:
        return copy;
    }
  }, [filteredFolders, sortMode, notes]);

  const handleCreateCover = useCallback(async () => {
    await createFolder("Untitled Cover Note");
  }, [createFolder]);

  return (
    <div className="flex-1 w-full bg-transparent">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2.5">
              <span className="text-2xl">📚</span> Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {rootFolders.length} cover notes &middot; {Object.keys(notes).length} total pages
            </p>
          </div>
          <button
            onClick={handleCreateCover}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Cover Note
          </button>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortMode={sortMode}
          onSortChange={setSortMode}
          availableTags={availableTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          totalCount={sortedFolders.length}
        />

        {/* Grid */}
        {sortedFolders.length > 0 ? (
          <div className="note-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {sortedFolders.map((folder, idx) => (
              <FolderCard key={folder.id} folder={folder} index={idx} onClick={() => setActiveFolder(folder.id)} />
            ))}
          </div>
        ) : (
          <EmptyState hasSearch={!!searchQuery.trim() || !!activeTag} onCreateCover={handleCreateCover} />
        )}
      </div>
    </div>
  );
};
