'use client';

import React, { useEffect, useState, useCallback } from 'react';

/* ─── QuickToast ───────────────────────────────────────────────
   Lightweight, room-themed toast for task completion feedback.
   Auto-hides after 3 seconds. Uses CSS keyframe animations
   defined in globals.css (toast-slide-in / toast-slide-out).
   
   Usage:
     <QuickToast message="✅ Nice!" onDone={() => setShow(false)} />
   ─────────────────────────────────────────────────────────── */

interface QuickToastProps {
  message: string;
  duration?: number; // ms, default 3000
  onDone: () => void;
}

const QuickToast: React.FC<QuickToastProps> = ({ message, duration = 3000, onDone }) => {
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation (300ms) before unmounting
    setTimeout(onDone, 300);
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full room-glass border border-white/[0.1] shadow-lg pointer-events-auto cursor-pointer"
      style={{
        animation: isExiting
          ? 'toast-slide-out 300ms ease-in forwards'
          : 'toast-slide-in 300ms ease-out',
      }}
      onClick={dismiss}
    >
      <span className="text-sm font-medium text-slate-100 tracking-wide">{message}</span>
    </div>
  );
};

export default QuickToast;
