'use client';

import React, { useRef, useEffect } from 'react';
import { SteamParticleSystem } from './particles/SteamParticles';
import { DustParticleSystem } from './particles/DustParticles';
import { FireflyParticleSystem } from './particles/FireflyParticles';
import { RainParticleSystem } from './particles/RainParticles';
import { StarParticleSystem } from './particles/StarParticles';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

// ═══════════════════════════════════════════════════════════════════════════════
// ParticleCanvas — Particle effects overlay (R5.5-P4)
// ═══════════════════════════════════════════════════════════════════════════════

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeOfDay = useTimeOfDay();
  
  const systemsRef = useRef({
    steam: new SteamParticleSystem(),
    dust: new DustParticleSystem(),
    fireflies: new FireflyParticleSystem(),
    rain: new RainParticleSystem(),
    stars: new StarParticleSystem(),
  });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const renderLoop = (time: number) => {
      // Delta time in seconds, clamped to avoid huge jumps
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      // Skip updates when tab is hidden
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scaleX = canvas.width / 1920;
      const scaleY = canvas.height / 1080;
      
      const systems = systemsRef.current;
      
      // 1. Steam is always active (Golden Rule #4: particles for life)
      systems.steam.update(dt);
      systems.steam.render(ctx, scaleX, scaleY);
      
      // 2. Daytime / Nighttime systems
      if (timeOfDay.isDaytime) {
        systems.dust.update(dt);
        systems.dust.render(ctx, scaleX, scaleY);
      } else {
        // Nighttime: render stars outside window, fireflies floating in room
        systems.stars.update(dt);
        systems.stars.render(ctx, scaleX, scaleY);
        
        systems.fireflies.update(dt);
        systems.fireflies.render(ctx, scaleX, scaleY);
      }
      
      // 3. Rain weather particle system
      // Mock rain condition as true for now (will be hooked to weather store in Phase R6)
      const isRaining = true;
      if (isRaining) {
        systems.rain.update(dt);
        systems.rain.render(ctx, scaleX, scaleY);
      }
      
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    animationFrameId = requestAnimationFrame(renderLoop);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [timeOfDay]);
  
  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    />
  );
}
