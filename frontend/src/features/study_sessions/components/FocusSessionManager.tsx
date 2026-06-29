"use client";
/**
 * FocusSessionManager — Ethereal Deep Focus Workspace
 *
 * 2-step experience:
 *   Step 1: Setup Modal ("Prepare Your Space") — Pomodoro presets, soundscape, task selector
 *   Step 2: Deep Focus Workspace — Zen Clock SVG, floating panels, soundscape mini-player
 *
 * CRITICAL: useStudySession hook is NEVER modified. We compose around it.
 *
 * Pro Features:
 *   - Page Visibility API strict mode (tab-switch detection)
 *   - 4-7-8 Guided Breathing during breaks
 *   - Offline-resilient timer state in localStorage
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Square, RotateCcw, Coffee,
  Volume2, VolumeX, ChevronDown, ChevronUp,
  StickyNote, CheckSquare, Eye, EyeOff,
  Wind, Music, CloudRain, Flame,
} from "lucide-react";
import localforage from "localforage";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { useFocusStore } from "@/store/useFocusStore";
import { useNoteStore } from "@/store/useNoteStore";
import { useStudySession } from "../hooks/useStudySession";

// ─── Pomodoro Presets ──────────────────────────────────────────────
const PRESETS = [
  { label: "Classic", focusMin: 25, breakMin: 5 },
  { label: "Deep Work", focusMin: 50, breakMin: 10 },
  { label: "Sprint", focusMin: 15, breakMin: 3 },
];

// ─── Ambient Sounds ────────────────────────────────────────────────
const AMBIENTS = [
  { id: "rain", label: "🌧 Rain", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_1e0941f70a.mp3" },
  { id: "fire", label: "🔥 Fire", url: "https://cdn.pixabay.com/audio/2022/01/13/audio_f14571a2c1.mp3" },
  { id: "cafe", label: "☕ Café", url: "https://cdn.pixabay.com/audio/2023/04/08/audio_9e93e55b91.mp3" },
];

// ─── Helpers ───────────────────────────────────────────────────────
function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Zen Clock SVG ─────────────────────────────────────────────────
function ZenClock({ progress, phase, soulColor }: { progress: number; phase: "focus" | "break"; soulColor: string }) {
  const r = 120, cx = 140, cy = 140, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const glowColor = phase === "focus" ? soulColor : "#f472b6";
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 animate-breathe">
      <svg viewBox="0 0 280 280" className="w-full h-full">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
        {/* Progress arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={glowColor} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 12px ${glowColor}60)`, transition: "stroke-dashoffset 1s linear" }} />
        {/* Glow center dot */}
        <circle cx={cx} cy={cy} r="4" fill={glowColor} style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
      </svg>
      {/* Phase label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500/70">
          {phase === "focus" ? "Focus" : "Break"}
        </span>
      </div>
    </div>
  );
}

// ─── Breathing Guide (4-7-8 method) ────────────────────────────────
function BreathingGuide() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [sec, setSec] = useState(0);
  const durations = { inhale: 4, hold: 7, exhale: 8 };

  useEffect(() => {
    const t = setInterval(() => {
      setSec(prev => {
        const next = prev + 1;
        if (phase === "inhale" && next >= durations.inhale) { setPhase("hold"); return 0; }
        if (phase === "hold" && next >= durations.hold) { setPhase("exhale"); return 0; }
        if (phase === "exhale" && next >= durations.exhale) { setPhase("inhale"); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const scale = phase === "inhale" ? 1.3 : phase === "hold" ? 1.3 : 0.8;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-300/40 to-purple-300/40 backdrop-blur border border-white/30 transition-transform duration-[4000ms] ease-in-out"
        style={{ transform: `scale(${scale})` }} />
      <p className="text-sm font-medium text-slate-600 uppercase tracking-widest animate-pulse">
        {phase === "inhale" ? "Breathe In..." : phase === "hold" ? "Hold..." : "Breathe Out..."}
      </p>
      <p className="text-xs text-slate-400">4-7-8 Breathing Technique</p>
    </div>
  );
}

// ─── Mini Audio Player ─────────────────────────────────────────────
function AmbientPlayer() {
  const [active, setActive] = useState<string | null>(null);
  const [vol, setVol] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (active) { audioRef.current.src = AMBIENTS.find(a => a.id === active)?.url ?? ""; audioRef.current.volume = vol; audioRef.current.play().catch(() => {}); }
    else audioRef.current.pause();
  }, [active]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol; }, [vol]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {AMBIENTS.map(a => (
        <button key={a.id} onClick={() => setActive(active === a.id ? null : a.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            active === a.id ? "bg-indigo-100/60 text-indigo-700 border-indigo-200/50" : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"
          }`}>{a.label}</button>
      ))}
      {active && (
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e => setVol(+e.target.value)}
          className="w-20 accent-indigo-500 h-1 cursor-pointer" />
      )}
      <audio ref={audioRef} loop preload="none" />
    </div>
  );
}

// ─── Quick Note Panel ──────────────────────────────────────────────
function QuickNotePanel({ taskTitle }: { taskTitle?: string }) {
  const [text, setText] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  // Persist quick note to localStorage
  useEffect(() => { const s = localStorage.getItem("sf_quick_note"); if (s) setText(s); }, []);
  useEffect(() => { localStorage.setItem("sf_quick_note", text); }, [text]);

  // Listen for auto-clear from session manager
  useEffect(() => {
    const handleClear = () => setText("");
    window.addEventListener("quick_note_cleared", handleClear);
    return () => window.removeEventListener("quick_note_cleared", handleClear);
  }, []);

  if (collapsed) return (
    <button onClick={() => setCollapsed(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-slate-500 hover:bg-white/40 text-xs font-semibold transition-all">
      <StickyNote className="w-3.5 h-3.5" />Quick Note
    </button>
  );

  return (
    <GlassCard className="w-72 p-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Note {taskTitle && <span className="text-indigo-500 normal-case">— {taskTitle}</span>}
        </span>
        <button onClick={() => setCollapsed(true)}><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Dump thoughts without breaking flow..."
        className="w-full h-24 bg-transparent border-none resize-none text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-0 leading-relaxed" />
    </GlassCard>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function FocusSessionManager({ linkedTaskTitle }: { linkedTaskTitle?: string }) {
  const { soulColor } = useAppStore();
  const s = useStudySession();

  // Pomodoro local state
  const [preset, setPreset] = useState(PRESETS[0]);
  const [isLoopMode, setIsLoopMode] = useState(false);
  const [pomoPhase, setPomoPhase] = useState<"focus" | "break">("focus");
  const [pomoSec, setPomoSec] = useState(0);
  const [customFocus, setCustomFocus] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [isCustom, setIsCustom] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  // Tab visibility strict mode
  const [tabWarning, setTabWarning] = useState(false);
  const hiddenSince = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => {
      if (document.hidden && s.state === "ACTIVE") {
        hiddenSince.current = Date.now();
      } else if (!document.hidden && hiddenSince.current) {
        const elapsed = Date.now() - hiddenSince.current;
        if (elapsed > 10000) setTabWarning(true);
        hiddenSince.current = null;
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [s.state]);

  // Pomodoro timer (runs alongside the real session timer)
  const focusDur = isCustom ? customFocus * 60 : preset.focusMin * 60;
  const breakDur = isCustom ? customBreak * 60 : preset.breakMin * 60;

  useEffect(() => {
    if (s.state !== "ACTIVE") return;
    const t = setInterval(() => {
      setPomoSec(prev => {
        const next = prev + 1;
        const limit = pomoPhase === "focus" ? focusDur : breakDur;
        if (next >= limit) {
          // Switch phase
          const nextPhase = pomoPhase === "focus" ? "break" : "focus";
          setPomoPhase(nextPhase);
          if (!isLoopMode && pomoPhase === "break") { s.end(); }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [s.state, pomoPhase, focusDur, breakDur, isLoopMode]);

  const progress = pomoPhase === "focus" ? pomoSec / focusDur : pomoSec / breakDur;

  // Dynamic aura
  const focusAura = `radial-gradient(ellipse at 30% 20%, ${soulColor}12, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.08), transparent 50%)`;
  const breakAura = `radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.08), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(244,114,182,0.1), transparent 50%)`;

  const handleStart = async () => {
    setShowSetup(false);
    setPomoSec(0);
    setPomoPhase("focus");
    await s.start(linkedTaskTitle ?? "Focus Session", useFocusStore.getState().linkedTaskId);
  };

  // Auto-create Note from Quick Note on session end
  useEffect(() => {
    if (s.state === "SUMMARY") {
      const qn = localStorage.getItem("sf_quick_note");
      if (qn && qn.trim() !== "") {
        const taskId = useFocusStore.getState().linkedTaskId;
        useNoteStore.getState().createNote(
          null,
          `Quick Note - ${linkedTaskTitle || 'Focus Session'}`,
          taskId ? [taskId] : []
        ).then((id) => {
          if (id) {
            const content = {
              type: "doc",
              content: [{ type: "paragraph", content: [{ type: "text", text: qn }] }]
            };
            useNoteStore.getState().updateLocalNote(id, { content_json: content });
            useNoteStore.getState().syncNoteToServer(id, { content_json: content });
            localStorage.removeItem("sf_quick_note");
            
            // Dispatch a custom event to update QuickNotePanel if it's still mounted
            window.dispatchEvent(new Event("quick_note_cleared"));
          }
        });
      }
    }
  }, [s.state, linkedTaskTitle]);

  // ─── IDLE / ERROR: Show Setup Modal ──────────────────────────────
  if (s.state === "IDLE" || s.state === "ERROR" || s.state === "REQUESTING") {
    return (
      <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <GlassCard className="p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Prepare Your Space</h2>
            <p className="text-sm text-slate-500 mt-1">Choose your rhythm and ambiance</p>
          </div>

          {/* Pomodoro Presets */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pomodoro Preset</label>
            <div className="flex gap-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setPreset(p); setIsCustom(false); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    !isCustom && preset.label === p.label ? "bg-indigo-100/60 text-indigo-700 border-indigo-200" : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"
                  }`}>{p.label}<br /><span className="text-[10px] text-slate-400">{p.focusMin}/{p.breakMin}m</span></button>
              ))}
              <button onClick={() => setIsCustom(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isCustom ? "bg-amber-100/60 text-amber-700 border-amber-200" : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"
                }`}>Custom</button>
            </div>
            {isCustom && (
              <div className="flex gap-3 mt-2">
                <div className="flex-1"><label className="text-[10px] text-slate-400">Focus (min)</label><input type="number" min={1} max={120} value={customFocus} onChange={e => setCustomFocus(+e.target.value)} className="w-full mt-0.5 px-2 py-1 rounded-lg bg-white/30 border border-white/40 text-sm text-slate-700 focus:outline-none" /></div>
                <div className="flex-1"><label className="text-[10px] text-slate-400">Break (min)</label><input type="number" min={1} max={30} value={customBreak} onChange={e => setCustomBreak(+e.target.value)} className="w-full mt-0.5 px-2 py-1 rounded-lg bg-white/30 border border-white/40 text-sm text-slate-700 focus:outline-none" /></div>
              </div>
            )}
          </div>

          {/* Loop Mode */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-5 rounded-full transition-colors ${isLoopMode ? "bg-indigo-400" : "bg-slate-200"} relative`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isLoopMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-slate-600 font-medium">Loop Mode <span className="text-xs text-slate-400">(infinite cycling)</span></span>
          </label>

          {/* Soundscape */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ambient Soundscape</label>
            <AmbientPlayer />
          </div>

          {/* Error */}
          {s.errorMessage && <p className="text-xs text-red-500 font-medium text-center">{s.errorMessage}</p>}

          {/* Start */}
          <button onClick={handleStart} disabled={s.state === "REQUESTING"}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50">
            {s.state === "REQUESTING" ? "Starting..." : "Begin Focus Session"}
          </button>
        </GlassCard>
      </div>
    );
  }

  // ─── SUMMARY: Post-Session ───────────────────────────────────────
  if (s.state === "SUMMARY") {
    const dur = s.summary?.actual_duration_seconds ?? 0;
    const isBigSession = dur >= 7200; // 2+ hours
    return (
      <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <GlassCard className="p-6 text-center space-y-4">
          <div className="text-4xl">{isBigSession ? "🏆" : "✨"}</div>
          <h2 className="text-xl font-bold text-slate-800">{isBigSession ? "Legendary Focus!" : "Session Complete"}</h2>
          {isBigSession && <p className="text-sm text-indigo-600 font-medium italic">&ldquo;2+ hours of deep work. You are in the top 1%.&rdquo;</p>}
          <div className="flex justify-center gap-6">
            <div><p className="text-2xl font-bold text-slate-800">{fmtTime(dur)}</p><p className="text-[10px] text-slate-400 uppercase">Duration</p></div>
          </div>
          <button onClick={s.dismiss} className="w-full py-2.5 rounded-xl bg-white/30 border border-white/40 text-sm font-semibold text-slate-600 hover:bg-white/50 transition-all">Done</button>
        </GlassCard>
      </div>
    );
  }

  // ─── ACTIVE / PAUSED: Deep Focus Workspace ──────────────────────
  return (
    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-500"
      style={{ background: pomoPhase === "focus" ? focusAura : breakAura }}>

      {/* Tab Warning */}
      {tabWarning && (
        <div className="w-full max-w-md animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between bg-red-100/60 backdrop-blur border border-red-200/50 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-700">You left the tab for &gt;10 seconds!</span></div>
            <button onClick={() => setTabWarning(false)}><EyeOff className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        </div>
      )}

      {/* Zen Clock */}
      <ZenClock progress={progress} phase={pomoPhase} soulColor={soulColor} />

      {/* Timer Display (subtle, not stressful) */}
      <div className="text-center">
        <p className="text-4xl font-mono font-light text-slate-700/60 tabular-nums tracking-wider">{fmtTime(pomoPhase === "focus" ? focusDur - pomoSec : breakDur - pomoSec)}</p>
        <p className="text-xs text-slate-400 mt-1">Total session: {fmtTime(s.elapsedSeconds)}</p>
      </div>

      {/* Breathing Guide during break */}
      {pomoPhase === "break" && s.state === "ACTIVE" && <BreathingGuide />}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {s.state === "ACTIVE" ? (
          <>
            <button onClick={s.pause} className="p-3 rounded-2xl bg-white/30 backdrop-blur border border-white/40 text-slate-700 hover:bg-white/50 transition-all"><Pause className="w-5 h-5" /></button>
            <button onClick={s.end} className="p-3 rounded-2xl bg-red-500/80 text-white hover:bg-red-500 shadow-md transition-all"><Square className="w-5 h-5" /></button>
          </>
        ) : s.state === "PAUSED" ? (
          <>
            <button onClick={s.resume} className="p-3 rounded-2xl bg-emerald-500/80 text-white hover:bg-emerald-500 shadow-md transition-all"><Play className="w-5 h-5" /></button>
            <button onClick={s.end} className="p-3 rounded-2xl bg-red-500/80 text-white hover:bg-red-500 shadow-md transition-all"><Square className="w-5 h-5" /></button>
          </>
        ) : null}
      </div>

      {/* Floating Panels Row */}
      <div className="flex flex-wrap items-start gap-3 w-full max-w-lg justify-center">
        <QuickNotePanel taskTitle={linkedTaskTitle} />
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur border border-white/30">
          <AmbientPlayer />
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2">
        {s.isOffline && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">Offline</span>}
        {s.heartbeatFailed && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">Sync Error</span>}
        {s.state === "PAUSED" && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider animate-pulse">Paused</span>}
      </div>
    </div>
  );
}
