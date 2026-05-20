"use client";
/**
 * FreeformCanvas — Infinite Vision Board Engine
 *
 * Uses react-rnd for absolute-positioned, draggable, resizable widgets.
 * Studio Mode: floating glassmorphism toolbox + dim overlay.
 * Invented Features:
 *   1. Focus Particles — CSS-only ambient floating dust
 *   2. Time-of-Day Lighting — background hue shifts
 *   3. Depth Shadows — higher zIndex = deeper shadow
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  Settings2, Plus, X,
  BarChart3, Type, ImageIcon, BookImage,
  Clock, Radio, Sparkles,
} from "lucide-react";
import {
  TextWidget, FloatingWidget, MediaWidget, MemoryWidget,
  ClockWidget, StatsWidget, LofiWidget,
} from "./widgets";
import type { WidgetItem, WidgetType, WidgetConfig, WidgetStyles, WidgetLayout } from "./useProfileData";
import type { AnalyticsSummary } from "@/features/analytics/api/analyticsApi";

// ─── Time-of-Day Lighting ──────────────────────────────────────────
function useTimeOfDay() {
  const [hour, setHour] = useState(new Date().getHours());
  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(t);
  }, []);
  // Returns a subtle CSS filter overlay based on time
  if (hour >= 6 && hour < 10) return "rgba(255,200,100,0.04)";  // morning warmth
  if (hour >= 10 && hour < 16) return "rgba(255,255,255,0)";    // bright day
  if (hour >= 16 && hour < 19) return "rgba(255,140,50,0.05)";  // golden hour
  return "rgba(100,120,200,0.06)";                               // night cool
}

// ─── Focus Particles (CSS-only) ────────────────────────────────────
function FocusParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 animate-float"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${220 + Math.random() * 40}, 80%, 75%)`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Studio Toolbox ────────────────────────────────────────────────
const CATALOGUE: { type: WidgetType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { type: "text",     label: "Text Block",      desc: "Quote, note, intention",   icon: <Type className="w-4 h-4" />,      color: "text-violet-500" },
  { type: "floating", label: "Floating Text",    desc: "No BG, pure typography",  icon: <Sparkles className="w-4 h-4" />,  color: "text-amber-500" },
  { type: "media",    label: "Image / GIF",      desc: "Photo in glass frame",    icon: <ImageIcon className="w-4 h-4" />, color: "text-pink-500" },
  { type: "memory",   label: "Memory Card",      desc: "Photo + caption",         icon: <BookImage className="w-4 h-4" />, color: "text-rose-500" },
  { type: "stats",    label: "Study Stats",      desc: "Focus time & streak",     icon: <BarChart3 className="w-4 h-4" />, color: "text-emerald-500" },
  { type: "clock",    label: "Clock & Weather",  desc: "Aesthetic time widget",   icon: <Clock className="w-4 h-4" />,     color: "text-sky-500" },
  { type: "lofi",     label: "Lofi Sounds",      desc: "Ambient audio mixer",     icon: <Radio className="w-4 h-4" />,     color: "text-indigo-500" },
];

function StudioToolbox({ onAdd, onClose }: { onAdd: (t: WidgetType) => void; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[70] w-64 backdrop-blur-2xl bg-white/80 border border-white/60 rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-xs font-bold text-slate-800">Studio Toolbox</p><p className="text-[9px] text-slate-400">Drag a block onto your canvas</p></div>
        <button onClick={onClose} className="p-1 rounded-xl bg-white/50 text-slate-500 hover:text-slate-700 transition-all"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {CATALOGUE.map(c => (
          <button key={c.type} onClick={() => { onAdd(c.type); onClose(); }}
            className="flex items-start gap-2 p-2.5 rounded-xl bg-white/40 hover:bg-white/70 border border-white/50 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]">
            <div className={`p-1.5 rounded-lg bg-white/60 border border-white/40 ${c.color} shrink-0`}>{c.icon}</div>
            <div className="min-w-0"><p className="text-[10px] font-semibold text-slate-700 leading-tight truncate">{c.label}</p><p className="text-[9px] text-slate-400 leading-tight">{c.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Canvas ───────────────────────────────────────────────────
interface CanvasProps {
  widgets: WidgetItem[];
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  onAdd: (type: WidgetType) => string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, c?: Partial<WidgetConfig>, s?: Partial<WidgetStyles>, l?: Partial<WidgetLayout>) => void;
  onBringToFront: (id: string) => void;
  analyticsData: AnalyticsSummary | null;
  analyticsLoading: boolean;
}

export function FreeformCanvas({
  widgets, isEditMode, setIsEditMode,
  onAdd, onRemove, onUpdate, onBringToFront,
  analyticsData, analyticsLoading,
}: CanvasProps) {
  const [showToolbox, setShowToolbox] = useState(false);
  const timeTint = useTimeOfDay();

  // Compute canvas height: max widget bottom + padding
  const canvasH = useMemo(() => {
    if (!widgets.length) return 600;
    return Math.max(600, ...widgets.map(w => w.layout.y + w.layout.h + 80));
  }, [widgets]);

  const renderWidget = useCallback((w: WidgetItem) => {
    const props = {
      widget: w,
      isEdit: isEditMode,
      onRemove,
      onUpdate,
      analyticsData,
      analyticsLoading,
    };
    switch (w.type) {
      case "text":     return <TextWidget {...props} />;
      case "floating": return <FloatingWidget {...props} />;
      case "media":    return <MediaWidget {...props} />;
      case "memory":   return <MemoryWidget {...props} />;
      case "clock":    return <ClockWidget {...props} />;
      case "stats":    return <StatsWidget {...props} />;
      case "lofi":     return <LofiWidget {...props} />;
      default:         return null;
    }
  }, [isEditMode, onRemove, onUpdate, analyticsData, analyticsLoading]);

  const toggleEdit = () => {
    if (isEditMode) { setIsEditMode(false); setShowToolbox(false); }
    else setIsEditMode(true);
  };

  return (
    <div className="space-y-3 mt-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between sticky top-0 z-30 py-1">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isEditMode ? "✏️ Studio Mode" : "Vision Canvas"}
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button onClick={() => setShowToolbox(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.97]">
              <Plus className="w-3.5 h-3.5" />Add Block
            </button>
          )}
          <button onClick={toggleEdit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isEditMode ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white/30 text-slate-600 border-white/40 hover:bg-white/50"
            }`}>
            <Settings2 className="w-3.5 h-3.5" />{isEditMode ? "Done" : "Edit Layout"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative w-full rounded-3xl overflow-hidden border border-white/30"
        style={{ height: `${canvasH}px`, minHeight: "500px" }}
      >
        {/* Time-of-day tint */}
        <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-[5000ms]"
          style={{ background: timeTint }} />

        {/* Subtle grid dots in edit mode */}
        {isEditMode && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
            style={{ backgroundImage: "radial-gradient(circle, rgba(100,116,139,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        )}

        {/* Focus particles */}
        <FocusParticles />

        {/* Edit mode dim */}
        {isEditMode && <div className="absolute inset-0 z-[1] bg-slate-900/5 pointer-events-none" />}

        {/* Widgets */}
        {widgets.map(w => {
          const depthShadow = `0 ${4 + w.layout.zIndex * 2}px ${16 + w.layout.zIndex * 4}px rgba(0,0,0,${0.03 + w.layout.zIndex * 0.005})`;
          return (
            <Rnd
              key={w.id}
              position={{ x: w.layout.x, y: w.layout.y }}
              size={{ width: w.layout.w, height: w.layout.h }}
              minWidth={120}
              minHeight={60}
              disableDragging={!isEditMode}
              enableResizing={isEditMode}
              onDragStart={() => onBringToFront(w.id)}
              onDragStop={(_e, d) => onUpdate(w.id, undefined, undefined, { x: d.x, y: d.y })}
              onResizeStop={(_e, _dir, ref, _delta, pos) => {
                onUpdate(w.id, undefined, undefined, {
                  x: pos.x, y: pos.y,
                  w: parseInt(ref.style.width), h: parseInt(ref.style.height),
                });
              }}
              style={{ zIndex: w.layout.zIndex }}
              className={`group/w ${isEditMode ? "cursor-grab active:cursor-grabbing" : ""}`}
              bounds="parent"
              resizeHandleStyles={isEditMode ? {
                bottomRight: { width: 12, height: 12, right: -2, bottom: -2, cursor: "nwse-resize", background: "rgba(99,102,241,0.4)", borderRadius: "4px" },
                bottomLeft: { width: 12, height: 12, left: -2, bottom: -2, cursor: "nesw-resize", background: "rgba(99,102,241,0.4)", borderRadius: "4px" },
                topRight: { width: 12, height: 12, right: -2, top: -2, cursor: "nesw-resize", background: "rgba(99,102,241,0.4)", borderRadius: "4px" },
                topLeft: { width: 12, height: 12, left: -2, top: -2, cursor: "nwse-resize", background: "rgba(99,102,241,0.4)", borderRadius: "4px" },
              } : {
                bottomRight: { display: "none" }, bottomLeft: { display: "none" },
                topRight: { display: "none" }, topLeft: { display: "none" },
                top: { display: "none" }, bottom: { display: "none" },
                left: { display: "none" }, right: { display: "none" },
              }}
            >
              <div className="w-full h-full" style={{ filter: `drop-shadow(${depthShadow})` }}>
                {renderWidget(w)}
              </div>
            </Rnd>
          );
        })}

        {/* Empty state */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10">
            <Sparkles className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm font-medium">Your canvas is empty</p>
            <p className="text-xs mt-1">Click &quot;Edit Layout&quot; → &quot;Add Block&quot; to begin.</p>
          </div>
        )}
      </div>

      {/* Studio Toolbox */}
      {showToolbox && <StudioToolbox onAdd={onAdd} onClose={() => setShowToolbox(false)} />}
    </div>
  );
}
