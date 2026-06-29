"use client";

import React from 'react';
import { useFocusStore } from '@/store/useFocusStore';
import { PrepareSpace } from '@/features/study_sessions/components/PrepareSpace';
import { DeepFocusWorkspace } from '@/features/study_sessions/components/DeepFocusWorkspace';
import { Trophy, RotateCcw } from 'lucide-react';

export default function FocusPage() {
  const { phase, abortSession } = useFocusStore();

  return (
    <div
      className="relative flex items-center justify-center h-full w-full overflow-hidden"
      style={{ animation: 'room-fade-in 350ms ease-out' }}
    >

      {/* Phase-reactive Aura glow behind the clock */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full blur-[120px] transition-colors duration-[2000ms] ${
          phase === 'WARNING' ? 'bg-red-500/15' :
          phase === 'BREAK' ? 'bg-orange-400/10' :
          phase === 'COMPLETED' ? 'bg-emerald-500/10' :
          'bg-indigo-500/10'
        }`} style={{ animation: 'auraPulse 4s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 w-full h-full">
        {phase === 'SETUP' ? (
          <div className="h-full flex items-center justify-center px-4">
            <PrepareSpace />
          </div>
        ) : phase === 'COMPLETED' ? (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-8 shadow-sm backdrop-blur-sm">
              <Trophy className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-light text-slate-100 tracking-widest mb-3">SESSION COMPLETE</h1>
            <p className="text-slate-400 text-sm tracking-wider mb-12">Well done. Your focus was recorded.</p>
            <button 
              onClick={abortSession}
              className="flex items-center gap-3 px-8 py-3 rounded-full room-glass text-slate-300 hover:text-slate-100 hover:bg-white/[0.08] transition-all border border-white/[0.08]"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wider">New Session</span>
            </button>
          </div>
        ) : (
          <DeepFocusWorkspace />
        )}
      </div>
      
    </div>
  );
}
