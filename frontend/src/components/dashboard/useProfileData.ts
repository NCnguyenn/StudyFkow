"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import localforage from "localforage";

// ─── Types ──────────────────────────────────────────────────────────

export type WidgetType = "text" | "media" | "memory" | "clock" | "stats" | "lofi" | "floating";
export type FontFamily = "sans" | "serif" | "cursive";
export type WidgetShape = "rounded-xl" | "square" | "circle" | "pill";
export type AvatarShape = "circle" | "rounded-square";
export type AvatarFit = "cover" | "contain";

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

export interface WidgetStyles {
  fontSize?: number;
  fontFamily?: FontFamily;
  textColor?: string;
  borderRadius?: number;
  imageFit?: "cover" | "contain";
  shape?: WidgetShape;
  tintColor?: string;   // e.g. "rgba(255,182,193,0.1)"
  tintOpacity?: number; // 0-100
  noBackground?: boolean;
}

export interface WidgetConfig {
  textContent?: string;
  imageKey?: string;
  memoryImageKey?: string;
  captionText?: string;
  postText?: string;
  mantraText?: string;
  clockStyle?: "digital" | "analog";
  iconName?: string;
}

export interface WidgetItem {
  id: string;
  type: WidgetType;
  layout: WidgetLayout;
  config: WidgetConfig;
  styles: WidgetStyles;
}

// ─── Persistence Keys ───────────────────────────────────────────────

const LS = {
  name: "sf_name", bio: "sf_bio", loc: "sf_loc", occ: "sf_occ",
  avatarShape: "sf_av_shape", avatarFit: "sf_av_fit",
  widgets: "sf_canvas_v3",
} as const;
const LF = { avatar: "sf_avatar", cover: "sf_cover" } as const;

// ─── Default Canvas ─────────────────────────────────────────────────

const DEFAULTS: WidgetItem[] = [
  { id: "w-stats",  type: "stats",  layout: { x: 20, y: 20, w: 380, h: 160, zIndex: 1 }, config: {}, styles: {} },
  { id: "w-clock",  type: "clock",  layout: { x: 420, y: 20, w: 300, h: 160, zIndex: 1 }, config: { clockStyle: "digital" }, styles: {} },
  { id: "w-text",   type: "text",   layout: { x: 20, y: 200, w: 340, h: 140, zIndex: 1 }, config: { textContent: "" }, styles: { fontFamily: "serif", fontSize: 22, textColor: "#818cf8" } },
  { id: "w-lofi",   type: "lofi",   layout: { x: 380, y: 200, w: 340, h: 180, zIndex: 1 }, config: {}, styles: {} },
];

// ─── Hook ───────────────────────────────────────────────────────────

