'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  CheckSquare,
  Timer,
  LineChart,
  Settings,
  LogOut,
  Grid2x2,
  X,
} from 'lucide-react';
import gsap from 'gsap';
import { useNoteStore } from '@/store/useNoteStore';

// ═══════════════════════════════════════════════════════════════════════════════
// RadialNavMenu — FAB + Semi-circle Radial Navigation
// ═══════════════════════════════════════════════════════════════════════════════
// Replaces CompactDock with a glassmorphism floating action button (bottom-right)
// that expands into a semi-circle of 6 navigation items + logout.
//
// z-index: 60 — topmost interactive UI layer.
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { name: 'Home',     href: '/',         icon: Home,        shortcut: '1' },
  { name: 'Planner',  href: '/tasks',    icon: CheckSquare, shortcut: '2' },
  { name: 'Focus',    href: '/focus',    icon: Timer,       shortcut: '3' },
  { name: 'Notes',    href: '/notes',    icon: BookOpen,    shortcut: '4' },
  { name: 'Insights', href: '/insights', icon: LineChart,   shortcut: '5' },
  { name: 'Settings', href: '/settings', icon: Settings,    shortcut: '6' },
] as const;

/** Inactivity delay (ms) before auto-hiding the FAB. */
const AUTO_HIDE_DELAY_MS = 5000;

/** Reveal zone in px from bottom-right corner that re-shows the FAB. */
const REVEAL_ZONE_PX = 120;

/** Arc radius in px from FAB center to menu item centers. */
const ARC_RADIUS = 100;

/**
 * Compute (x, y) offset for the i-th item on a semi-circle arc above the FAB.
 * Items are spread from 180° (left) to 0° (right) — i.e. the upper semicircle.
 */
function getArcPosition(index: number, total: number): { x: number; y: number } {
  // Spread items evenly across 180° arc (π radians), going counter-clockwise
  // from the right side (0°) up and around to the left (180°).
  const angleStep = Math.PI / (total - 1);
  const angle = Math.PI - index * angleStep; // start from left
  return {
    x: Math.cos(angle) * ARC_RADIUS,
    y: -Math.sin(angle) * ARC_RADIUS, // negative = upward
  };
}

