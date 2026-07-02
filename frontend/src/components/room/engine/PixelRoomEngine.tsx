'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ROOM_SPRITES, SPRITE_BASE_WIDTH, SPRITE_BASE_HEIGHT, type SpriteConfig } from './SpriteManifest';
import RoomSprite from './RoomSprite';
import ParticleCanvas from './ParticleCanvas';
import LightingLayer from './LightingLayer';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// ═══════════════════════════════════════════════════════════════════════════════
// PixelRoomEngine v5.5 — Multi-Sprite Room with Depth & GSAP Interaction (P5)
// ═══════════════════════════════════════════════════════════════════════════════
//
// 4 Golden Rules enforced:
//   1. No static objects → every sprite has idle CSS animation
//   2. Per-object parallax → each sprite moves at its own speed (R5.5-P2)
//   3. Per-object lighting → brightness based on distance to light source
//   4. Particles for life → ParticleCanvas always has ≥1 system running
// ═══════════════════════════════════════════════════════════════════════════════

interface PixelRoomEngineProps {
  activeModule: string | null;
}

/** Calculate per-sprite brightness based on distance to light sources */
function calculateBrightness(
  spriteX: number,
  spriteY: number,
  spriteW: number,
  spriteH: number,
  lampOn: boolean,
  lampIntensity: number,
  windowIntensity: number,
): number {
  // Light source positions (in 1920x1080 virtual space)
  const lampPos = { x: 240, y: 530 };  // Desk lamp position
  const windowPos = { x: 920, y: 200 }; // Window center

  const spriteCenterX = spriteX + spriteW / 2;
  const spriteCenterY = spriteY + spriteH / 2;

  let brightness = 0.55; // Base ambient brightness

  // Window light contribution (daytime)
  if (windowIntensity > 0) {
    const distToWindow = Math.sqrt(
      Math.pow(spriteCenterX - windowPos.x, 2) + Math.pow(spriteCenterY - windowPos.y, 2),
    );
    const windowFalloff = Math.max(0, 1 - distToWindow / 1200);
    brightness += windowFalloff * windowIntensity * 0.5;
  }

  // Lamp light contribution (nighttime)
  if (lampOn && lampIntensity > 0) {
    const distToLamp = Math.sqrt(
      Math.pow(spriteCenterX - lampPos.x, 2) + Math.pow(spriteCenterY - lampPos.y, 2),
    );
    const lampFalloff = Math.max(0, 1 - distToLamp / 800);
    brightness += lampFalloff * lampIntensity * 0.55;
  }

  return Math.min(1.3, Math.max(0.3, brightness));
}

