"use client";

/**
 * OnboardingModal — First-visit welcome modal with name + soul color selection.
 * Glassmorphism aesthetic with glowing orb decorations.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface OnboardingModalProps {
  onComplete: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  "#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#c084fc",
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#818cf8");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-500">
        {/* Glowing orb decorations */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-400/20 blur-3xl rounded-full animate-breathe pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-violet-400/15 blur-3xl rounded-full animate-breathe pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {/* Welcome icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-white/60 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-indigo-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Welcome to AI StudyFlow
            </h2>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Let&apos;s personalize your workspace. Choose a display name and your signature soul color.
            </p>
          </div>

          {/* Name input */}
          <div className="w-full space-y-1.5">
            <label className="text-sm font-semibold text-slate-600 text-left block">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              maxLength={50}
              className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              autoFocus
            />
          </div>

          {/* Soul Color */}
          <div className="w-full space-y-1.5">
            <label className="text-sm font-semibold text-slate-600 text-left block">Soul Color</label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === c
                      ? "scale-125 shadow-lg border-white"
                      : "border-transparent hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 4px 15px ${c}50` : undefined,
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-full border-none cursor-pointer bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => onComplete(name.trim() || "Explorer", color)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 active:scale-[0.98]"
          >
            Start Your Journey ✨
          </button>
        </div>
      </div>
    </div>
  );
}
