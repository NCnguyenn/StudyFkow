'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useParallax } from '@/hooks/useParallax';
import type { RoomHotspot, ZoomState } from '@/types/room';

// ═══════════════════════════════════════════════════════════════════════════════
// InteractiveRoomEngine — v4.0 Unified Room-as-UI System
// ═══════════════════════════════════════════════════════════════════════════════
// Renders the study room as a single composite image with interactive hotspot
// zones overlaid on room objects. Manages camera zoom/transitions when the user
// navigates between modules.
//
// 2-Layer architecture:
//   Layer 0: Room composite image + hotspots (this component)
//   Layer 1: Module UI panel (rendered by ModuleTransition in layout)
//
// Features:
//   - GSAP-animated zoom transitions (Slide + Scale)
//   - Mouse parallax (subtle room sway)
//   - Smart image swap for Focus mode (room_base → desk_zone)
//   - CSS hover effects (brighten/pulse/glow) — no tooltips
//   - Vignette overlay for depth
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Hotspot Data ────────────────────────────────────────────────────────────

const ROOM_HOTSPOTS: RoomHotspot[] = [
  {
    id: 'notebook',
    label: 'Ghi chú',
    route: '/notes',
    bounds: { x: '55%', y: '58%', w: '12%', h: '15%' },
    zoomTarget: { x: '55%', y: '60%', scale: 2.2 },
    hoverEffect: 'brighten',
  },
  {
    id: 'clock',
    label: 'Focus Timer',
    route: '/focus',
    bounds: { x: '42%', y: '55%', w: '8%', h: '10%' },
    zoomTarget: { x: '50%', y: '65%', scale: 2.8 },
    hoverEffect: 'pulse',
  },
  {
    id: 'corkboard',
    label: 'Kế hoạch',
    route: '/tasks',
    bounds: { x: '75%', y: '20%', w: '18%', h: '25%' },
    zoomTarget: { x: '80%', y: '30%', scale: 2.0 },
    hoverEffect: 'glow',
  },
  {
    id: 'laptop',
    label: 'Canvas',
    route: '/canvas',
    bounds: { x: '35%', y: '55%', w: '15%', h: '18%' },
    zoomTarget: { x: '42%', y: '62%', scale: 2.5 },
    hoverEffect: 'brighten',
  },
  {
    id: 'bookshelf',
    label: 'Thống kê',
    route: '/insights',
    bounds: { x: '15%', y: '15%', w: '15%', h: '50%' },
    zoomTarget: { x: '20%', y: '40%', scale: 1.8 },
    hoverEffect: 'glow',
  },
];

// ─── Image paths ─────────────────────────────────────────────────────────────

const ROOM_BASE_SRC = '/assets/rooms/home/room_base.png';
const DESK_ZONE_SRC = '/assets/rooms/home/desk_zone.png';

// ─── GSAP Constants ──────────────────────────────────────────────────────────

const ZOOM_DURATION = 0.7;
const ZOOM_EASE = 'power2.inOut';
const DIM_DURATION = 0.5;

// ─── Time-of-Day Filter Helper ───────────────────────────────────────────────

