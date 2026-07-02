// ═══════════════════════════════════════════════════════════════════════════════
// SpriteManifest — Room sprite configuration (R5.5)
// ═══════════════════════════════════════════════════════════════════════════════
// Defines position, depth, animation, and interaction for each room element.
// Virtual coordinate system: 1920x1080 (scaled to viewport)
// ═══════════════════════════════════════════════════════════════════════════════

export type IdleAnimation = 'wobble' | 'breathe' | 'sway' | 'flicker' | 'wind' | 'flutter';
export type HoverEffect = 'glow' | 'brighten' | 'pulse';

export interface SpriteConfig {
  id: string;
  label: string;
  src: string;
  srcNight?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Parallax depth: 0.0 (far/slow) → 1.0 (near/fast) */
  depth: number;
  idleAnimation: IdleAnimation;
  animation?: IdleAnimation; // Assign an animation string/union property to SpriteConfig
  idleIntensity: number;
  clickRoute: string | null;
  hoverEffect: HoverEffect;
  zIndex: number;
}

export const SPRITE_BASE_WIDTH = 1920;
export const SPRITE_BASE_HEIGHT = 1080;

// ─── Room Layout (Eye-level seated perspective) ─────────────────────────────
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  wall (background)                                       │
//  │  ┌──────┐                    ┌─────────┐    ┌─────┐     │
//  │  │shelf │  ┌──────────────┐  │ window  │    │clock│     │
//  │  │      │  │  corkboard   │  │  frame  │    └─────┘     │
//  │  │books │  └──────────────┘  │ curtain │  ┌──────────┐  │
//  │  └──────┘                    └─────────┘  │ calendar │  │
//  │──────────────────────────────────────────────────────────│
//  │  ┌─desk─────────────────────────────────────────────┐   │
//  │  │ lamp  laptop  notebook  coffee  pencils  plant   │   │
//  │  └──────────────────────────────────────────────────┘   │
//  │  plant_large (foreground)                    headphones  │
//  └─────────────────────────────────────────────────────────┘

