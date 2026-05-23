/**
 * useEditorBlockStore.ts
 * Zustand bridge store for communication between isolated NodeViews
 * and the global StudioToolbar.
 *
 * Architecture:
 * - DiagramBlockView renders Excalidraw inline (no external editor instance needed)
 * - ChartToolbar READS/WRITES via Tiptap editor commands (no store needed)
 * - SpreadsheetModal visibility is toggled via this store
 */

import { create } from 'zustand';

interface EditorBlockState {
  /** SpreadsheetModal visibility for chart data editing */
  spreadsheetOpen: boolean;
  setSpreadsheetOpen: (open: boolean) => void;
}

export const useEditorBlockStore = create<EditorBlockState>((set) => ({
  spreadsheetOpen: false,
  setSpreadsheetOpen: (open) => set({ spreadsheetOpen: open }),
}));
