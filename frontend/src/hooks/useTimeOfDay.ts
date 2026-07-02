'use client';

import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// useTimeOfDay — Time-based lighting parameters (R5.5-P3)
// ═══════════════════════════════════════════════════════════════════════════════
// Reads system clock, outputs lighting parameters for 6 time slots:
//   Dawn (6-8), Morning (8-12), Afternoon (12-16),
//   Sunset (16-18), Evening (18-20), Night (20-6)
//
// Updates every 60 seconds.
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimeOfDayState {
  hour: number;
  minutes: number;
  colorTemp: string;
  skyGradient: [string, string];
  windowIntensity: number;
  lampOn: boolean;
  lampIntensity: number;
  ambientBrightness: number;
  isDaytime: boolean;
}

export function useTimeOfDay(): TimeOfDayState {
  const [state, setState] = useState<TimeOfDayState>(() => calculateTimeState(new Date()));

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setState(calculateTimeState(new Date()));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return state;
}

function calculateTimeState(now: Date): TimeOfDayState {
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  let windowIntensity = 0.1;
  let lampOn = false;
  let lampIntensity = 0;
  let ambientBrightness = 0.4;
  let isDaytime = false;
  
  if (hour >= 6 && hour < 8) {
    // Dawn
    windowIntensity = 0.6;
    ambientBrightness = 0.7;
    isDaytime = true;
    lampOn = true;
    lampIntensity = 0.4;
  } else if (hour >= 8 && hour < 16) {
    // Morning & Afternoon
    windowIntensity = 1.0;
    ambientBrightness = 1.0;
    isDaytime = true;
  } else if (hour >= 16 && hour < 18) {
    // Sunset
    windowIntensity = 0.7;
    ambientBrightness = 0.8;
    isDaytime = true;
    lampOn = true;
    lampIntensity = 0.6;
  } else if (hour >= 18 && hour < 20) {
    // Evening
    windowIntensity = 0.2;
    ambientBrightness = 0.5;
    lampOn = true;
    lampIntensity = 0.9;
  } else {
    // Night
    windowIntensity = 0.1;
    ambientBrightness = 0.3;
    lampOn = true;
    lampIntensity = 1.0;
  }

  return {
    hour,
    minutes,
    colorTemp: '#f5a623',
    skyGradient: ['#87CEEB', '#4A90D9'], // Handled in PixelRoomEngine.tsx CSS instead
    windowIntensity,
    lampOn,
    lampIntensity,
    ambientBrightness,
    isDaytime,
  };
}