export const ROOM_SPRITES: SpriteConfig[] = [
  // ═══ LAYER 0: Sky / Background (depth 0.0-0.1) ═══
  {
    id: 'wall',
    label: 'Tường phòng',
    src: '/assets/rooms/home/sprites/wall.png',
    x: 0, y: 0, width: 1920, height: 1080,
    depth: 0.0,
    idleAnimation: 'breathe', idleIntensity: 0.1,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 0,
  },

  // ═══ LAYER 1: Window area (depth 0.1-0.2) ═══
  {
    id: 'window_scene',
    label: 'Cảnh ngoài cửa sổ',
    src: '/assets/rooms/home/sprites/window_scene_day.png',
    srcNight: '/assets/rooms/home/sprites/window_scene_night.png',
    x: 720, y: 60, width: 420, height: 340,
    depth: 0.08,
    idleAnimation: 'breathe', idleIntensity: 0.2,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 1,
  },
  {
    id: 'window_frame',
    label: 'Khung cửa sổ',
    src: '/assets/rooms/home/sprites/window_frame.png',
    x: 700, y: 40, width: 460, height: 380,
    depth: 0.15,
    idleAnimation: 'breathe', idleIntensity: 0.1,
    clickRoute: null, hoverEffect: 'glow', zIndex: 2,
  },
  {
    id: 'curtain_left',
    label: 'Rèm trái',
    src: '/assets/rooms/home/sprites/curtain_left.png',
    x: 680, y: 30, width: 80, height: 400,
    depth: 0.18,
    idleAnimation: 'wind', idleIntensity: 0.6,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 3,
  },
  {
    id: 'curtain_right',
    label: 'Rèm phải',
    src: '/assets/rooms/home/sprites/curtain_right.png',
    x: 1100, y: 30, width: 80, height: 400,
    depth: 0.18,
    idleAnimation: 'wind', idleIntensity: 0.5,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 3,
  },

  // ═══ LAYER 2: Wall decorations (depth 0.2-0.35) ═══
  {
    id: 'bookshelf',
    label: 'Giá sách',
    src: '/assets/rooms/home/sprites/bookshelf.png',
    x: 60, y: 120, width: 260, height: 450,
    depth: 0.22,
    idleAnimation: 'breathe', idleIntensity: 0.15,
    clickRoute: '/planning', hoverEffect: 'glow', zIndex: 5,
  },
  {
    id: 'books_group1',
    label: 'Nhóm sách 1',
    src: '/assets/rooms/home/sprites/books_group1.png',
    x: 80, y: 160, width: 100, height: 120,
    depth: 0.25,
    idleAnimation: 'wobble', idleIntensity: 0.2,
    clickRoute: '/planning', hoverEffect: 'glow', zIndex: 6,
  },
  {
    id: 'books_group2',
    label: 'Nhóm sách 2',
    src: '/assets/rooms/home/sprites/books_group2.png',
    x: 80, y: 320, width: 100, height: 100,
    depth: 0.25,
    idleAnimation: 'wobble', idleIntensity: 0.15,
    clickRoute: '/planning', hoverEffect: 'glow', zIndex: 6,
  },
  {
    id: 'corkboard',
    label: 'Bảng ghim',
    src: '/assets/rooms/home/sprites/corkboard.png',
    x: 380, y: 100, width: 260, height: 200,
    depth: 0.20,
    idleAnimation: 'breathe', idleIntensity: 0.1,
    clickRoute: '/tasks', hoverEffect: 'glow', zIndex: 4,
  },
  {
    id: 'sticky_notes',
    label: 'Sticky Notes',
    src: '/assets/rooms/home/sprites/sticky_notes.png',
    x: 400, y: 130, width: 200, height: 140,
    depth: 0.24,
    idleAnimation: 'flutter', idleIntensity: 0.4,
    clickRoute: '/tasks', hoverEffect: 'pulse', zIndex: 7,
  },
  {
    id: 'clock',
    label: 'Đồng hồ',
    src: '/assets/rooms/home/sprites/clock.png',
    x: 1300, y: 80, width: 120, height: 120,
    depth: 0.18,
    idleAnimation: 'wobble', idleIntensity: 0.15,
    clickRoute: '/focus', hoverEffect: 'glow', zIndex: 5,
  },
  {
    id: 'calendar',
    label: 'Lịch treo',
    src: '/assets/rooms/home/sprites/calendar.png',
    x: 1480, y: 160, width: 140, height: 180,
    depth: 0.20,
    idleAnimation: 'flutter', idleIntensity: 0.2,
    clickRoute: '/insights', hoverEffect: 'glow', zIndex: 5,
  },
  {
    id: 'plant_hanging',
    label: 'Cây treo',
    src: '/assets/rooms/home/sprites/plant_hanging.png',
    x: 1200, y: 20, width: 160, height: 200,
    depth: 0.22,
    idleAnimation: 'sway', idleIntensity: 0.7,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 4,
  },

  // ═══ LAYER 3: Desk (depth 0.4-0.5) ═══
  {
    id: 'desk',
    label: 'Mặt bàn',
    src: '/assets/rooms/home/sprites/desk.png',
    x: 100, y: 580, width: 1720, height: 280,
    depth: 0.45,
    idleAnimation: 'breathe', idleIntensity: 0.05,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 10,
  },

  // ═══ LAYER 4: Desk items (depth 0.5-0.7) ═══
  {
    id: 'desk_lamp',
    label: 'Đèn bàn',
    src: '/assets/rooms/home/sprites/desk_lamp.png',
    x: 180, y: 440, width: 120, height: 180,
    depth: 0.55,
    idleAnimation: 'flicker', idleIntensity: 0.5,
    clickRoute: null, hoverEffect: 'glow', zIndex: 15,
  },
  {
    id: 'laptop',
    label: 'Laptop',
    src: '/assets/rooms/home/sprites/laptop.png',
    x: 480, y: 480, width: 360, height: 200,
    depth: 0.55,
    idleAnimation: 'breathe', idleIntensity: 0.15,
    clickRoute: '/notes', hoverEffect: 'glow', zIndex: 14,
  },
  {
    id: 'notebook',
    label: 'Vở ghi chú',
    src: '/assets/rooms/home/sprites/notebook.png',
    x: 900, y: 560, width: 160, height: 100,
    depth: 0.58,
    idleAnimation: 'wobble', idleIntensity: 0.2,
    clickRoute: '/notes', hoverEffect: 'glow', zIndex: 13,
  },
  {
    id: 'coffee_mug',
    label: 'Cốc cà phê',
    src: '/assets/rooms/home/sprites/coffee_mug.png',
    x: 1120, y: 540, width: 80, height: 90,
    depth: 0.60,
    idleAnimation: 'wobble', idleIntensity: 0.15,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 16,
  },
  {
    id: 'pencils',
    label: 'Bút',
    src: '/assets/rooms/home/sprites/pencils.png',
    x: 1260, y: 520, width: 60, height: 120,
    depth: 0.58,
    idleAnimation: 'wobble', idleIntensity: 0.25,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 14,
  },
  {
    id: 'headphones',
    label: 'Tai nghe',
    src: '/assets/rooms/home/sprites/headphones.png',
    x: 1400, y: 540, width: 120, height: 80,
    depth: 0.60,
    idleAnimation: 'wobble', idleIntensity: 0.15,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 13,
  },
  {
    id: 'plant_small',
    label: 'Chậu cây nhỏ',
    src: '/assets/rooms/home/sprites/plant_small.png',
    x: 1560, y: 490, width: 100, height: 130,
    depth: 0.62,
    idleAnimation: 'sway', idleIntensity: 0.6,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 15,
  },

  // ═══ LAYER 5: Foreground (depth 0.75-1.0) ═══
  {
    id: 'desk_edge',
    label: 'Mép bàn',
    src: '/assets/rooms/home/sprites/desk_edge.png',
    x: 60, y: 820, width: 1800, height: 60,
    depth: 0.80,
    idleAnimation: 'breathe', idleIntensity: 0.03,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 20,
  },
  {
    id: 'plant_large',
    label: 'Chậu cây lớn',
    src: '/assets/rooms/home/sprites/plant_large.png',
    x: 20, y: 650, width: 200, height: 350,
    depth: 0.85,
    idleAnimation: 'sway', idleIntensity: 0.8,
    clickRoute: null, hoverEffect: 'brighten', zIndex: 22,
  },
];
