'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// HudOverlay — Ambient heads-up display for the study room
// ═══════════════════════════════════════════════════════════════════════════════
// Shows greeting, clock, and quick stats at viewport corners.
// Fully visible on the dashboard (isFullRoom=true), hidden when a module panel
// is open (isFullRoom=false). Auto-fades to 30% opacity after 5 s of mouse
// inactivity, restores on any mouse movement.
//
// z-index: 55 — above room layers, below RadialNavMenu (60).
// ═══════════════════════════════════════════════════════════════════════════════

/** Duration (ms) of mouse inactivity before HUD fades out. */
const INACTIVITY_DELAY_MS = 5000;

// ─── Greeting helper ────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h <= 11) return 'Chào buổi sáng! ☀️';
  if (h >= 12 && h <= 17) return 'Chào buổi chiều! ⏰';
  return 'Chào buổi tối! 🌙';
}

// ─── Day-of-week labels (Vietnamese short) ──────────────────────────────────

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

// ─── Component ──────────────────────────────────────────────────────────────

interface HudOverlayProps {
  /** true on the dashboard (full room view), false when a module panel is open */
  isFullRoom: boolean;
}

export default function HudOverlay({ isFullRoom }: HudOverlayProps) {
  // ── Live clock ────────────────────────────────────────────────────────────
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Display name from localStorage (SSR-safe) ────────────────────────────
  const [displayName, setDisplayName] = useState<string>('Explorer');

  useEffect(() => {
    const stored = localStorage.getItem('sf_name');
    if (stored) setDisplayName(stored);
  }, []);

  // ── Greeting (memoised per mount) ─────────────────────────────────────────
  const [greeting] = useState<string>(() => getGreeting());

  // ── Auto-fade on mouse inactivity ─────────────────────────────────────────
  const [isActive, setIsActive] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFadeTimer = useCallback(() => {
    setIsActive(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setIsActive(false), INACTIVITY_DELAY_MS);
  }, []);

  useEffect(() => {
    const handleMove = () => resetFadeTimer();
    window.addEventListener('mousemove', handleMove, { passive: true });
    resetFadeTimer();

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [resetFadeTimer]);

  // ── Placeholder stats (wired to real stores when available) ───────────────
  const stats = {
    streak: 7,
    focusMinutesToday: 135,
    tasksDone: 4,
    tasksTotal: 9,
  };

  const focusHours = Math.floor(stats.focusMinutesToday / 60);
  const focusMins = stats.focusMinutesToday % 60;

  // ── Formatted strings ─────────────────────────────────────────────────────
  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateStr = `${DAY_LABELS[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}`;

  // ── Derived visibility ────────────────────────────────────────────────────
  // When isFullRoom=false the entire HUD is invisible & non-interactive.
  // When active=false (mouse idle) opacity drops to 0.3.
  const resolvedOpacity = isFullRoom ? (isActive ? 1 : 0.3) : 0;

  // ── Shared text-shadow for readability over room imagery ──────────────────
  const textShadow = '0 2px 8px rgba(0,0,0,0.5)';

  return (
    <div
      aria-hidden={!isFullRoom}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        pointerEvents: isFullRoom ? 'none' : 'none', // always non-interactive for passthrough
        opacity: resolvedOpacity,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* ── Top-left: Greeting + Username ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '28px',
          textShadow,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--sf-font-handwriting)',
            fontSize: '28px',
            lineHeight: 1.3,
            color: 'var(--sf-room-accent-amber, #fbbf24)',
            margin: 0,
          }}
        >
          {greeting}
        </p>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'rgb(203, 213, 225)', // slate-300
            marginTop: '4px',
          }}
        >
          {displayName}
        </p>
      </div>

      {/* ── Top-right: Clock + Date ───────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          right: '28px',
          textAlign: 'right',
          textShadow,
        }}
      >
        <p
          style={{
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontSize: '36px',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color: 'rgb(226, 232, 240)', // slate-200
            margin: 0,
            lineHeight: 1,
          }}
        >
          {timeStr}
        </p>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgb(148, 163, 184)', // slate-400
            marginTop: '4px',
          }}
        >
          {dateStr}
        </p>
      </div>

      {/* ── Bottom-left: Quick Stats Glass Card ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '28px',
          pointerEvents: 'auto',
          // small glassmorphism card
          backgroundColor: 'rgba(22, 18, 36, 0.50)',
          backdropFilter: 'blur(12px) saturate(130%)',
          WebkitBackdropFilter: 'blur(12px) saturate(130%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          gap: '16px',
          textShadow,
        }}
      >
        <StatItem emoji="🔥" label={`${stats.streak}-day streak`} />
        <StatItem emoji="⏱" label={`${focusHours}h ${focusMins}m focus`} />
        <StatItem emoji="✅" label={`${stats.tasksDone}/${stats.tasksTotal} tasks`} />
      </div>
    </div>
  );
}

// ─── Tiny stat display ──────────────────────────────────────────────────────

function StatItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '13px',
        fontWeight: 500,
        color: 'rgb(203, 213, 225)', // slate-300
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '14px' }}>{emoji}</span>
      {label}
    </span>
  );
}
