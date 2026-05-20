'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code2, Indent, Outdent,
  Highlighter, Type, RemoveFormatting, ChevronDown,
  Table as TableIcon, Image as ImageIcon, PenTool, Loader2,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api-utils';

interface StudioToolbarProps { editor: Editor; }

// ── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: 'Default',         value: '' },
  { label: 'Inter',           value: 'Inter, sans-serif' },
  { label: 'Arial',           value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia',         value: 'Georgia, serif' },
  { label: 'Roboto',          value: 'Roboto, sans-serif' },
  { label: 'Merriweather',    value: 'Merriweather, serif' },
  { label: 'Fira Code',       value: '"Fira Code", monospace' },
  { label: 'Courier New',     value: '"Courier New", monospace' },
];

const FONT_SIZES = [
  '10px','11px','12px','13px','14px','16px','18px','20px',
  '24px','28px','32px','36px','48px','60px',
];

const TEXT_COLORS = [
  { label: 'Black',      value: '#0f172a' }, { label: 'Dark Grey', value: '#475569' },
  { label: 'Light Grey', value: '#94a3b8' }, { label: 'Red',       value: '#dc2626' },
  { label: 'Orange',     value: '#ea580c' }, { label: 'Amber',     value: '#d97706' },
  { label: 'Green',      value: '#16a34a' }, { label: 'Teal',      value: '#0d9488' },
  { label: 'Blue',       value: '#2563eb' }, { label: 'Indigo',    value: '#4f46e5' },
  { label: 'Purple',     value: '#7c3aed' }, { label: 'Pink',      value: '#db2777' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' }, { label: 'Lime',   value: '#d9f99d' },
  { label: 'Green',  value: '#bbf7d0' }, { label: 'Sky',    value: '#bae6fd' },
  { label: 'Blue',   value: '#bfdbfe' }, { label: 'Violet', value: '#ddd6fe' },
  { label: 'Pink',   value: '#fecdd3' }, { label: 'Peach',  value: '#fed7aa' },
];

const PARAGRAPH_STYLES = [
  { label: 'Paragraph',  action: (e: Editor) => e.chain().focus().setParagraph().run(),                isActive: (e: Editor) => e.isActive('paragraph') },
  { label: 'Heading 1',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(),  isActive: (e: Editor) => e.isActive('heading', { level: 1 }) },
  { label: 'Heading 2',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(),  isActive: (e: Editor) => e.isActive('heading', { level: 2 }) },
  { label: 'Heading 3',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(),  isActive: (e: Editor) => e.isActive('heading', { level: 3 }) },
  { label: 'Heading 4',  action: (e: Editor) => e.chain().focus().toggleHeading({ level: 4 }).run(),  isActive: (e: Editor) => e.isActive('heading', { level: 4 }) },
  { label: 'Code Block', action: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),            isActive: (e: Editor) => e.isActive('codeBlock') },
  { label: 'Quote',      action: (e: Editor) => e.chain().focus().toggleBlockquote().run(),           isActive: (e: Editor) => e.isActive('blockquote') },
];

// ── Primitives ───────────────────────────────────────────────────────────────

const TBtn: React.FC<{
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title} disabled={disabled}
    className={[
      'p-1.5 rounded-lg transition-all duration-100 shrink-0',
      active ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
      disabled ? 'opacity-30 cursor-not-allowed' : '',
    ].join(' ')}
  >{children}</button>
);

const Sep = () => <div className="w-px h-5 bg-slate-200 mx-1 shrink-0 self-center" />;

