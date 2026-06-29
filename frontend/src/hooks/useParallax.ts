'use client';

import { useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// useParallax — Mouse-tracking parallax engine (extracted from RoomPerspective v3.1)
// ═══════════════════════════════════════════════════════════════════════════════
// Adds a subtle mouse-follow offset to a target element via CSS custom properties
// --parallax-x and --parallax-y. The element can use these in `translate`.
//
// Usage:
//   const containerRef = useRef<HTMLDivElement>(null);
//   useParallax(containerRef, { speed: 0.05, maxShiftX: 30, maxShiftY: 20 });
//
//   <div ref={containerRef} style={{ translate: 'var(--parallax-x) var(--parallax-y)' }}>
// ═══════════════════════════════════════════════════════════════════════════════

interface ParallaxOptions {
  /** Mouse-follow speed multiplier. Higher = more movement. Default: 0.05 */
  speed?: number;
  /** Maximum horizontal displacement in pixels. Default: 30 */
  maxShiftX?: number;
  /** Maximum vertical displacement in pixels. Default: 20 */
  maxShiftY?: number;
  /** Lerp smoothing factor. Lower = smoother trailing. Default: 0.05 */
  lerpFactor?: number;
  /** Whether parallax is enabled. Default: true */
  enabled?: boolean;
}

export function useParallax(
  containerRef: React.RefObject<HTMLElement | null>,
  options: ParallaxOptions = {},
) {
  const {
    speed = 0.05,
    maxShiftX = 30,
    maxShiftY = 20,
    lerpFactor = 0.05,
    enabled = true,
  } = options;

  const rafIdRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const updateParallax = useCallback(() => {
    const container = containerRef.current;
    if (!container || !enabled) {
      rafIdRef.current = requestAnimationFrame(updateParallax);
      return;
    }

    // Smooth lerp interpolation
    currentRef.current.x +=
      (targetRef.current.x - currentRef.current.x) * lerpFactor;
    currentRef.current.y +=
      (targetRef.current.y - currentRef.current.y) * lerpFactor;

    const dx = currentRef.current.x * speed * maxShiftX;
    const dy = currentRef.current.y * speed * maxShiftY;

    container.style.setProperty('--parallax-x', `${dx}px`);
    container.style.setProperty('--parallax-y', `${dy}px`);

    rafIdRef.current = requestAnimationFrame(updateParallax);
  }, [containerRef, speed, maxShiftX, maxShiftY, lerpFactor, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafIdRef.current = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [updateParallax, enabled]);
}
