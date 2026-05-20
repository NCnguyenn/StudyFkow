'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Palette, Highlighter, Type, ChevronDown
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

const TEXT_COLORS = [
  '#000000', '#374151', '#6B7280', '#DC2626', '#EA580C', '#D97706',
  '#16A34A', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#E11D48',
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fecdd3' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Teal', value: '#99f6e4' },
  { label: 'None', value: '' },
];

// Reusable Dropdown Button
const DropdownButton: React.FC<{
  label: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  minW?: string;
}> = ({ label, children, title, minW = 'w-36' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" title={title}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
      >
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className={`absolute top-full left-0 mt-1 ${minW} glass-card shadow-xl border border-slate-200 rounded-xl p-1 z-50 max-h-60 overflow-y-auto custom-scrollbar`}>
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  onClick: (e: React.MouseEvent) => {
                    (child.props as any)?.onClick?.(e);
                    setOpen(false);
                  },
                })
              : child
          )}
        </div>
      )}
    </div>
  );
};

// Toolbar button
const TBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg transition-colors ${
      active ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    {children}
  </button>
);

// Separator
const Sep = () => <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const getCurrentFontFamily = useCallback(() => {
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontFamily || '';
  }, [editor]);

  const getCurrentFontSize = useCallback(() => {
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontSize || '16px';
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex-wrap shrink-0">
      {/* Undo / Redo */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 className="w-4 h-4" />
      </TBtn>

      <Sep />

      {/* Font Family */}
      <DropdownButton
        label={<><Type className="w-3.5 h-3.5" /> <span className="max-w-[80px] truncate">{FONT_FAMILIES.find(f => f.value === getCurrentFontFamily())?.label || 'Font'}</span></>}
        title="Font Family"
        minW="w-44"
      >
        {FONT_FAMILIES.map(font => (
          <button
            key={font.value}
            onClick={() => font.value ? editor.chain().focus().setFontFamily(font.value).run() : editor.chain().focus().unsetFontFamily().run()}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 transition-colors ${getCurrentFontFamily() === font.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'}`}
            style={{ fontFamily: font.value || 'inherit' }}
          >
            {font.label}
          </button>
        ))}
      </DropdownButton>

      {/* Font Size */}
      <DropdownButton
        label={<span className="text-xs">{getCurrentFontSize()}</span>}
        title="Font Size"
        minW="w-24"
      >
        {FONT_SIZES.map(size => (
          <button
            key={size}
            onClick={() => editor.chain().focus().setFontSize(size).run()}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 transition-colors ${getCurrentFontSize() === size ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'}`}
          >
            {size}
          </button>
        ))}
      </DropdownButton>

      <Sep />

      {/* Headings */}
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 className="w-4 h-4" />
      </TBtn>

      <Sep />

      {/* Typography */}
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <Underline className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </TBtn>

      <Sep />

      {/* Text Color */}
      <DropdownButton
        label={<Palette className="w-3.5 h-3.5" />}
        title="Text Color"
        minW="w-auto"
      >
        <div className="grid grid-cols-6 gap-1 p-1">
          {TEXT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <button
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 text-slate-500 mt-1"
        >
          Reset Color
        </button>
      </DropdownButton>

      {/* Highlight Color */}
      <DropdownButton
        label={<Highlighter className="w-3.5 h-3.5" />}
        title="Highlight Color"
        minW="w-auto"
      >
        <div className="grid grid-cols-4 gap-1 p-1">
          {HIGHLIGHT_COLORS.filter(c => c.value).map(color => (
            <button
              key={color.value}
              onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
              className="w-7 h-7 rounded-lg border border-slate-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
        <button
          onClick={() => editor.chain().focus().unsetHighlight().run()}
          className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 text-slate-500 mt-1"
        >
          Remove Highlight
        </button>
      </DropdownButton>

      <Sep />

      {/* Alignment */}
      <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify className="w-4 h-4" />
      </TBtn>

      <Sep />

      {/* Lists */}
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List className="w-4 h-4" />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <ListOrdered className="w-4 h-4" />
      </TBtn>

      <Sep />

      {/* Table */}
      <TBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table (3×3)"
      >
        <TableIcon className="w-4 h-4" />
      </TBtn>
    </div>
  );
};
