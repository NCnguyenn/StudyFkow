import { create } from 'zustand';
import {
  FreeformBlock,
  FreeformBlockType,
  FreeformCanvasData,
  BlockStyle,
  BlockContent,
} from '../types/notes';

// ─── Tool Types ──────────────────────────────────────────────────────────────
export type FreeformTool =
  | 'select'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'rounded-rect'
  | 'diamond'
  | 'image';

// ─── Default Styles ──────────────────────────────────────────────────────────
export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  borderRadius: 12,
  opacity: 1,
  shadow: true,
};

export const DEFAULT_SHAPE_COLORS: Record<string, { bg: string; border: string }> = {
  rectangle: { bg: '#f1f5f9', border: '#cbd5e1' },
  circle: { bg: '#ede9fe', border: '#c4b5fd' },
  'rounded-rect': { bg: '#ecfdf5', border: '#a7f3d0' },
  diamond: { bg: '#fef3c7', border: '#fcd34d' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let blockIdCounter = 0;
export function generateBlockId(): string {
  blockIdCounter += 1;
  return `block-${Date.now()}-${blockIdCounter}`;
}

export function createDefaultBlock(
  type: FreeformBlockType,
  x: number,
  y: number,
  zIndex: number,
): FreeformBlock {
  const baseBlock: Omit<FreeformBlock, 'style' | 'content'> = {
    id: generateBlockId(),
    type,
    x,
    y,
    width: type === 'text' ? 280 : 200,
    height: type === 'text' ? 120 : 200,
    rotation: 0,
    zIndex,
    locked: false,
  };

  switch (type) {
    case 'text':
      return {
        ...baseBlock,
        style: {
          ...DEFAULT_BLOCK_STYLE,
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          shadow: true,
        },
        content: {
          text: '',
          fontSize: 14,
          fontFamily: 'Inter',
          fontWeight: '400',
          textAlign: 'left',
          textColor: '#1e293b',
          lineHeight: 1.6,
        },
      };

    case 'shape': {
      const shapeType = 'rectangle'; // default
      const colors = DEFAULT_SHAPE_COLORS[shapeType];
      return {
        ...baseBlock,
        type: 'shape',
        style: {
          ...DEFAULT_BLOCK_STYLE,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: 12,
        },
        content: {
          shapeType,
          label: '',
          labelColor: '#334155',
        },
      };
    }

    case 'image':
      return {
        ...baseBlock,
        width: 300,
        height: 220,
        style: {
          ...DEFAULT_BLOCK_STYLE,
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0',
          borderRadius: 16,
        },
        content: {
          imageUrl: '',
          imageFit: 'cover',
        },
      };

    default:
      return {
        ...baseBlock,
        style: { ...DEFAULT_BLOCK_STYLE },
        content: {},
      };
  }
}

// ─── Store Interface ─────────────────────────────────────────────────────────
interface FreeformState {
  // Canvas data
  blocks: FreeformBlock[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundPattern: 'blank' | 'grid' | 'dot' | 'lines';

  // Selection & Tool
  selectedBlockIds: string[];
  activeTool: FreeformTool;
  editingBlockId: string | null; // block with active text editing

  // Viewport
  canvasZoom: number;
  canvasPan: { x: number; y: number };

  // Grid
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;

  // Dirty flag for auto-save
  isDirty: boolean;

  // ─── Block CRUD ──────────────────────────────────────────────────
  addBlock: (block: FreeformBlock) => void;
  updateBlock: (id: string, updates: Partial<FreeformBlock>) => void;
  updateBlockStyle: (id: string, style: Partial<BlockStyle>) => void;
  updateBlockContent: (id: string, content: Partial<BlockContent>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;

  // ─── Selection ───────────────────────────────────────────────────
  selectBlock: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // ─── Z-Index ─────────────────────────────────────────────────────
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // ─── Tools & Viewport ────────────────────────────────────────────
  setActiveTool: (tool: FreeformTool) => void;
  setEditingBlock: (id: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundPattern: (pattern: 'blank' | 'grid' | 'dot' | 'lines') => void;

  // ─── Serialization ───────────────────────────────────────────────
  toCanvasData: () => FreeformCanvasData;
  loadCanvasData: (data: FreeformCanvasData) => void;
  resetCanvas: () => void;
  markClean: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useFreeformStore = create<FreeformState>((set, get) => ({
  // Initial state
  blocks: [],
  canvasWidth: 1200,
  canvasHeight: 1600,
  backgroundColor: '#ffffff',
  backgroundPattern: 'blank',
  selectedBlockIds: [],
  activeTool: 'select',
  editingBlockId: null,
  canvasZoom: 1,
  canvasPan: { x: 0, y: 0 },
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
  isDirty: false,

  // ─── Block CRUD ────────────────────────────────────────────────────────────

  addBlock: (block) =>
    set((s) => ({
      blocks: [...s.blocks, block],
      selectedBlockIds: [block.id],
      activeTool: 'select',
      isDirty: true,
    })),

  updateBlock: (id, updates) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
      isDirty: true,
    })),

  updateBlockStyle: (id, style) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, style: { ...b.style, ...style } } : b
      ),
      isDirty: true,
    })),

  updateBlockContent: (id, content) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, content: { ...b.content, ...content } } : b
      ),
      isDirty: true,
    })),

  deleteBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedBlockIds: s.selectedBlockIds.filter((sid) => sid !== id),
      editingBlockId: s.editingBlockId === id ? null : s.editingBlockId,
      isDirty: true,
    })),

  duplicateBlock: (id) => {
    const block = get().blocks.find((b) => b.id === id);
    if (!block) return;
    const maxZ = Math.max(0, ...get().blocks.map((b) => b.zIndex));
    const newBlock: FreeformBlock = {
      ...block,
      id: generateBlockId(),
      x: block.x + 24,
      y: block.y + 24,
      zIndex: maxZ + 1,
      locked: false,
    };
    set((s) => ({
      blocks: [...s.blocks, newBlock],
      selectedBlockIds: [newBlock.id],
      isDirty: true,
    }));
  },

  // ─── Selection ─────────────────────────────────────────────────────────────

  selectBlock: (id, multi = false) =>
    set((s) => {
      if (multi) {
        const isSelected = s.selectedBlockIds.includes(id);
        return {
          selectedBlockIds: isSelected
            ? s.selectedBlockIds.filter((sid) => sid !== id)
            : [...s.selectedBlockIds, id],
        };
      }
      return { selectedBlockIds: [id] };
    }),

  clearSelection: () =>
    set({ selectedBlockIds: [], editingBlockId: null }),

  selectAll: () =>
    set((s) => ({
      selectedBlockIds: s.blocks.map((b) => b.id),
    })),

  // ─── Z-Index ───────────────────────────────────────────────────────────────

  bringToFront: (id) =>
    set((s) => {
      const maxZ = Math.max(0, ...s.blocks.map((b) => b.zIndex));
      return {
        blocks: s.blocks.map((b) =>
          b.id === id ? { ...b, zIndex: maxZ + 1 } : b
        ),
        isDirty: true,
      };
    }),

  sendToBack: (id) =>
    set((s) => {
      const minZ = Math.min(0, ...s.blocks.map((b) => b.zIndex));
      return {
        blocks: s.blocks.map((b) =>
          b.id === id ? { ...b, zIndex: minZ - 1 } : b
        ),
        isDirty: true,
      };
    }),

  bringForward: (id) =>
    set((s) => {
      const block = s.blocks.find((b) => b.id === id);
      if (!block) return s;
      return {
        blocks: s.blocks.map((b) =>
          b.id === id ? { ...b, zIndex: block.zIndex + 1 } : b
        ),
        isDirty: true,
      };
    }),

  sendBackward: (id) =>
    set((s) => {
      const block = s.blocks.find((b) => b.id === id);
      if (!block) return s;
      return {
        blocks: s.blocks.map((b) =>
          b.id === id ? { ...b, zIndex: Math.max(0, block.zIndex - 1) } : b
        ),
        isDirty: true,
      };
    }),

  // ─── Tools & Viewport ─────────────────────────────────────────────────────

  setActiveTool: (tool) =>
    set({ activeTool: tool, editingBlockId: null }),

  setEditingBlock: (id) =>
    set({ editingBlockId: id }),

  setCanvasZoom: (zoom) =>
    set({ canvasZoom: Math.min(3, Math.max(0.25, zoom)) }),

  setCanvasPan: (pan) => set({ canvasPan: pan }),

  setShowGrid: (show) => set({ showGrid: show }),

  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  setBackgroundColor: (color) =>
    set({ backgroundColor: color, isDirty: true }),

  setBackgroundPattern: (pattern) =>
    set({ backgroundPattern: pattern, isDirty: true }),

  // ─── Serialization ────────────────────────────────────────────────────────

  toCanvasData: (): FreeformCanvasData => {
    const s = get();
    return {
      version: 1,
      editorMode: 'freeform',
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      backgroundColor: s.backgroundColor,
      backgroundPattern: s.backgroundPattern,
      blocks: s.blocks,
    };
  },

  loadCanvasData: (data) => {
    set({
      blocks: data.blocks || [],
      canvasWidth: data.canvasWidth || 1200,
      canvasHeight: data.canvasHeight || 1600,
      backgroundColor: data.backgroundColor || '#ffffff',
      backgroundPattern: data.backgroundPattern || 'blank',
      selectedBlockIds: [],
      editingBlockId: null,
      activeTool: 'select',
      isDirty: false,
    });
  },

  resetCanvas: () =>
    set({
      blocks: [],
      canvasWidth: 1200,
      canvasHeight: 1600,
      backgroundColor: '#ffffff',
      backgroundPattern: 'blank',
      selectedBlockIds: [],
      editingBlockId: null,
      activeTool: 'select',
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
      isDirty: false,
    }),

  markClean: () => set({ isDirty: false }),
}));
