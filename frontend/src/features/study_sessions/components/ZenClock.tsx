import React, { useMemo } from 'react';
import { useFocusStore } from '@/store/useFocusStore';

export const ZenClock = () => {
  const { phase, timeLeft, preset } = useFocusStore();

  const totalTime = useMemo(() => {
    if (phase === 'BREAK') return preset.breakMinutes * 60;
    return preset.focusMinutes * 60;
  }, [phase, preset]);

  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const gradientId = `clock-gradient-${phase}`;

  let stop1Color = '#818cf8'; // indigo-400
  let stop2Color = '#a78bfa'; // violet-400
  let glowColor = 'rgba(99, 102, 241, 0.2)';

  if (phase === 'WARNING') {
    stop1Color = '#f87171'; // red-400
    stop2Color = '#fb923c'; // orange-400
    glowColor = 'rgba(239, 68, 68, 0.25)';
  } else if (phase === 'BREAK') {
    stop1Color = '#f9a8d4'; // pink-300
    stop2Color = '#fbbf24'; // amber-400
    glowColor = 'rgba(251, 191, 36, 0.15)';
  }

  return (
    <div className={`relative flex items-center justify-center w-[360px] h-[360px] lg:w-[420px] lg:h-[420px] ${phase === 'BREAK' ? 'animate-pulse' : ''}`}>
      <svg className="w-full h-full -rotate-90" style={{ filter: `drop-shadow(0 0 40px ${glowColor})` }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stop1Color} />
            <stop offset="100%" stopColor={stop2Color} />
          </linearGradient>
        </defs>
        
        {/* Background track */}
        <circle 
          cx="50%" 
          cy="50%" 
          r={radius} 
          stroke="rgba(0, 0, 0, 0.05)" 
          strokeWidth="4" 
          fill="none" 
        />
        
        {/* Progress arc */}
        <circle 
          cx="50%" 
          cy="50%" 
          r={radius} 
          stroke={`url(#${gradientId})`}
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1s linear, stroke 1s ease'
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-6xl lg:text-7xl font-extralight tracking-[0.15em] tabular-nums transition-colors duration-1000 ${phase === 'WARNING' ? 'text-red-500' : 'text-slate-800'}`}>
          {minutes}:{seconds}
        </span>
        <span className={`text-xs font-semibold tracking-[0.3em] uppercase mt-4 transition-colors duration-1000 ${
          phase === 'WARNING' ? 'text-red-500' : 
          phase === 'BREAK' ? 'text-amber-500/60' : 
          'text-slate-500'
        }`}>
          {phase === 'FOCUSING' ? 'Deep Focus' : phase}
        </span>
      </div>
    </div>
  );
};