export function useProfileData() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [displayName, setDisplayName] = useState("Explorer");
  const [bioText, setBioText] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [avatarShape, setAvatarShape] = useState<AvatarShape>("circle");
  const [avatarFit, setAvatarFit] = useState<AvatarFit>("cover");
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULTS);
  const mountRef = useRef(true);

  useEffect(() => {
    mountRef.current = true;
    const load = async () => {
      const n = localStorage.getItem(LS.name);
      if (n) setDisplayName(n); else setShowOnboarding(true);
      const b = localStorage.getItem(LS.bio); if (b) setBioText(b);
      const l = localStorage.getItem(LS.loc); if (l) setLocation(l);
      const o = localStorage.getItem(LS.occ); if (o) setOccupation(o);
      const sh = localStorage.getItem(LS.avatarShape) as AvatarShape | null; if (sh) setAvatarShape(sh);
      const fi = localStorage.getItem(LS.avatarFit) as AvatarFit | null; if (fi) setAvatarFit(fi);
      const sw = localStorage.getItem(LS.widgets);
      if (sw) { try { const p = JSON.parse(sw); if (Array.isArray(p) && p.length) setWidgets(p.map((w: WidgetItem) => ({ ...w, layout: w.layout ?? { x: 0, y: 0, w: 300, h: 180, zIndex: 1 }, styles: w.styles ?? {} }))); } catch {} }
      const [av, cv] = await Promise.all([localforage.getItem<string>(LF.avatar), localforage.getItem<string>(LF.cover)]);
      if (mountRef.current) { if (av) setAvatarBase64(av); if (cv) setCoverBase64(cv); setIsHydrated(true); }
    };
    load();
    return () => { mountRef.current = false; };
  }, []);

  const persist = useCallback((items: WidgetItem[]) => { setWidgets(items); localStorage.setItem(LS.widgets, JSON.stringify(items)); }, []);

  // Simple setters
  const updateDisplayName = useCallback((v: string) => { setDisplayName(v); localStorage.setItem(LS.name, v); }, []);
  const updateBio = useCallback((v: string) => { setBioText(v); localStorage.setItem(LS.bio, v); }, []);
  const updateLocation = useCallback((v: string) => { setLocation(v); localStorage.setItem(LS.loc, v); }, []);
  const updateOccupation = useCallback((v: string) => { setOccupation(v); localStorage.setItem(LS.occ, v); }, []);
  const updateAvatarShape = useCallback((v: AvatarShape) => { setAvatarShape(v); localStorage.setItem(LS.avatarShape, v); }, []);
  const updateAvatarFit = useCallback((v: AvatarFit) => { setAvatarFit(v); localStorage.setItem(LS.avatarFit, v); }, []);
  const uploadAvatar = useCallback(async (file: File) => { const r = new FileReader(); r.onload = async (e) => { const b = e.target?.result as string; setAvatarBase64(b); await localforage.setItem(LF.avatar, b); }; r.readAsDataURL(file); }, []);
  const uploadCover = useCallback(async (file: File) => { const r = new FileReader(); r.onload = async (e) => { const b = e.target?.result as string; setCoverBase64(b); await localforage.setItem(LF.cover, b); }; r.readAsDataURL(file); }, []);

  // Widget CRUD
  const addWidget = useCallback((type: WidgetType): string => {
    const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const layout: WidgetLayout = { x: 40 + Math.random() * 200, y: 40 + Math.random() * 100, w: type === "floating" ? 200 : 320, h: type === "floating" ? 60 : 180, zIndex: widgets.length + 1 };
    let config: WidgetConfig = {};
    let styles: WidgetStyles = {};
    if (type === "text") { config = { textContent: "" }; styles = { fontFamily: "serif", fontSize: 20, textColor: "#6366f1" }; }
    if (type === "media") { config = { imageKey: `img_${id}` }; styles = { imageFit: "cover", shape: "rounded-xl" }; }
    if (type === "memory") { config = { memoryImageKey: `mem_${id}`, captionText: "" }; styles = { fontFamily: "serif", fontSize: 14, imageFit: "cover" }; }
    if (type === "clock") config = { clockStyle: "digital" };
    if (type === "floating") { config = { textContent: "✨" }; styles = { noBackground: true, fontSize: 32, fontFamily: "serif" }; }
    persist([...widgets, { id, type, layout, config, styles }]);
    return id;
  }, [widgets, persist]);

  const removeWidget = useCallback((id: string) => {
    const t = widgets.find(w => w.id === id);
    if (t?.config.imageKey) localforage.removeItem(t.config.imageKey);
    if (t?.config.memoryImageKey) localforage.removeItem(t.config.memoryImageKey);
    persist(widgets.filter(w => w.id !== id));
  }, [widgets, persist]);

  const updateWidget = useCallback((id: string, cfgP?: Partial<WidgetConfig>, styP?: Partial<WidgetStyles>, layP?: Partial<WidgetLayout>) => {
    persist(widgets.map(w => w.id !== id ? w : {
      ...w,
      config: cfgP ? { ...w.config, ...cfgP } : w.config,
      styles: styP ? { ...w.styles, ...styP } : w.styles,
      layout: layP ? { ...w.layout, ...layP } : w.layout,
    }));
  }, [widgets, persist]);

  const bringToFront = useCallback((id: string) => {
    const maxZ = Math.max(...widgets.map(w => w.layout.zIndex), 0);
    updateWidget(id, undefined, undefined, { zIndex: maxZ + 1 });
  }, [widgets, updateWidget]);

  return {
    isHydrated, showOnboarding, setShowOnboarding,
    displayName, bioText, location, occupation,
    avatarBase64, coverBase64, avatarShape, avatarFit,
    updateDisplayName, updateBio, updateLocation, updateOccupation,
    updateAvatarShape, updateAvatarFit, uploadAvatar, uploadCover,
    widgets, addWidget, removeWidget, updateWidget, bringToFront, persist,
  };
}
