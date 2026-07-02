'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// useParallax v5.5 — Per-Object Parallax Engine
// ═══════════════════════════════════════════════════════════════════════════════
// Tracks mouse position and provides per-depth offset calculation.
// Each sprite calls getOffset(depth) to get its unique parallax translation.
//
// Formula: offset = (mouseNormalized - 0.5) * depth * strength * maxShift
//   - depth 0.0 → almost no movement (far background)
//   - depth 1.0 → maximum movement (near foreground)
// ═══════════════════════════════════════════════════════════════════════════════

interface ParallaxState {
  /** Normalized mouse X: 0.0 (left) → 1.0 (right) */
  normalizedX: number;
  /** Normalized mouse Y: 0.0 (top) → 1.0 (bottom) */
  normalizedY: number;
}

interface ParallaxConfig {
  /** Base strength multiplier. Default: 15 */
  strength?: number;
  /** Maximum horizontal shift in px. Default: 40 */
  maxShiftX?: number;
  /** Maximum vertical shift in px. Default: 25 */
  maxShiftY?: number;
  /** Lerp smoothing (0-1, lower = smoother). Default: 0.06 */
  smoothing?: number;
  /** Enable/disable. Default: true */
  enabled?: boolean;
}

export interface ParallaxOffset {
  x: number;
  y: number;
}

export function useParallax(config: ParallaxConfig = {}) {
  const {
    strength = 15,
    maxShiftX = 40,
    maxShiftY = 25,
    smoothing = 0.06,
    enabled = true,
  } = config;

  const targetRef = useRef<ParallaxState>({ normalizedX: 0.5, normalizedY: 0.5 });
  const currentRef = useRef<ParallaxState>({ normalizedX: 0.5, normalizedY: 0.5 });
  const rafIdRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);
  const frameCountRef = useRef(0);

  const animate = useCallback(() => {
    // Lerp toward target
    currentRef.current.normalizedX +=
      (targetRef.current.normalizedX - currentRef.current.normalizedX) * smoothing;
    currentRef.current.normalizedY +=
      (targetRef.current.normalizedY - currentRef.current.normalizedY) * smoothing;

    // Only trigger React re-render every 2 frames for performance
    frameCountRef.current++;
    if (frameCountRef.current % 2 === 0) {
      forceUpdate((n) => n + 1);
    }

    rafIdRef.current = requestAnimationFrame(animate);
  }, [smoothing]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.normalizedX = e.clientX / window.innerWidth;
      targetRef.current.normalizedY = e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [animate, enabled]);

  /**
   * Get parallax offset for a given depth value.
   * @param depth 0.0 (far/static) to 1.0 (near/fast)
   * @returns { x, y } offset in pixels
   */
  const getOffset = useCallback(
    (depth: number): ParallaxOffset => {
      if (!enabled) return { x: 0, y: 0 };

      const dx = (currentRef.current.normalizedX - 0.5) * depth * strength;
      const dy = (currentRef.current.normalizedY - 0.5) * depth * strength;

      return {
        x: Math.max(-maxShiftX, Math.min(maxShiftX, dx)),
        y: Math.max(-maxShiftY, Math.min(maxShiftY, dy)),
      };
    },
    [enabled, strength, maxShiftX, maxShiftY],
  );

  return { getOffset };
}
