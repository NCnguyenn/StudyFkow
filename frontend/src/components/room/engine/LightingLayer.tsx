'use client';

import React, { useRef, useEffect } from 'react';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// ═══════════════════════════════════════════════════════════════════════════════
// LightingLayer — Real-time lighting Canvas overlay (R5.5-P3)
// ═══════════════════════════════════════════════════════════════════════════════
// Renders as a pointer-events:none Canvas overlay above sprites (z-30).
// Uses HTML5 Canvas 2D API to draw real-time dynamic light sources:
//   1. Volumetric Window Light (sunlight/sunrise/sunset/moonlight with atmospheric pulsation)
//   2. Desk Lamp Radial Glow & Surface Pool (warm amber light with subtle realistic flicker)
//   3. Ambient Room Vignette & Mood Shading (deepens immersion at night/evening)
// ═══════════════════════════════════════════════════════════════════════════════

export default function LightingLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeOfDay = useTimeOfDay();

  // Use ref to hold current lighting values for smooth lerping
  const lightingStateRef = useRef({
    windowIntensity: timeOfDay.windowIntensity,
    lampIntensity: timeOfDay.lampIntensity,
    ambientBrightness: timeOfDay.ambientBrightness,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Skip rendering if browser tab is hidden to conserve battery/GPU
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      // Resize canvas to match display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Scale factors based on virtual 1920x1080 resolution
      const scaleX = width / 1920;
      const scaleY = height / 1080;
      const scale = Math.max(scaleX, scaleY);

      // Smooth lerp targets toward timeOfDay values
      const smoothing = 3.0 * dt;
      lightingStateRef.current.windowIntensity +=
        (timeOfDay.windowIntensity - lightingStateRef.current.windowIntensity) * Math.min(1, smoothing);
      lightingStateRef.current.lampIntensity +=
        ((timeOfDay.lampOn ? timeOfDay.lampIntensity : 0) - lightingStateRef.current.lampIntensity) * Math.min(1, smoothing);
      lightingStateRef.current.ambientBrightness +=
        (timeOfDay.ambientBrightness - lightingStateRef.current.ambientBrightness) * Math.min(1, smoothing);

      const curWindow = lightingStateRef.current.windowIntensity;
      const curLamp = lightingStateRef.current.lampIntensity;

      // Time variable for subtle organic light micro-animations
      const t = time * 0.001;

      // ── 1. Ambient Darkening & Room Vignette ──
      ctx.save();
      const vignetteRadius = Math.max(width, height) * 0.75;
      const vignetteGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.45, Math.max(width, height) * 0.2,
        width * 0.5, height * 0.45, vignetteRadius
      );

      // Deepen edges more during evening and night
      const nightFactor = Math.max(0, 1 - lightingStateRef.current.ambientBrightness);
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(0.6, `rgba(10, 15, 35, ${0.15 * nightFactor})`);
      vignetteGrad.addColorStop(1, `rgba(5, 8, 20, ${0.4 + 0.35 * nightFactor})`);

      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // ── 2. Volumetric Window Light ──
      if (curWindow > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Window center position in virtual coordinate space (920, 200)
        const winX = 920 * scaleX;
        const winY = 200 * scaleY;
        const winRadius = 1100 * scale;

        // Subtle atmospheric breathing (leaves rustling / sunlight shifting)
        const atmosphericPulse = 1 + Math.sin(t * 0.7) * 0.04 + Math.cos(t * 1.2) * 0.02;
        const activeWindowIntensity = curWindow * atmosphericPulse;

        // Color tone depending on hour
        let r = 255, g = 248, b = 230; // Default warm daylight
        if (timeOfDay.hour >= 6 && timeOfDay.hour < 8) {
          // Dawn: golden pink
          r = 255; g = 195; b = 140;
        } else if (timeOfDay.hour >= 16 && timeOfDay.hour < 18) {
          // Sunset: deep amber orange
          r = 255; g = 160; b = 100;
        } else if (!timeOfDay.isDaytime) {
          // Moonlight: cool blue
          r = 170; g = 200; b = 255;
        }

        const winGrad = ctx.createRadialGradient(winX, winY, 40 * scale, winX, winY, winRadius);
        winGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${activeWindowIntensity * 0.28})`);
        winGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${activeWindowIntensity * 0.12})`);
        winGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${activeWindowIntensity * 0.03})`);
        winGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = winGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // ── 3. Desk Lamp Radial Glow & Surface Pool ──
      if (curLamp > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Desk lamp bulb position in virtual space (240, 530)
        const lampX = 240 * scaleX;
        const lampY = 530 * scaleY;

        // Realistic subtle lamp flicker (multi-frequency wobble)
        const flicker = 1 + Math.sin(t * 14.5) * 0.015 + Math.cos(t * 23.1) * 0.01;
        const activeLampIntensity = curLamp * flicker;

        // Primary bulb glow
        const lampRadius = 700 * scale;
        const lampGrad = ctx.createRadialGradient(lampX, lampY, 15 * scale, lampX, lampY, lampRadius);
        lampGrad.addColorStop(0, `rgba(255, 215, 120, ${activeLampIntensity * 0.45})`);
        lampGrad.addColorStop(0.25, `rgba(250, 170, 60, ${activeLampIntensity * 0.22})`);
        lampGrad.addColorStop(0.6, `rgba(240, 130, 30, ${activeLampIntensity * 0.06})`);
        lampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = lampGrad;
        ctx.beginPath();
        ctx.arc(lampX, lampY, lampRadius, 0, Math.PI * 2);
        ctx.fill();

        // Secondary elliptical pool on the desk surface (around x:280, y:660)
        const poolX = 310 * scaleX;
        const poolY = 660 * scaleY;
        const poolRadiusX = 340 * scaleX;
        const poolRadiusY = 160 * scaleY;

        ctx.save();
        ctx.translate(poolX, poolY);
        ctx.scale(1, poolRadiusY / poolRadiusX);
        const poolGrad = ctx.createRadialGradient(0, 0, 10 * scale, 0, 0, poolRadiusX);
        poolGrad.addColorStop(0, `rgba(255, 225, 150, ${activeLampIntensity * 0.22})`);
        poolGrad.addColorStop(0.5, `rgba(250, 180, 80, ${activeLampIntensity * 0.10})`);
        poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.arc(0, 0, poolRadiusX, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [timeOfDay]);

  return (
    <canvas
      ref={canvasRef}
      className="lighting-layer"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    />
  );
}
