'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getMarkRange } from '@tiptap/core';
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
import { DiagramBlock } from '@/lib/tiptap/diagram-block';
import { DataChart } from '@/lib/tiptap/chart-block';
import { TaskMention, SubjectMention } from '@/lib/tiptap/smart-mention';
import { MagicGloss } from './MagicGloss';
import { useNoteStore } from '@/store/useNoteStore';
import { useAppStore } from '@/store/useAppStore';
import { useSubjectStore } from '@/store/useSubjectStore';
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

interface FloatingGlossary {
  text: string;
  color: string;
  x: number;
  y: number;
  from: number;
  to: number;
}

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

// Helper to convert falsy, empty, or invalid JSON structures into a safe empty PM doc.
const getSafeContent = (content: any) => {
  if (!content) return '<p></p>';
  if (typeof content === 'object') {
    if (Object.keys(content).length === 0 || !content.type) {
      return '<p></p>';
    }
  }
  return content;
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ noteId }) => {
  const { notes, updateLocalNote, syncNoteToServer } = useNoteStore();
  const { openSplitView } = useAppStore();
  const note = notes[noteId];

  const [syncState, setSyncState] = useState<SyncState>('SAVED');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating MagicGloss vocabulary card state
  const [activeGlossary, setActiveGlossary] = useState<FloatingGlossary | null>(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (activeGlossary) {
      setEditNote(activeGlossary.text);
    }
  }, [activeGlossary]);



  const editor = useEditor(
    {
      immediatelyRender: false,
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
        MagicGloss,
        BidirectionalLink,
        DiagramBlock,
        DataChart,
        TaskMention,
        SubjectMention,
      ],
      editorProps: {
        attributes: {
          class: 'focus:outline-none min-h-[960px]',
        },
        handleClick: (view, pos, event) => {
          const target = event.target as HTMLElement;

          // ── Smart Mention click routing ───────────────────
          const mentionEl = target.closest('.mention-badge') as HTMLElement | null;
          if (mentionEl) {
            const type = mentionEl.dataset.type;
            const id = mentionEl.dataset.id ?? '';
            const label = mentionEl.dataset.label ?? '';
            if (type === 'task') {
              // Route to split view — taskId is stored in data-id
              openSplitView(id, label);
              return true;
            }
            if (type === 'subject') {
              // Activate the subject panel via store — no direct fetch
              useSubjectStore.getState().setActiveSubject(id);
              return true;
            }
          }

          // ── MagicGloss vocabulary mark click routing ──────
          const $pos = view.state.doc.resolve(pos);
          const glossMark = $pos.marks().find(m => m.type.name === 'magicGloss');
          if (glossMark) {
            const range = getMarkRange($pos, glossMark.type);
            const coords = view.coordsAtPos(pos);
            setActiveGlossary({
              text: glossMark.attrs.comment ?? '',
              color: glossMark.attrs.color ?? '#fef08a',
              x: coords.left,
              y: coords.bottom + window.scrollY,
              from: range ? range.from : pos,
              to: range ? range.to : pos,
            });
            return true;
          }

          setActiveGlossary(null);
          return false;
        },
      },
      content: getSafeContent(note?.content_json),
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
    const currentContent = note?.content_json;
    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setContent(getSafeContent(currentContent));
    });
  }, [note?.id, editor]);

  // Dismiss MagicGloss card on Escape
  useEffect(() => {
    if (!activeGlossary) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveGlossary(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeGlossary]);



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
      <div className="flex-1 overflow-y-auto flex justify-center custom-scrollbar select-text bg-slate-100/60 py-8">
        <div 
          className="w-full max-w-[816px] shadow-sm border border-slate-200/50"
          style={{
            // A4 Web standard height is ~1056px.
            // We draw 1056px of white (the page), then 32px of transparent (the gap).
            backgroundImage: 'linear-gradient(to bottom, white 0px, white 1056px, transparent 1056px, transparent 1088px)',
            backgroundSize: '100% 1088px', // Total cycle is page + gap
            minHeight: '1088px', // Ensure at least 1 page + 1 gap exists
            paddingTop: '96px', // Top margin of first page
            paddingBottom: '96px', // Bottom margin allowing scroll
          }}
        >
          <div className="px-16 prose prose-slate max-w-full">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Floating MagicGloss Vocabulary Card */}
      {activeGlossary && (
        <div
          className="absolute glass-card border border-slate-200 p-3 rounded-xl shadow-xl z-50 w-60 bg-white"
          style={{ top: `${activeGlossary.y + 8}px`, left: `${activeGlossary.x - 20}px` }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeGlossary.color }}
              />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vocabulary</span>
            </div>
            <button
              onClick={() => setActiveGlossary(null)}
              className="text-slate-300 hover:text-slate-500 transition-colors text-xs leading-none"
              title="Close"
            >
              ✕
            </button>
          </div>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Add a note..."
            className="w-full text-sm text-slate-700 leading-relaxed min-h-[60px] p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300 mb-3 bg-slate-50 placeholder:text-slate-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                editor.chain().focus().setTextSelection({ from: activeGlossary.from, to: activeGlossary.to }).setMagicGloss({ color: activeGlossary.color, comment: editNote }).run();
                setActiveGlossary(null);
              }}
              className="flex-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-lg py-1.5 px-2 font-medium"
            >
              Save Note
            </button>
            <button
              onClick={() => {
                editor.commands.unsetMagicGloss();
                setActiveGlossary(null);
              }}
              className="flex-1 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors rounded-lg py-1.5 px-2 border border-rose-200"
            >
              Remove
            </button>
          </div>
        </div>
      )}



    </div>
  );
};
