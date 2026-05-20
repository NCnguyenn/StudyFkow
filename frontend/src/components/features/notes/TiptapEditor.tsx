'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { FontSize } from '@/lib/tiptap/font-size';
import { InlineComment } from '@/lib/tiptap/inline-comment';
import { BidirectionalLink } from '@/lib/tiptap/bidirectional-link';
import { useNoteStore } from '@/store/useNoteStore';
import { EditorHeader } from './EditorHeader';
import { StudioToolbar } from './StudioToolbar';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  MessageSquare, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TiptapEditorProps { noteId: string; }
type SyncState = 'SAVED' | 'SAVING' | 'OFFLINE';

interface ActiveComment {
  text: string;
  color: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Sync State Indicator (preserved from Phase 2)
// ---------------------------------------------------------------------------

const SyncIndicator: React.FC<{ syncState: SyncState }> = ({ syncState }) => {
  if (syncState === 'SAVED') return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
      <span className="text-[11px] font-medium text-slate-400 select-none">Saved</span>
    </div>
  );
  if (syncState === 'SAVING') return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[11px] font-medium text-amber-500 select-none">Saving…</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      <span className="text-[11px] font-medium text-rose-500 select-none">Offline</span>
    </div>
  );
};

// Quick pastel swatches for BubbleMenu
const BUBBLE_HIGHLIGHTS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Blue',   value: '#bfdbfe' },
  { label: 'Pink',   value: '#fecdd3' },
];

// BubbleMenu button primitive (preserved from Phase 3)
const BBtn: React.FC<{
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={['p-1.5 transition-colors', active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-100'].join(' ')}
  >{children}</button>
);

// ---------------------------------------------------------------------------
// Floating Comment Card
// ---------------------------------------------------------------------------

const CommentCard: React.FC<{ comment: ActiveComment; onClose: () => void }> = ({ comment, onClose }) => (
  <div
    className="fixed z-[9999] w-72 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-400/30 p-4"
    style={{ top: comment.y + 12, left: comment.x }}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: comment.color }} />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Inline Comment</span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ noteId }) => {
  const { notes, updateLocalNote, syncNoteToServer } = useNoteStore();
  const note = notes[noteId];

  const [syncState, setSyncState] = useState<SyncState>('SAVED');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating inline-comment card state
  const [activeComment, setActiveComment] = useState<ActiveComment | null>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ underline: false }),
        Placeholder.configure({
          placeholder: "Press '/' for commands, or start typing…",
          emptyEditorClass: 'is-editor-empty',
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Underline,
        TextStyle,
        FontFamily,
        Color,
        Highlight.configure({ multicolor: true }),
        FontSize,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        TiptapImage.configure({ inline: false, allowBase64: false }),
        InlineComment,
        BidirectionalLink,
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-slate max-w-full min-h-[1000px] focus:outline-none',
        },
        handleClick: (_view, _pos, event) => {
          const target = event.target as HTMLElement;
          const commentEl = target.closest('span[data-comment]') as HTMLElement | null;
          if (commentEl) {
            const text = commentEl.getAttribute('data-comment') ?? '';
            const color = commentEl.getAttribute('data-color') ?? '#fef08a';
            // Prevent overflow: clamp to 320px from right edge
            const xPos = Math.min(event.clientX, window.innerWidth - 320);
            setActiveComment({ text, color, x: xPos, y: event.clientY });
            return true;
          }
          // Click outside comment → dismiss card
          setActiveComment(null);
          return false;
        },
      },
      content: note?.content_json ?? null,
      onUpdate: ({ editor: ed }) => {
        const json = ed.getJSON();
        setSyncState('SAVING');
        updateLocalNote(noteId, { content_json: json });
        syncNoteToServer(noteId, { content_json: json });
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSyncState('SAVED'), 1500);
      },
    },
    [noteId],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  // Content sync when active note changes (preserved)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentContent = note?.content_json || {};
    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) return;
      if (Object.keys(currentContent).length === 0) {
        editor.commands.setContent('');
      } else {
        editor.commands.setContent(currentContent);
      }
    });
  }, [note?.id, editor]);

  // Dismiss comment card on Escape
  useEffect(() => {
    if (!activeComment) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveComment(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeComment]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-slate-100/60 relative select-none">

      {/* Sync State Indicator */}
      <div className="absolute top-3 right-6 z-50">
        <SyncIndicator syncState={syncState} />
      </div>

      {/* Editor Header */}
      <EditorHeader noteId={noteId} />

      {/* Studio Toolbar (sticky, dual-row) */}
      <StudioToolbar editor={editor} />

      {/* Bubble Menu — contextual selection toolbar */}
      <BubbleMenu
        editor={editor}
        options={{ placement: 'top' }}
        className="flex overflow-hidden rounded-xl bg-white border border-slate-200 shadow-2xl shadow-slate-300/50"
      >
        <BBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Bold ⌘B"><Bold          className="w-3.5 h-3.5" /></BBtn>
        <BBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Italic ⌘I"><Italic        className="w-3.5 h-3.5" /></BBtn>
        <BBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline ⌘U"><UnderlineIcon className="w-3.5 h-3.5" /></BBtn>
        <BBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></BBtn>
        <BBtn onClick={() => editor.chain().focus().toggleCode().run()}      active={editor.isActive('code')}      title="Code ⌘E"><Code            className="w-3.5 h-3.5" /></BBtn>
        <div className="w-px bg-slate-100 my-1" />
        {BUBBLE_HIGHLIGHTS.map(c => (
          <button
            key={c.value}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c.value }).run(); }}
            className="p-1.5 hover:bg-slate-50 transition-colors"
            title={`Highlight ${c.label}`}
          >
            <div className="w-3.5 h-3.5 rounded-sm border border-slate-200" style={{ backgroundColor: c.value }} />
          </button>
        ))}
      </BubbleMenu>

      {/* Scrollable Canvas Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 flex justify-center custom-scrollbar select-text">
        <div className="bg-white w-full max-w-[850px] min-h-[1100px] shadow-xl border border-slate-200 rounded-sm px-16 py-20">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Floating Inline Comment Card */}
      {activeComment && (
        <CommentCard comment={activeComment} onClose={() => setActiveComment(null)} />
      )}

    </div>
  );
};