function getFilterString(activeModule: string | null, hour: number): string {
  const isNight = hour >= 18 || hour < 6;
  const isGoldenHour = hour >= 16 && hour < 18;

  let baseBrightness = 1;
  let baseSaturation = 1;
  let hueShift = 0;

  if (isNight) {
    baseBrightness = 0.65;
    baseSaturation = 0.8;
    hueShift = 8;
  } else if (isGoldenHour) {
    baseBrightness = 0.9;
    baseSaturation = 1.15;
    hueShift = -4;
  }

  if (activeModule === null) {
    return `blur(0px) brightness(${baseBrightness}) saturate(${baseSaturation}) hue-rotate(${hueShift}deg)`;
  } else if (activeModule === '/focus') {
    return `blur(0px) brightness(${baseBrightness * 0.85}) saturate(${baseSaturation * 1.1}) hue-rotate(${hueShift}deg)`;
  } else {
    return `blur(4px) brightness(${baseBrightness * 0.45}) saturate(${baseSaturation * 0.9}) hue-rotate(${hueShift}deg)`;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface InteractiveRoomEngineProps {
  /** Current active module route, or null when on the dashboard. */
  activeModule: string | null;
}

export default function InteractiveRoomEngine({
  activeModule,
}: InteractiveRoomEngineProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const zoomStateRef = useRef<ZoomState>('idle');
  const prevModuleRef = useRef<string | null>(null);
  const [imageSrc, setImageSrc] = useState(ROOM_BASE_SRC);
  const [hour, setHour] = useState(() => new Date().getHours());

  // Update hour state every minute to react to actual day/night cycle shifts
  useEffect(() => {
    const id = setInterval(() => {
      setHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Apply parallax only when no module is active (dashboard view)
  useParallax(containerRef, {
    speed: 0.04,
    maxShiftX: 20,
    maxShiftY: 12,
    enabled: activeModule === null,
  });

  // ── Hotspot click handler ──────────────────────────────────────────────────
  const handleHotspotClick = useCallback(
    (hotspot: RoomHotspot) => {
      if (zoomStateRef.current !== 'idle') return;
      router.push(hotspot.route);
    },
    [router],
  );

  // ── Camera transitions — respond to activeModule changes ──────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prev = prevModuleRef.current;
    prevModuleRef.current = activeModule;

    // If only the hour changed, transition the filter state and skip camera zoom
    if (prev === activeModule) {
      gsap.to(container, {
        duration: DIM_DURATION,
        ease: 'power2.out',
        filter: getFilterString(activeModule, hour),
      });
      return;
    }

    // Find the target hotspot for the active module
    const hotspot = activeModule
      ? ROOM_HOTSPOTS.find((h) => h.route === activeModule)
      : null;

    if (activeModule === null) {
      // ── Returning to dashboard: unzoom ─────────────────────────────────
      zoomStateRef.current = 'unzooming';

      // Swap back to room base if we were on desk_zone
      setImageSrc(ROOM_BASE_SRC);

      gsap.to(container, {
        duration: ZOOM_DURATION,
        ease: ZOOM_EASE,
        scale: 1,
        x: 0,
        y: 0,
        onComplete: () => {
          zoomStateRef.current = 'idle';
        },
      });

      // Restore brightness/blur
      gsap.to(container, {
        duration: DIM_DURATION,
        ease: 'power2.out',
        filter: getFilterString(null, hour),
      });
    } else if (activeModule === '/focus' && hotspot) {
      // ── Focus mode: deep zoom into desk, then swap to close-up ─────────
      zoomStateRef.current = 'zooming';

      const targetX = parseFloat(hotspot.zoomTarget.x) - 50;
      const targetY = parseFloat(hotspot.zoomTarget.y) - 50;

      gsap.to(container, {
        duration: ZOOM_DURATION,
        ease: ZOOM_EASE,
        scale: hotspot.zoomTarget.scale,
        xPercent: -targetX,
        yPercent: -targetY,
        onComplete: () => {
          // Smart swap: switch to high-res desk close-up after zoom completes
          setImageSrc(DESK_ZONE_SRC);
          zoomStateRef.current = 'zoomed';
        },
      });

      // Focus mode — slightly dimmed but NOT blurred (immersive)
      gsap.to(container, {
        duration: DIM_DURATION,
        ease: 'power2.out',
        filter: getFilterString('/focus', hour),
      });
    } else if (hotspot) {
      // ── Standard module: zoom + dim ────────────────────────────────────
      zoomStateRef.current = 'zooming';

      const targetX = parseFloat(hotspot.zoomTarget.x) - 50;
      const targetY = parseFloat(hotspot.zoomTarget.y) - 50;

      gsap.to(container, {
        duration: ZOOM_DURATION,
        ease: ZOOM_EASE,
        scale: hotspot.zoomTarget.scale,
        xPercent: -targetX,
        yPercent: -targetY,
        onComplete: () => {
          zoomStateRef.current = 'zoomed';
        },
      });

      // Dim and blur room
      gsap.to(container, {
        duration: DIM_DURATION,
        ease: 'power2.out',
        filter: getFilterString(activeModule, hour),
      });
    } else {
      // ── Module without a hotspot mapping (e.g. /settings) ──────────────
      zoomStateRef.current = 'zooming';

      gsap.to(container, {
        duration: DIM_DURATION,
        ease: 'power2.out',
        filter: getFilterString(activeModule, hour),
        onComplete: () => {
          zoomStateRef.current = 'zoomed';
        },
      });
    }
  }, [activeModule, hour]);

  // ── Determine if hotspots should be interactive ────────────────────────────
  const hotspotsEnabled = activeModule === null;

  return (
    <>
      {/* Room composite container */}
      <div
        ref={containerRef}
        className="room-base"
        style={{
          translate: 'var(--parallax-x, 0px) var(--parallax-y, 0px)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Study room"
          className="room-base__image"
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />

        {/* Interactive hotspot zones — only active on dashboard */}
        {hotspotsEnabled &&
          ROOM_HOTSPOTS.map((hotspot) => (
            <HotspotZone
              key={hotspot.id}
              hotspot={hotspot}
              onClick={handleHotspotClick}
            />
          ))}
      </div>

      {/* Vignette overlay — enhances depth focus */}
      <div className="room-vignette" aria-hidden="true" />
    </>
  );
}

// ─── HotspotZone sub-component ───────────────────────────────────────────────

function HotspotZone({
  hotspot,
  onClick,
}: {
  hotspot: RoomHotspot;
  onClick: (hotspot: RoomHotspot) => void;
}) {
  return (
    <button
      onClick={() => onClick(hotspot)}
      aria-label={hotspot.label}
      className={`room-hotspot room-hotspot--${hotspot.hoverEffect}`}
      style={{
        left: hotspot.bounds.x,
        top: hotspot.bounds.y,
        width: hotspot.bounds.w,
        height: hotspot.bounds.h,
      }}
    />
  );
}
