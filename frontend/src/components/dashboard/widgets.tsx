"use client";
import { useState, useRef, useEffect } from "react";
import { Clock, Flame, Loader2, Radio, Volume2, VolumeX, Upload, Image as ImageIcon, Cloud, Wifi, X, Settings } from "lucide-react";
import localforage from "localforage";
import { useAppStore } from "@/store/useAppStore";
import type { WidgetItem, WidgetConfig, WidgetStyles, WidgetLayout, FontFamily } from "./useProfileData";
import type { AnalyticsSummary } from "@/features/analytics/api/analyticsApi";

const FONTS: Record<FontFamily, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  cursive: "'Segoe Script', 'Dancing Script', cursive",
};



// ─── Shape helper ──────────────────────────────────────────────────
function shapeClass(s?: string) {
  if (s === "circle") return "rounded-full";
  if (s === "pill") return "rounded-[9999px]";
  if (s === "square") return "rounded-none";
  return "rounded-2xl";
}

// ─── Widget Shell ──────────────────────────────────────────────────
export interface WProps {
  widget: WidgetItem;
  isEdit: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, c?: Partial<WidgetConfig>, s?: Partial<WidgetStyles>, l?: Partial<WidgetLayout>) => void;
  analyticsData?: AnalyticsSummary | null;
  analyticsLoading?: boolean;
}

function Shell({ widget, isEdit, onRemove, onUpdate, children, className = "" }: WProps & { children: React.ReactNode; className?: string }) {
  const { soulColor, isLiteMode } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);
  const s = widget.styles;
  const noBg = s.noBackground;
  const tint = s.tintColor ?? "transparent";
  const sc = shapeClass(s.shape);

  const base = noBg
    ? "bg-transparent border-none shadow-none"
    : isLiteMode
      ? "bg-white/90 shadow-sm border border-slate-200"
      : "backdrop-blur-xl bg-white/40 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]";

  return (
    <div
      className={`relative w-full h-full ${sc} ${base} overflow-hidden transition-all ${className}`}
      style={{
        backgroundColor: noBg ? "transparent" : undefined,
        boxShadow: noBg ? "none" : `0 4px 20px -5px ${soulColor}25`,
        ...(tint !== "transparent" && !noBg ? { background: `linear-gradient(135deg, ${tint}, rgba(255,255,255,0.4))` } : {}),
      }}
    >
      {isEdit && (
        <div className="absolute top-1 right-1 z-50 flex gap-1 opacity-0 hover:opacity-100 group-hover/w:opacity-100 transition-opacity">
          <button onClick={() => setShowPanel(p => !p)} className="p-1 rounded-md bg-white/80 backdrop-blur text-slate-500 hover:text-indigo-600 shadow-sm"><Settings className="w-3 h-3" /></button>
          <button onClick={() => onRemove(widget.id)} className="p-1 rounded-md bg-red-500/90 text-white shadow-sm hover:bg-red-600"><X className="w-3 h-3" /></button>
        </div>
      )}
      {showPanel && <StylePanel widget={widget} onUpdate={onUpdate} onClose={() => setShowPanel(false)} />}
      <div className="w-full h-full p-4 overflow-auto custom-scrollbar">{children}</div>
    </div>
  );
}