export default function RadialNavMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const logoutRef = useRef<HTMLButtonElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // ── Auto-hide FAB ─────────────────────────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    setIsFabVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isOpen) setIsFabVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const fromRight = window.innerWidth - e.clientX;
      const fromBottom = window.innerHeight - e.clientY;
      if (fromRight <= REVEAL_ZONE_PX && fromBottom <= REVEAL_ZONE_PX) {
        resetHideTimer();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Keep FAB visible while menu is open
  useEffect(() => {
    if (isOpen) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsFabVisible(true);
    }
  }, [isOpen]);

  // ── GSAP arc animation ────────────────────────────────────────────────────

  useEffect(() => {
    const allItems = [...itemRefs.current.filter(Boolean), logoutRef.current].filter(
      Boolean,
    ) as HTMLButtonElement[];

    if (isOpen) {
      // Animate in with stagger
      gsap.fromTo(
        allItems,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: 'back.out(1.7)',
          stagger: 0.04,
        },
      );
    } else {
      // Collapse
      gsap.to(allItems, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        stagger: 0.02,
      });
    }
  }, [isOpen]);

  // ── Close on Escape ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // ── Keyboard shortcuts (Ctrl+1..6) ────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;

      const item = NAV_ITEMS.find((n) => n.shortcut === e.key);
      if (item) {
        e.preventDefault();
        if (item.href === '/notes') {
          useNoteStore.getState().setActiveFolder(null);
          useNoteStore.getState().setActiveNote(null);
        }
        router.push(item.href);
        setIsOpen(false);
        resetHideTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, resetHideTimer]);

  // ── Navigation & State Handlers ───────────────────────────────────────────

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('studyflow_access_token');
    router.push('/login');
  }, [router]);

  const handleNavigate = useCallback(
    (href: string) => {
      if (href === '/notes') {
        useNoteStore.getState().setActiveFolder(null);
        useNoteStore.getState().setActiveNote(null);
      }
      router.push(href);
      setIsOpen(false);
    },
    [router],
  );

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ── Logout position: slightly below the arc, to the left of FAB ──────────
  const logoutPos = getArcPosition(Math.floor(NAV_ITEMS.length / 2), NAV_ITEMS.length);
  const logoutOffset = { x: logoutPos.x * 0.3, y: logoutPos.y - 50 };

  // ── Mobile Responsive Fallback Layout ────────────────────────────────────
  if (isMobile) {
    const mobileItems = [
      { name: 'Home',     href: '/canvas',   icon: Home },
      { name: 'Planner',  href: '/tasks',    icon: CheckSquare },
      { name: 'Focus',    href: '/focus',    icon: Timer },
      { name: 'Notes',    href: '/notes',    icon: BookOpen },
      { name: 'Insights', href: '/insights', icon: LineChart },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'rgba(22, 18, 36, 0.85)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 60,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigate(item.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flex: 1,
                height: '100%',
                color: isActive ? 'var(--sf-room-accent-primary, #818cf8)' : 'rgb(148, 163, 184)',
                gap: '4px',
                transition: 'color 200ms ease',
              }}
            >
              <Icon style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 400 }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* ── Invisible backdrop to close menu ─────────────────────────── */}
      {isOpen && (
        <div
          ref={backdropRef}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 59,
          }}
        />
      )}

      {/* ── Menu container (anchored at FAB position) ────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 60,
        }}
      >
        {/* ── Radial items ─────────────────────────────────────────── */}
        {NAV_ITEMS.map((item, idx) => {
          const pos = getArcPosition(idx, NAV_ITEMS.length);
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isHovered = hoveredItem === item.name;

          return (
            <button
              key={item.name}
              ref={(el) => { itemRefs.current[idx] = el; }}
              onClick={() => handleNavigate(item.href)}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              aria-label={`${item.name} (Ctrl+${item.shortcut})`}
              style={{
                position: 'absolute',
                // Center the 40px button on the FAB center (48/2 - 40/2 = 4px offset)
                bottom: `${4 - pos.y}px`,
                right: `${4 - pos.x}px`,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: isActive
                  ? '1.5px solid rgba(129, 140, 248, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isActive
                  ? 'rgba(99, 102, 241, 0.25)'
                  : 'rgba(22, 18, 36, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isHovered
                  ? '0 4px 20px rgba(99, 102, 241, 0.3)'
                  : '0 4px 16px rgba(0, 0, 0, 0.3)',
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
                // Initially hidden — GSAP will animate in
                opacity: 0,
                pointerEvents: isOpen ? 'auto' : 'none',
              }}
            >
              <Icon
                style={{
                  width: '18px',
                  height: '18px',
                  color: isActive
                    ? 'var(--sf-room-accent-primary, #818cf8)'
                    : 'rgb(203, 213, 225)',
                }}
              />

              {/* Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '6px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(22, 18, 31, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgb(226, 232, 240)',
                    pointerEvents: 'none',
                  }}
                >
                  {item.name}
                  <span style={{ marginLeft: '4px', opacity: 0.5, fontSize: '10px' }}>
                    ⌃{item.shortcut}
                  </span>
                </div>
              )}
            </button>
          );
        })}

        {/* ── Logout button (below the arc) ────────────────────────── */}
        <button
          ref={logoutRef}
          onClick={handleLogout}
          onMouseEnter={() => setHoveredItem('Logout')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Logout"
          style={{
            position: 'absolute',
            bottom: `${4 - logoutOffset.y}px`,
            right: `${4 - logoutOffset.x}px`,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            backgroundColor:
              hoveredItem === 'Logout'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(22, 18, 36, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transform: hoveredItem === 'Logout' ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 200ms ease, background-color 200ms ease',
            opacity: 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <LogOut
            style={{
              width: '16px',
              height: '16px',
              color:
                hoveredItem === 'Logout'
                  ? 'rgb(248, 113, 113)'
                  : 'rgb(148, 163, 184)',
              transition: 'color 200ms ease',
            }}
          />

          {hoveredItem === 'Logout' && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '6px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(22, 18, 31, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgb(248, 113, 113)',
                pointerEvents: 'none',
              }}
            >
              Logout
            </div>
          )}
        </button>

        {/* ── FAB button ───────────────────────────────────────────── */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            setIsFabVisible(true);
          }}
          onMouseLeave={() => resetHideTimer()}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(22, 18, 36, 0.75)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 1px rgba(255, 255, 255, 0.1)',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFabVisible ? 'scale(1)' : 'scale(0.6)',
            opacity: isFabVisible ? 1 : 0,
            pointerEvents: isFabVisible ? 'auto' : 'none',
            zIndex: 1, // above radial items within the container
          }}
        >
          {isOpen ? (
            <X
              style={{
                width: '22px',
                height: '22px',
                color: 'rgb(226, 232, 240)',
                transition: 'transform 300ms ease',
              }}
            />
          ) : (
            <Grid2x2
              style={{
                width: '20px',
                height: '20px',
                color: 'rgb(226, 232, 240)',
                transition: 'transform 300ms ease',
              }}
            />
          )}
        </button>
      </div>
    </>
  );
}