const DropdownPanel: React.FC<{
  trigger: React.ReactNode; children: React.ReactNode;
  title?: string; panelClassName?: string;
}> = ({ trigger, children, title, panelClassName = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative shrink-0" title={title}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap select-none"
      >
        {trigger}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className={[
          'absolute top-full left-0 mt-1.5 z-50',
          'bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-300/40',
          panelClassName,
        ].join(' ')}>
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
};

// ── Feature dropdowns ────────────────────────────────────────────────────────

const ParagraphStyleDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const active = PARAGRAPH_STYLES.find(s => s.isActive(editor)) ?? PARAGRAPH_STYLES[0];
  return (
    <DropdownPanel trigger={<span className="text-xs font-medium w-24 truncate text-left">{active.label}</span>} panelClassName="w-44 p-1">
      {PARAGRAPH_STYLES.map(style => (
        <button key={style.label}
          onMouseDown={(e) => { e.preventDefault(); style.action(editor); }}
          className={['w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
            style.isActive(editor) ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}
        >{style.label}</button>
      ))}
    </DropdownPanel>
  );
};

const FontFamilyDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const cur = editor.getAttributes('textStyle').fontFamily ?? '';
  return (
    <DropdownPanel trigger={<span className="w-[80px] truncate text-left text-xs">{FONT_FAMILIES.find(f => f.value === cur)?.label ?? 'Font'}</span>} panelClassName="w-48 p-1">
      {FONT_FAMILIES.map(font => (
        <button key={font.value || '__default__'}
          onMouseDown={(e) => { e.preventDefault(); font.value ? editor.chain().focus().setFontFamily(font.value).run() : editor.chain().focus().unsetFontFamily().run(); }}
          className={['w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors',
            cur === font.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'].join(' ')}
          style={{ fontFamily: font.value || 'inherit' }}
        >{font.label}</button>
      ))}
    </DropdownPanel>
  );
};

const FontSizeDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const cur = editor.getAttributes('textStyle').fontSize ?? '16px';
  return (
    <DropdownPanel trigger={<span className="w-10 text-center text-xs">{cur.replace('px', '')}</span>} panelClassName="w-24 p-1 max-h-64 overflow-y-auto">
      {FONT_SIZES.map(size => (
        <button key={size}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setFontSize(size).run(); }}
          className={['w-full text-left px-3 py-1 text-sm rounded-lg transition-colors',
            cur === size ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}
        >{size.replace('px', '')}</button>
      ))}
    </DropdownPanel>
  );
};

const TextColorDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const cur = editor.getAttributes('textStyle').color ?? '#0f172a';
  const pickerRef = useRef<HTMLInputElement>(null);
  return (
    <DropdownPanel
      trigger={<div className="flex flex-col items-center gap-0.5"><Type className="w-3.5 h-3.5 text-slate-600" /><div className="w-3.5 h-1 rounded-sm" style={{ backgroundColor: cur }} /></div>}
      title="Text color" panelClassName="w-52 p-3"
    >
      <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: cur }} onClick={() => pickerRef.current?.click()} />
        <input ref={pickerRef} type="color" value={cur} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="opacity-0 w-0 h-0 absolute" />
        <span className="text-xs text-slate-500 font-mono">{cur.toUpperCase()}</span>
        <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Reset</button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {TEXT_COLORS.map(c => (
          <button key={c.value} onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); }}
            className="w-6 h-6 rounded-md border border-slate-100 hover:scale-110 hover:shadow-md transition-all" style={{ backgroundColor: c.value }} title={c.label} />
        ))}
      </div>
    </DropdownPanel>
  );
};

const HighlightDropdown: React.FC<{ editor: Editor }> = ({ editor }) => (
  <DropdownPanel trigger={<Highlighter className="w-3.5 h-3.5 text-amber-500" />} title="Highlight color" panelClassName="w-48 p-3">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Highlight</p>
    <div className="grid grid-cols-4 gap-1.5 mb-2">
      {HIGHLIGHT_COLORS.map(c => (
        <button key={c.value} onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c.value }).run(); }}
          className="w-8 h-8 rounded-lg border border-slate-200 hover:scale-110 hover:shadow transition-all" style={{ backgroundColor: c.value }} title={c.label} />
      ))}
    </div>
    <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 pt-1 border-t border-slate-100 transition-colors">
      Remove highlight
    </button>
  </DropdownPanel>
);

const AlignmentGroup: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className="flex items-center gap-0.5">
    <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Align left"><AlignLeft    className="w-4 h-4" /></TBtn>
    <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Align center"><AlignCenter  className="w-4 h-4" /></TBtn>
    <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Align right"><AlignRight   className="w-4 h-4" /></TBtn>
    <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify className="w-4 h-4" /></TBtn>
  </div>
);

// ── Table Matrix Grid ────────────────────────────────────────────────────────

