'use client';

import React from 'react';
import { Editor } from '@tiptap/core';

interface StudioToolbarProps { editor: Editor; }

export const StudioToolbar: React.FC<StudioToolbarProps> = ({ editor }) => {
  return (
    <div className="sticky top-0 z-30 flex flex-col w-full min-h-[80px] border-b border-slate-200 bg-slate-50/60 backdrop-blur-md select-none shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
    </div>
  );
};