export default function PixelRoomEngine({ activeModule }: PixelRoomEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const roomLayersRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const router = useRouter();
  const timeOfDay = useTimeOfDay();

  const [isZooming, setIsZooming] = useState(false);
  const isZoomingRef = useRef(false);

  // Mouse position tracking for zero-re-render high-performance parallax
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  // Clean up GSAP timelines on unmount
  useEffect(() => {
    return () => {
      activeTimelineRef.current?.kill();
    };
  }, []);

  // Track mouse coordinates globally when activeModule is not open
  useEffect(() => {
    if (activeModule || isZooming) {
      // Smoothly animate back to center if a module is active or zooming
      targetX.current = 0;
      targetY.current = 0;
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isZoomingRef.current) return;
      // Calculate normalized mouse vector from -1.0 to 1.0
      targetX.current = (e.clientX / window.innerWidth) * 2 - 1;
      targetY.current = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeModule, isZooming]);

  // Zero-re-render Parallax Animation Loop (Golden Rule #2)
  useEffect(() => {
    let rafId: number;
    const smoothing = 0.08;
    const maxShiftX = 40;
    const maxShiftY = 25;

    const animate = () => {
      if (!isZoomingRef.current) {
        // Lerp mouse coordinate values
        currentX.current += (targetX.current - currentX.current) * smoothing;
        currentY.current += (targetY.current - currentY.current) * smoothing;

        if (containerRef.current) {
          // Apply per-object parallax directly to DOM elements via transform
          const spriteElements = containerRef.current.querySelectorAll<HTMLDivElement>('.room-sprite');
          spriteElements.forEach((el) => {
            const depthAttr = el.getAttribute('data-depth');
            if (depthAttr) {
              const depth = parseFloat(depthAttr);
              // Parallax translation offset: vector * depth * maxShift
              const dx = currentX.current * depth * maxShiftX;
              const dy = currentY.current * depth * maxShiftY;
              el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            }
          });
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Trigger GSAP zoom-to-hotspot transition when clicking an interactive sprite
  const handleSpriteClick = (sprite: SpriteConfig) => {
    if (!sprite.clickRoute || isZoomingRef.current) return;
    isZoomingRef.current = true;
    setIsZooming(true);

    if (activeTimelineRef.current) {
      activeTimelineRef.current.kill();
    }

    // Calculate clicked object's center relative to virtual 1920x1080 room
    const originXPercent = ((sprite.x + sprite.width / 2) / SPRITE_BASE_WIDTH) * 100;
    const originYPercent = ((sprite.y + sprite.height / 2) / SPRITE_BASE_HEIGHT) * 100;

    const tl = gsap.timeline({
      onComplete: () => {
        router.push(sprite.clickRoute!);
      },
    });
    activeTimelineRef.current = tl;

    tl.to(roomLayersRef.current, {
      transformOrigin: `${originXPercent}% ${originYPercent}%`,
      duration: 0,
    })
      .to(roomLayersRef.current, {
        scale: 2.5,
        duration: 0.7,
        ease: 'power3.inOut',
      })
      .to(
        overlayRef.current,
        {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.inOut',
        },
        '-=0.3'
      );
  };

  // Sort sprites by depth (far → near) for correct render order
  const sortedSprites = useMemo(
    () => [...ROOM_SPRITES].sort((a, b) => a.depth - b.depth),
    [],
  );

  // Calculate scale factor based on viewport
  const scale = typeof window !== 'undefined'
    ? Math.max(window.innerWidth / SPRITE_BASE_WIDTH, window.innerHeight / SPRITE_BASE_HEIGHT)
    : 1;

  // Sky gradient based on time of day
  const skyStyle = useMemo((): React.CSSProperties => {
    const gradients: Record<string, string> = {
      dawn: 'linear-gradient(180deg, #2c1654 0%, #e8734a 30%, #f5a623 60%, #87ceeb 100%)',
      morning: 'linear-gradient(180deg, #4a90d9 0%, #87ceeb 40%, #b5d8f7 100%)',
      afternoon: 'linear-gradient(180deg, #2980b9 0%, #6ab04c 70%, #87ceeb 100%)',
      sunset: 'linear-gradient(180deg, #e74c3c 0%, #f39c12 30%, #e8734a 60%, #2c1654 100%)',
      evening: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #2c1654 80%, #e74c3c10 100%)',
      night: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #16213e 100%)',
    };

    const hour = timeOfDay.hour;
    let timeSlot: string;
    if (hour >= 6 && hour < 8) timeSlot = 'dawn';
    else if (hour >= 8 && hour < 12) timeSlot = 'morning';
    else if (hour >= 12 && hour < 16) timeSlot = 'afternoon';
    else if (hour >= 16 && hour < 18) timeSlot = 'sunset';
    else if (hour >= 18 && hour < 20) timeSlot = 'evening';
    else timeSlot = 'night';

    return {
      position: 'absolute' as const,
      inset: 0,
      background: gradients[timeSlot],
      transition: 'background 60s linear',
      zIndex: -1,
    };
  }, [timeOfDay.hour]);

  // Dim state when a module is active
  const isDimmed = activeModule !== null;

  return (
    <div
      ref={containerRef}
      className={`pixel-room-engine ${isDimmed ? 'pixel-room-engine--dimmed' : ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        background: '#0a0a1a',
      }}
    >
      {/* Zoomable room container wrapping Sky, Sprites, Lighting, and Particles */}
      <div
        ref={roomLayersRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transformOrigin: '50% 50%',
          willChange: 'transform',
        }}
      >
        {/* Sky / Time-of-day background */}
        <div style={skyStyle} />

        {/* ── Sprites Layer ── */}
        <div
          className="pixel-room-sprites"
          style={{
            position: 'absolute',
            inset: 0,
            left: '50%',
            top: '50%',
            width: `${SPRITE_BASE_WIDTH * scale}px`,
            height: `${SPRITE_BASE_HEIGHT * scale}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {sortedSprites.map((sprite) => {
            const brightness = calculateBrightness(
              sprite.x, sprite.y, sprite.width, sprite.height,
              timeOfDay.lampOn, timeOfDay.lampIntensity, timeOfDay.windowIntensity,
            );

            return (
              <RoomSprite
                key={sprite.id}
                sprite={sprite}
                scale={scale}
                brightness={brightness}
                isDaytime={timeOfDay.isDaytime}
                onSpriteClick={handleSpriteClick}
              />
            );
          })}
        </div>

        {/* ── Real-time Lighting Layer (R5.5-P3) ── */}
        <LightingLayer />

        {/* ── Particles Layer ── */}
        <ParticleCanvas />
      </div>

      {/* Cinematic Transition Overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0a0a1a',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    </div>
  );
}
