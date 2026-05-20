import { useState } from "react";
import { ThumbsUp, ThumbsDown, X, Lightbulb } from "lucide-react";
import { Insight } from "../api/insightsApi";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAppStore } from "@/store/useAppStore";

interface InsightCardProps {
  insight: Insight;
  onFeedback: (insightId: string, score: number, dismiss: boolean) => Promise<void>;
  onDismiss: (insightId: string) => void;
}

export function InsightCard({ insight, onFeedback, onDismiss }: InsightCardProps) {
  const { soulColor } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [localScore, setLocalScore] = useState(insight.feedback_score);

  const handleFeedback = async (score: number) => {
    // Optimistic UI: update local state immediately
    setLocalScore(score);
    const isNegative = score === -1;
    
    if (isNegative) {
      onDismiss(insight.id);
    } else {
      setLoading(true);
    }

    try {
      // Fire API in background. If negative, also mark as dismissed in DB so it doesn't return on next poll.
      await onFeedback(insight.id, score, isNegative);
    } catch (e) {
      console.error(e);
      // In a robust app, we'd roll back the optimistic update here
    } finally {
      if (!isNegative) setLoading(false);
    }
  };

  const handleDismiss = async () => {
    // Optimistic UI: remove from DOM immediately
    onDismiss(insight.id);
    
    try {
      await onFeedback(insight.id, localScore, true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <GlassCard className="relative p-6 mb-4 flex flex-col md:flex-row items-start gap-5 overflow-hidden group border border-white/40 shadow-lg">
      {/* Glowing Orb Effect */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full animate-breathe pointer-events-none opacity-30" 
        style={{ backgroundColor: soulColor === "#e2e8f0" ? "#818cf8" : soulColor }}
      />

      <div className="w-12 h-12 rounded-full bg-white/50 flex flex-shrink-0 items-center justify-center border border-white/60 shadow-sm relative z-10 backdrop-blur-md">
        <Lightbulb className="w-6 h-6" style={{ color: soulColor === "#e2e8f0" ? "#6366f1" : soulColor }} />
      </div>

      <div className="flex-1 relative z-10 w-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-indigo-900/80 uppercase tracking-widest">
            {insight.insight_type.replace("_", " ")}
          </h4>
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
            title="Dismiss Insight"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Ethereal Serif Text */}
        <p className="font-serif text-slate-800 text-[1.05rem] leading-relaxed mb-4">
          {insight.content}
        </p>
        
        <div className="flex items-center gap-3">
          <button
            disabled={loading}
            onClick={() => handleFeedback(localScore === 1 ? 0 : 1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              localScore === 1
                ? "text-white shadow-md"
                : "bg-white/40 text-slate-600 hover:bg-white/60 border border-white/50"
            }`}
            style={localScore === 1 ? { backgroundColor: soulColor === "#e2e8f0" ? "#6366f1" : soulColor } : {}}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Helpful
          </button>
          <button
            disabled={loading}
            onClick={() => handleFeedback(localScore === -1 ? 0 : -1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              localScore === -1
                ? "bg-red-500 text-white shadow-md"
                : "bg-white/40 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-white/50"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Not Helpful
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
