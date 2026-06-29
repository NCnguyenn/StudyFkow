// ═══════════════════════════════════════════════════════════════════════════════
// Room Types — v4.0 Unified Room-as-UI System
// ═══════════════════════════════════════════════════════════════════════════════

/** Interactive hotspot zone positioned over a room object. */
export interface RoomHotspot {
  /** Unique identifier for this hotspot */
  id: string;
  /** Human-readable label (used for aria-label) */
  label: string;
  /** Next.js route to navigate to on click */
  route: string;
  /** Bounding box within the room image (CSS percentage values) */
  bounds: { x: string; y: string; w: string; h: string };
  /** Camera zoom destination when this hotspot is activated */
  zoomTarget: { x: string; y: string; scale: number };
  /** Hover animation type — CSS class applied on hover */
  hoverEffect: 'brighten' | 'pulse' | 'glow';
}

/** Room zoom state machine states */
export type ZoomState = 'idle' | 'zooming' | 'zoomed' | 'unzooming';

/** Configuration for a room theme */
export interface RoomConfig {
  /** Room theme name */
  theme: string;
  /** Viewpoint angle */
  viewpoint: 'eye-level' | 'isometric';
  /** Composite images */
  base: {
    room: { src: string; priority: number };
    deskCloseup?: { src: string; priority: number };
  };
  /** Interactive hotspot zones */
  hotspots: RoomHotspot[];
}