const TableMatrixPicker: React.FC<{ editor: Editor; onClose: () => void }> = ({ editor, onClose }) => {
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const ROWS = 10, COLS = 10;
  return (
    <div className="p-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {hovered.r > 0 && hovered.c > 0 ? `${hovered.r} × ${hovered.c} table` : 'Insert table'}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: ROWS * COLS }).map((_, idx) => {
          const r = Math.floor(idx / COLS) + 1;
          const c = (idx % COLS) + 1;
          const active = r <= hovered.r && c <= hovered.c;
          return (
            <div
              key={idx}
              className={['w-5 h-5 border rounded-sm cursor-pointer transition-colors', active ? 'bg-indigo-400 border-indigo-500' : 'bg-slate-100 border-slate-200 hover:bg-indigo-100'].join(' ')}
              onMouseEnter={() => setHovered({ r, c })}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                onClose();
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Image Upload Button ──────────────────────────────────────────────────────

const ImageUploadButton: React.FC<{ editor: Editor }> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5 MB.');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file); // backend field named 'audio' for backward compat
      const res = await fetchWithAuth('/api/v1/notes/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      const url: string = json?.data?.url ?? '';
      if (url) {
        editor.chain().focus().setImage({ src: `http://localhost:8000${url}` }).run();
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <button
        onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
        disabled={isUploading}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
        <div className="text-left">
          <div className="font-medium text-xs">{isUploading ? 'Uploading…' : 'Image'}</div>
          <div className="text-[10px] text-slate-400">Upload from device</div>
        </div>
      </button>
    </>
  );
};

// ── Insert Dropdown ──────────────────────────────────────────────────────────

const InsertDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap select-none"
      >
        <span className="font-medium">Insert</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-300/40 min-w-[220px]">

          {/* Table matrix */}
          <TableMatrixPicker editor={editor} onClose={() => setOpen(false)} />

          <div className="border-t border-slate-100 p-1.5 space-y-0.5">
            {/* Image upload — live in Phase 4 */}
            <ImageUploadButton editor={editor} />

            {/* Whiteboard — future Phase 5 */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              disabled
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 cursor-not-allowed opacity-60"
              title="Coming soon"
            >
              <PenTool className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-xs">Whiteboard</div>
                <div className="text-[10px]">Draw &amp; sketch inline</div>
              </div>
              <span className="ml-auto text-[9px] font-semibold bg-violet-100 text-violet-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Soon</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main StudioToolbar ───────────────────────────────────────────────────────

export const StudioToolbar: React.FC<StudioToolbarProps> = ({ editor }) => (
  <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 flex flex-col shrink-0 select-none">

    {/* Row 1: History · Style · Font · Size · Headings */}
    <div className="flex items-center gap-0.5 px-3 pt-1.5 pb-1 flex-wrap">
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo ⌘Z"><Undo2 className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo ⌘⇧Z"><Redo2 className="w-4 h-4" /></TBtn>
      <Sep />
      <ParagraphStyleDropdown editor={editor} />
      <Sep />
      <FontFamilyDropdown editor={editor} />
      <Sep />
      <FontSizeDropdown editor={editor} />
      <Sep />
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="w-4 h-4" /></TBtn>
    </div>

    {/* Row 2: Typography · Colors · Align · Lists · Indent · Clear · Insert */}
    <div className="flex items-center gap-0.5 px-3 pb-1.5 flex-wrap">
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive('bold')}      title="Bold ⌘B"><Bold        className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive('italic')}    title="Italic ⌘I"><Italic      className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline ⌘U"><Underline   className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()}    active={editor.isActive('strike')}    title="Strikethrough"><Strikethrough className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCode().run()}      active={editor.isActive('code')}      title="Inline code ⌘E"><Code       className="w-4 h-4" /></TBtn>
      <Sep />
      <TextColorDropdown editor={editor} />
      <HighlightDropdown editor={editor} />
      <Sep />
      <AlignmentGroup editor={editor} />
      <Sep />
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet list"><List        className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}  active={editor.isActive('blockquote')}  title="Blockquote"><Quote        className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}   active={editor.isActive('codeBlock')}   title="Code block"><Code2        className="w-4 h-4" /></TBtn>
      <Sep />
      <TBtn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent"><Indent  className="w-4 h-4" /></TBtn>
      <TBtn onClick={() => editor.chain().focus().liftListItem('listItem').run()}  title="Outdent"><Outdent className="w-4 h-4" /></TBtn>
      <Sep />
      <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting"><RemoveFormatting className="w-4 h-4" /></TBtn>
      <Sep />
      <InsertDropdown editor={editor} />
    </div>
  </div>
);
