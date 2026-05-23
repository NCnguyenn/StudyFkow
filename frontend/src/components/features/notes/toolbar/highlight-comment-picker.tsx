'use client';

import React, { useState } from 'react';
import { type Editor } from '@tiptap/core';
import { Highlighter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GLOSS_COLORS: { label: string; value: string }[] = [
  { label: 'Yellow',  value: '#fef08a' },
  { label: 'Lime',    value: '#d9f99d' },
  { label: 'Green',   value: '#bbf7d0' },
  { label: 'Sky',     value: '#bae6fd' },
  { label: 'Blue',    value: '#bfdbfe' },
  { label: 'Violet',  value: '#ddd6fe' },
  { label: 'Pink',    value: '#fbcfe8' },
  { label: 'Peach',   value: '#fed7aa' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HighlightCommentPickerProps {
  editor: Editor;
}

export const HighlightCommentPicker: React.FC<HighlightCommentPickerProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = (color: string) => {
    editor.chain().focus().setMagicGloss({ color, comment: '' }).run();
    setIsOpen(false);
  };

  const handleRemove = () => {
    editor.chain().focus().unsetMagicGloss().run();
    setIsOpen(false);
  };

  const isActive = editor.isActive('magicGloss');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* ── Trigger ── */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Vocabulary Highlight (MagicGloss)"
          className={cn(
            'h-7 w-7 p-0 transition-colors',
            isActive
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
              : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <Highlighter className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>

      {/* ── Content ── */}
      <PopoverContent
        align="start"
        className="w-48 glass-card p-3 border-slate-200 z-50 bg-white shadow-xl rounded-xl"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.commands.focus();
        }}
      >
        {/* Header */}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Vocabulary Highlight
        </p>

        {/* Color Swatch Grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {GLOSS_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => handleApply(c.value)}
              className="w-full aspect-square rounded-md border border-slate-200 hover:scale-105 hover:border-slate-300 transition-all duration-150"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="flex-1 h-7 text-xs text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors"
          >
            Remove Highlight
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
