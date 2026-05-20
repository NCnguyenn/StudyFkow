"use client";
/**
 * Dashboard — "Ethereal Vision Canvas"
 *
 * Architecture:
 *   page.tsx              → Shell, Zen Mode, orchestration
 *   ProfileHero.tsx       → Cover photo + avatar (kept as-is)
 *   FreeformCanvas.tsx    → react-rnd infinite canvas
 *   widgets.tsx           → Individual widget components
 *   useProfileData.ts     → Persistence (localStorage + localforage)
 */

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import Link from "next/link";
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/features/analytics/api/analyticsApi";
import { useAppStore } from "@/store/useAppStore";
import { useProfileData } from "@/components/dashboard/useProfileData";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { ProfileHero } from "@/components/dashboard/ProfileHero";
import { FreeformCanvas } from "@/components/dashboard/FreeformCanvas";

// ─── Zen Mode ──────────────────────────────────────────────────────
function ZenModeView({ soulColor }: { soulColor: string }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
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

// ─── Skeleton ──────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6 p-2">
      <div className="w-full h-48 md:h-64 rounded-3xl bg-white/[0.03]" />
      <div className="flex items-end gap-4 px-6 -mt-16">
        <div className="w-32 h-32 rounded-full bg-white/[0.05] border-4 border-white/[0.06]" />
        <div className="space-y-2 pb-4"><div className="w-32 h-6 rounded-lg bg-white/[0.04]" /><div className="w-48 h-4 rounded-lg bg-white/[0.03]" /></div>
      </div>
      <div className="h-96 rounded-3xl bg-white/[0.02]" />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────
export default function DashboardOverviewPage() {
  const { isZenMode, soulColor, setSoulColor } = useAppStore();
  const profile = useProfileData();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    let m = true;
    fetchAnalyticsSummary()
      .then(d => { if (m) setAnalyticsData(d); })
      .catch(() => {})
      .finally(() => { if (m) setAnalyticsLoading(false); });
    return () => { m = false; };
  }, []);

  if (isZenMode) return <ZenModeView soulColor={soulColor} />;
  if (!profile.isHydrated) return <DashboardSkeleton />;

  return (
    <div className="w-full h-full flex flex-col p-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {profile.showOnboarding && (
        <OnboardingModal onComplete={(name, color) => { profile.updateDisplayName(name); setSoulColor(color); profile.setShowOnboarding(false); }} />
      )}

      <ProfileHero
        displayName={profile.displayName} bioText={profile.bioText}
        location={profile.location} occupation={profile.occupation}
        avatarBase64={profile.avatarBase64} coverBase64={profile.coverBase64}
        avatarShape={profile.avatarShape} avatarFit={profile.avatarFit}
        onUpdateName={profile.updateDisplayName} onUpdateBio={profile.updateBio}
        onUpdateLocation={profile.updateLocation} onUpdateOccupation={profile.updateOccupation}
        onUploadAvatar={f => profile.uploadAvatar(f)} onUploadCover={f => profile.uploadCover(f)}
        onToggleShape={() => profile.updateAvatarShape(profile.avatarShape === "circle" ? "rounded-square" : "circle")}
        onToggleFit={() => profile.updateAvatarFit(profile.avatarFit === "cover" ? "contain" : "cover")}
      />

      <FreeformCanvas
        widgets={profile.widgets}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        onAdd={profile.addWidget}
        onRemove={profile.removeWidget}
        onUpdate={profile.updateWidget}
        onBringToFront={profile.bringToFront}
        analyticsData={analyticsData}
        analyticsLoading={analyticsLoading}
      />
    </div>
  );
}
