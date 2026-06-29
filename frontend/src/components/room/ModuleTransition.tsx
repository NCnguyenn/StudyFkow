'use client';

import { useRef, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ModuleTransition — Glassmorphism panel with slide+fade entrance animation
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps module content (Notes, Tasks, Insights, Settings) inside a centered
// glass panel with a slide-up entrance. Focus (/focus) and Dashboard (/)
// skip the panel entirely for immersive rendering.
//
// z-index: 30 — on the midground layer, below HUD (55) and navigation (60).
// ═══════════════════════════════════════════════════════════════════════════════

interface ModuleTransitionProps {
  children: React.ReactNode;
  /** Current route path, e.g. '/notes', '/focus', '/tasks' */
  module: string;
}

/** Modules that render immersively (no panel wrapper). */
const IMMERSIVE_ROUTES = new Set(['/', '/focus']);

export default function ModuleTransition({ children, module }: ModuleTransitionProps) {
  // ── Immersive routes bypass the glass panel ───────────────────────────────
  if (IMMERSIVE_ROUTES.has(module)) {
    return <>{children}</>;
  }

  return (
    <ModulePanel key={module}>
      {children}
    </ModulePanel>
  );
}

// ─── Inner panel component (handles animation lifecycle) ────────────────────

function ModulePanel({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger the CSS transition on next frame so the browser registers the
    // initial off-screen state first.
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // let mouse events pass through gaps around the panel
        pointerEvents: 'none',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: '78vw',
          height: '88vh',
          borderRadius: '24px',
          overflow: 'hidden',
          pointerEvents: 'auto',

          // Glassmorphism
          backgroundColor: 'rgba(22, 18, 36, 0.70)',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 24px 80px rgba(0, 0, 0, 0.45), 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 1px rgba(255, 255, 255, 0.06)',

          // Slide-up + fade animation
          transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
