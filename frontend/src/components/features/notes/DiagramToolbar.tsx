'use client';

/**
 * DiagramToolbar.tsx
 * Contextual toolbar for the Diagram block.
 *
 * The diagram engine is now diagrams.net (draw.io) embedded via iframe.
 * All drawing controls are provided by draw.io's native Kennedy UI,
 * so no external toolbar shell is needed. This component is kept as a
 * named export for compatibility with any parent that imports it, but
 * renders nothing.
 */

import React from 'react';
import { Editor } from '@tiptap/core';

interface DiagramToolbarProps {
  editor: Editor;
}

export const DiagramToolbar: React.FC<DiagramToolbarProps> = () => {
  // draw.io's built-in toolbar is embedded inside the NodeView iframe.
  // No external shell required.
  return null;
};