// ─── Style Panel ───────────────────────────────────────────────────
function StylePanel({ widget, onUpdate, onClose }: { widget: WidgetItem; onUpdate: WProps["onUpdate"]; onClose: () => void }) {
  const { soulColor } = useAppStore();
  const s = widget.styles;
  const showText = ["text", "floating", "memory"].includes(widget.type);
  const showMedia = ["media", "memory"].includes(widget.type);

  return (
    <div className="absolute top-8 right-1 z-[60] w-56 backdrop-blur-2xl bg-white/85 border border-white/60 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Styles</span>
        <button onClick={onClose}><X className="w-3 h-3 text-slate-400" /></button>
      </div>

      {/* Shape */}
      <div>
        <label className="text-[9px] font-semibold text-slate-400 uppercase">Shape</label>
        <div className="flex gap-1 mt-0.5">
          {(["rounded-xl", "square", "circle", "pill"] as const).map(sh => (
            <button key={sh} onClick={() => onUpdate(widget.id, undefined, { shape: sh })}
              className={`flex-1 py-0.5 rounded text-[9px] font-bold border transition-all ${s.shape === sh || (!s.shape && sh === "rounded-xl") ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white/40 text-slate-500 border-white/40"}`}>
              {sh === "rounded-xl" ? "Round" : sh === "square" ? "Sharp" : sh === "circle" ? "Circle" : "Pill"}
            </button>
          ))}
        </div>
      </div>

      {/* Tint */}
      <div>
        <label className="text-[9px] font-semibold text-slate-400 uppercase">Glass Tint</label>
        <div className="flex items-center gap-1 mt-0.5">
          {["transparent", "rgba(255,182,193,0.1)", "rgba(173,216,230,0.1)", "rgba(144,238,144,0.1)", "rgba(255,218,185,0.1)"].map(c => (
            <button key={c} onClick={() => onUpdate(widget.id, undefined, { tintColor: c })}
              className={`w-5 h-5 rounded-full border-2 transition-all ${s.tintColor === c ? "border-indigo-400 scale-110" : "border-white/40"}`}
              style={{ background: c === "transparent" ? "white" : c }} />
          ))}
          <button onClick={() => onUpdate(widget.id, undefined, { tintColor: `${soulColor}15` })}
            className="text-[8px] px-1.5 py-0.5 rounded bg-white/40 text-slate-500 font-bold border border-white/40">Soul</button>
        </div>
      </div>

      {showText && (
        <>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase">Font ({s.fontSize ?? 16}px)</label>
            <input type="range" min={10} max={48} value={s.fontSize ?? 16} onChange={e => onUpdate(widget.id, undefined, { fontSize: +e.target.value })} className="w-full accent-indigo-500 h-1" />
          </div>
          <div className="flex gap-1">
            {(["sans", "serif", "cursive"] as FontFamily[]).map(f => (
              <button key={f} onClick={() => onUpdate(widget.id, undefined, { fontFamily: f })}
                className={`flex-1 py-0.5 rounded text-[9px] font-bold border ${(s.fontFamily ?? "sans") === f ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white/40 text-slate-500 border-white/40"}`}
                style={{ fontFamily: FONTS[f] }}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[9px] font-semibold text-slate-400 uppercase">Color</label>
            <input type="color" value={s.textColor ?? "#334155"} onChange={e => onUpdate(widget.id, undefined, { textColor: e.target.value })} className="w-5 h-5 rounded border-none cursor-pointer bg-transparent" />
            <button onClick={() => onUpdate(widget.id, undefined, { textColor: soulColor })} className="text-[8px] px-1.5 py-0.5 rounded bg-white/40 text-slate-500 font-bold border border-white/40">Soul</button>
          </div>
        </>
      )}
      {showMedia && (
        <div className="flex gap-1">
          {(["cover", "contain"] as const).map(f => (
            <button key={f} onClick={() => onUpdate(widget.id, undefined, { imageFit: f })}
              className={`flex-1 py-0.5 rounded text-[9px] font-bold border ${(s.imageFit ?? "cover") === f ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white/40 text-slate-500 border-white/40"}`}>{f}</button>
          ))}
        </div>
      )}

      {/* No-background toggle */}
      <button onClick={() => onUpdate(widget.id, undefined, { noBackground: !s.noBackground })}
        className={`w-full py-1 rounded text-[9px] font-bold border transition-all ${s.noBackground ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white/40 text-slate-500 border-white/40"}`}>
        {s.noBackground ? "✓ Floating (No BG)" : "Make Floating"}
      </button>
    </div>
  );
}

// ─── 1. Text Widget ────────────────────────────────────────────────
export function TextWidget(p: WProps) {
  const s = p.widget.styles;
  return (
    <Shell {...p}>
      <textarea value={p.widget.config.textContent ?? ""} onChange={e => p.onUpdate(p.widget.id, { textContent: e.target.value })}
        placeholder="Write anything…" className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 placeholder-slate-300 leading-relaxed focus:outline-none custom-scrollbar"
        style={{ fontSize: `${s.fontSize ?? 16}px`, fontFamily: FONTS[s.fontFamily ?? "sans"], color: s.textColor ?? "#334155" }} />
    </Shell>
  );
}

// ─── 2. Floating Text/Icon ─────────────────────────────────────────
export function FloatingWidget(p: WProps) {
  const s = p.widget.styles;
  return (
    <Shell {...p}>
      <textarea value={p.widget.config.textContent ?? ""} onChange={e => p.onUpdate(p.widget.id, { textContent: e.target.value })}
        placeholder="✨ Type or paste emoji…" className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 placeholder-slate-300 text-center focus:outline-none"
        style={{ fontSize: `${s.fontSize ?? 32}px`, fontFamily: FONTS[s.fontFamily ?? "serif"], color: s.textColor ?? "#6366f1" }} />
    </Shell>
  );
}

// ─── 3. Media Widget ───────────────────────────────────────────────
export function MediaWidget(p: WProps) {
  const [img, setImg] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const key = p.widget.config.imageKey;
  useEffect(() => { if (key) { let a = true; localforage.getItem<string>(key).then(d => { if (a && d) setImg(d); }); return () => { a = false; }; } }, [key]);
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !key) return; const r = new FileReader(); r.onload = async ev => { const b = ev.target?.result as string; setImg(b); await localforage.setItem(key, b); }; r.readAsDataURL(f); };
  return (
    <Shell {...p} className="p-0">
      {img ? (
        <div className="w-full h-full relative group/img">
          <img src={img} alt="" className={`w-full h-full ${p.widget.styles.imageFit === "contain" ? "object-contain" : "object-cover"}`} />
          <button onClick={() => ref.current?.click()} className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 p-1.5 rounded-lg bg-white/80 backdrop-blur text-slate-600 shadow transition-opacity"><Upload className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors">
          <ImageIcon className="w-8 h-8" /><span className="text-xs font-medium">Upload Image / GIF</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*,image/gif" onChange={upload} className="hidden" />
    </Shell>
  );
}

// ─── 4. Memory Widget ──────────────────────────────────────────────
export function MemoryWidget(p: WProps) {
  const [img, setImg] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const key = p.widget.config.memoryImageKey;
  const s = p.widget.styles;
  useEffect(() => { if (key) { let a = true; localforage.getItem<string>(key).then(d => { if (a && d) setImg(d); }); return () => { a = false; }; } }, [key]);
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f || !key) return; const r = new FileReader(); r.onload = async ev => { const b = ev.target?.result as string; setImg(b); await localforage.setItem(key, b); }; r.readAsDataURL(f); };
  return (
    <Shell {...p}>
      {img ? <img src={img} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: "60%" }} onClick={() => ref.current?.click()} /> : (
        <button onClick={() => ref.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300/50 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors"><ImageIcon className="w-6 h-6" /></button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={upload} className="hidden" />
      <textarea value={p.widget.config.captionText ?? ""} onChange={e => p.onUpdate(p.widget.id, { captionText: e.target.value })}
        placeholder="Caption…" rows={2} className="w-full mt-2 bg-transparent border-none resize-none focus:ring-0 p-0 placeholder-slate-300 italic leading-relaxed focus:outline-none custom-scrollbar"
        style={{ fontSize: `${s.fontSize ?? 14}px`, fontFamily: FONTS[s.fontFamily ?? "serif"], color: s.textColor ?? "#475569" }} />
    </Shell>
  );
}

// ─── 5. Clock Widget ───────────────────────────────────────────────
export function ClockWidget(p: WProps) {
  const { soulColor } = useAppStore();
  const [now, setNow] = useState(new Date());
  const dig = p.widget.config.clockStyle !== "analog";
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const sA = now.getSeconds() * 6, mA = now.getMinutes() * 6 + now.getSeconds() * 0.1, hA = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  return (
    <Shell {...p}>
      <div className="flex items-start justify-between gap-3 h-full">
        <div className="flex-1">
          {dig ? (
            <div><div className="text-2xl font-mono font-light tracking-widest text-slate-700 tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</div></div>
          ) : (
            <svg width="70" height="70" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" /><circle cx="40" cy="40" r="34" fill="rgba(255,255,255,0.15)" />
              <line x1="40" y1="40" x2={40 + 20 * Math.sin(hA * Math.PI / 180)} y2={40 - 20 * Math.cos(hA * Math.PI / 180)} stroke={soulColor} strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="40" x2={40 + 28 * Math.sin(mA * Math.PI / 180)} y2={40 - 28 * Math.cos(mA * Math.PI / 180)} stroke="rgba(71,85,105,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="40" x2={40 + 30 * Math.sin(sA * Math.PI / 180)} y2={40 - 30 * Math.cos(sA * Math.PI / 180)} stroke="#f87171" strokeWidth="1" strokeLinecap="round" />
              <circle cx="40" cy="40" r="3" fill={soulColor} /></svg>
          )}
          <button onClick={() => p.onUpdate(p.widget.id, { clockStyle: dig ? "analog" : "digital" })} className="mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-white/40 border border-white/50 text-slate-500 hover:text-indigo-600 transition-all">{dig ? "Analog" : "Digital"}</button>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Cloud className="w-7 h-7 text-sky-400" />
          <div className="text-base font-semibold text-slate-700">24°C</div>
          <div className="text-[9px] text-slate-400 font-medium">Cloudy</div>
          <div className="flex items-center gap-0.5 mt-0.5"><Wifi className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[8px] text-slate-400">mock</span></div>
        </div>
      </div>
    </Shell>
  );
}

// ─── 6. Stats Widget ───────────────────────────────────────────────
function fmtMin(m: number) { if (m < 60) return `${Math.round(m)}m`; const h = Math.floor(m / 60); const r = Math.round(m % 60); return r > 0 ? `${h}h ${r}m` : `${h}h`; }
export function StatsWidget(p: WProps) {
  const { soulColor } = useAppStore();
  const d = p.analyticsData; const ld = p.analyticsLoading;
  return (
    <Shell {...p}>
      <div className="flex items-center justify-between mb-2"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Energy</h3>{ld && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}</div>
      <div className="grid grid-cols-2 gap-2">
        {[{ i: <Clock className="w-4 h-4" />, l: "Focus", v: d ? fmtMin(d.total_minutes_today) : "--" },
          { i: <Flame className="w-4 h-4" />, l: "Streak", v: d ? `${d.current_streak_days}d` : "--" }].map(s => (
          <div key={s.l} className="flex items-center gap-2 bg-white/20 p-2.5 rounded-xl border border-white/30">
            <div className="p-2 rounded-full bg-white/50" style={{ color: soulColor }}>{s.i}</div>
            <div><p className="text-[9px] text-slate-500 uppercase font-semibold">{s.l}</p><p className="text-lg font-bold text-slate-800">{s.v}</p></div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ─── 7. Lofi Widget ────────────────────────────────────────────────
const TRACKS = [
  { id: "rain", label: "🌧 Rain", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_1e0941f70a.mp3" },
  { id: "cafe", label: "☕ Café", url: "https://cdn.pixabay.com/audio/2023/04/08/audio_9e93e55b91.mp3" },
  { id: "fire", label: "🔥 Fire", url: "https://cdn.pixabay.com/audio/2022/01/13/audio_f14571a2c1.mp3" },
];
export function LofiWidget(p: WProps) {
  const [trk, setTrk] = useState(TRACKS[0]);
  const [play, setPlay] = useState(false);
  const [vol, setVol] = useState(0.35);
  const aRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (aRef.current) aRef.current.volume = vol; }, [vol]);
  useEffect(() => { if (!aRef.current) return; if (play) aRef.current.play().catch(() => setPlay(false)); else aRef.current.pause(); }, [play, trk]);
  return (
    <Shell {...p}>
      <div className="flex items-center gap-2 mb-2"><Radio className="w-3.5 h-3.5 text-indigo-400 animate-breathe" /><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lofi Soundscape</h3></div>
      <div className="flex gap-1.5 mb-2">{TRACKS.map(t => (
        <button key={t.id} onClick={() => { setTrk(t); setPlay(false); setTimeout(() => setPlay(true), 100); }}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${trk.id === t.id ? "bg-indigo-100/60 text-indigo-700 border-indigo-200/50" : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"}`}>{t.label}</button>
      ))}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setPlay(v => !v)} className="p-1.5 rounded-lg bg-white/30 hover:bg-white/50 border border-white/40 text-slate-700 transition-all">{play ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}</button>
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e => setVol(+e.target.value)} className="flex-1 accent-indigo-500 h-1 cursor-pointer" />
        <span className="text-[10px] text-slate-500 w-7 text-right">{Math.round(vol * 100)}%</span>
      </div>
      <audio ref={aRef} src={trk.url} loop preload="none" />
    </Shell>
  );
}
