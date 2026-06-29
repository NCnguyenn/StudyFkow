'use client';

import { useEffect } from 'react';

/**
 * V3 Performance Hook: Battery-Aware Mode
 * 
 * Detects device battery status via the Battery Status API.
 * When battery < 30% and not charging, adds `perf-battery-saver` class to <html>,
 * which triggers CSS rules that:
 *   1. Hide ambient mesh entirely
 *   2. Remove all backdrop-filter blur
 *   3. Reduce all animation/transition durations to near-zero
 * 
 * When the device starts charging or battery rises above 30%, effects are restored.
 * Falls back gracefully — does nothing if Battery API is unavailable.
 */

const LOW_BATTERY_THRESHOLD = 0.3; // 30%

interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  addEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void;
  removeEventListener(type: 'chargingchange' | 'levelchange', listener: () => void): void;
}

export function useBatteryPerformance() {
  useEffect(() => {
    // Battery Status API is not available in all browsers
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return;

    let battery: BatteryManager | null = null;
    let checkFn: (() => void) | null = null;

    (navigator as any).getBattery().then((bat: BatteryManager) => {
      battery = bat;

      checkFn = () => {
        if (!battery) return;
        const isLowPower = !battery.charging && battery.level < LOW_BATTERY_THRESHOLD;
        document.documentElement.classList.toggle('perf-battery-saver', isLowPower);
      };

      // Initial check
      checkFn();

      // Listen for changes
      battery.addEventListener('chargingchange', checkFn);
      battery.addEventListener('levelchange', checkFn);
    }).catch(() => {
      // Battery API not available or permission denied — fail silently
    });

    return () => {
      if (battery && checkFn) {
        battery.removeEventListener('chargingchange', checkFn);
        battery.removeEventListener('levelchange', checkFn);
      }
      // Ensure cleanup
      document.documentElement.classList.remove('perf-battery-saver');
    };
  }, []);
}
