"use client";

import { useEffect, useState } from "react";
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/features/analytics/api/analyticsApi";
import { useProfileData } from "@/components/dashboard/useProfileData";
import { FreeformCanvas } from "@/components/dashboard/FreeformCanvas";
import { Loader2 } from "lucide-react";

export default function CanvasPage() {
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

  if (!profile.isHydrated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Vision Canvas</h1>
          <p className="text-slate-400 text-sm">Trình bày bảng ý tưởng, lofi mixer, mục tiêu và thời gian.</p>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isEditMode 
              ? "bg-amber-500 text-slate-950 hover:bg-amber-600" 
              : "bg-white/10 hover:bg-white/20 text-slate-200"
          }`}
        >
          {isEditMode ? "Done Customizing" : "Customize Canvas"}
        </button>
      </div>

      <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-slate-950/20 border border-white/5">
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
    </div>
  );
}
