"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/components/dashboard/useProfileData";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";

// ─── Zen Mode View ──────────────────────────────────────────────────────
function ZenModeView({ soulColor }: { soulColor: string }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { 
    const i = setInterval(() => setTime(new Date()), 1000); 
    return () => clearInterval(i); 
  }, []);
  const c = soulColor === "#e2e8f0" ? "#818cf8" : soulColor;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-1000 min-h-[70vh]">
      <div className="flex flex-col items-center justify-center space-y-12">
        <p className="text-2xl md:text-4xl lg:text-5xl font-serif italic text-center max-w-2xl leading-relaxed" style={{ color: c, opacity: 0.7 }}>
          &ldquo;Focus is not about saying yes to the thing you&apos;ve got to focus on. It is about saying no to the hundred other good ideas.&rdquo;
        </p>
        <div className="text-7xl md:text-9xl font-extralight tracking-widest text-white/10 font-mono tabular-nums select-none">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <Link href="/focus" className="flex items-center gap-3 px-8 py-4 rounded-full glass-card hover:bg-white/[0.08] text-gray-300 hover:text-white transition-all duration-300">
          <PlayCircle className="w-6 h-6" style={{ color: c }} />
          <span className="text-lg font-medium tracking-wide uppercase">Start Focus Session</span>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { isZenMode, soulColor, setSoulColor } = useAppStore();
  const profile = useProfileData();

  if (isZenMode) return <ZenModeView soulColor={soulColor} />;
  if (!profile.isHydrated) return null;

  return (
    <div className="w-full h-full pointer-events-none">
      {profile.showOnboarding && (
        <div className="pointer-events-auto">
          <OnboardingModal 
            onComplete={(name, color) => { 
              profile.updateDisplayName(name); 
              setSoulColor(color); 
              profile.setShowOnboarding(false); 
            }} 
          />
        </div>
      )}
    </div>
  );
}
