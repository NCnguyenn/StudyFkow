'use client';

import React from 'react';
import { Editor } from '@tiptap/core';

interface ChartToolbarProps { editor: Editor; }

export const ChartToolbar: React.FC<ChartToolbarProps> = ({ editor }) => {
  return <div className="h-10 w-full"></div>;
};
