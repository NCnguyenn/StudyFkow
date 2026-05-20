"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Clock,
  Flame,
  TrendingUp,
  BookOpen,
  Loader2,
  BarChart2,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react";
import {
  fetchAnalyticsSummary,
  type AnalyticsSummary,
} from "@/features/analytics/api/analyticsApi";
import { fetchInsights, submitInsightFeedback, generateLlmInsight, type Insight } from "@/features/analytics/api/insightsApi";
import { InsightCard } from "@/features/analytics/components/InsightCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAppStore } from "@/store/useAppStore";

// ─── Helpers ──────────────────────────────────────────────────────

function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function shortDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
}) {
  return (
    <GlassCard className="flex flex-col relative overflow-hidden group">
      <div 
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-all group-hover:scale-150"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-xl bg-white/50 border border-white/60 shadow-sm">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 tracking-tight relative z-10">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1 relative z-10">{sub}</p>}
    </GlassCard>
  );
}

// Custom Tooltips
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-md bg-white/80 border border-white/50 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-0.5">{label}</p>
      <p className="font-bold text-slate-900">{fmtMinutes(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="backdrop-blur-md bg-white/80 border border-white/50 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-0.5">{entry.name}</p>
      <p className="font-bold" style={{ color: entry.payload.fill }}>
        {entry.value}%
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-white/40 border border-white/50 flex items-center justify-center mb-6 shadow-sm">
        <Sparkles className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">No Data Found</h2>
      <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
        Your Ethereal Insights will appear here once you complete a focus session or organize tasks.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function InsightsPage() {
  const { soulColor } = useAppStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeneratingLlm, setIsGeneratingLlm] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [llmMessage, setLlmMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchAnalyticsSummary(), fetchInsights()])
      .then(([d, ins]) => {
        if (mounted) {
          // If task_mastery/subject_balance is missing (API not updated yet), provide safe defaults
          setData({
            ...d,
            task_mastery: d.task_mastery || { on_time: 0, late: 0, incomplete: 0 },
            subject_balance: d.subject_balance || []
          });
          setInsights(ins);
        }
      })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Smart Polling Hook for LLM Insights
  useEffect(() => {
    if (!isPolling) return;

    let pollCount = 0;
    const maxPolls = 8;
    const initialInsightsCount = insights.length;

    const intervalId = setInterval(async () => {
      pollCount++;
      try {
        const currentInsights = await fetchInsights();
        if (currentInsights.length > initialInsightsCount) {
          setInsights(currentInsights);
          setIsPolling(false);
          setIsGeneratingLlm(false);
          setLlmMessage("Analysis complete!");
          setTimeout(() => setLlmMessage(null), 3000);
          clearInterval(intervalId);
          return;
        }

        if (pollCount >= maxPolls) {
          setIsPolling(false);
          setIsGeneratingLlm(false);
          setLlmMessage("Analysis taking longer than expected. Check back soon.");
          setTimeout(() => setLlmMessage(null), 5000);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isPolling, insights.length]);

  const handleDismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const isEmpty =
    !loading &&
    !error &&
    data &&
    data.total_minutes_this_week === 0 &&
    data.task_breakdown.length === 0 && 
    (data.task_mastery.on_time + data.task_mastery.late + data.task_mastery.incomplete) === 0;

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <span className="text-sm font-medium animate-pulse">Awakening Insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <GlassCard className="max-w-sm text-center">
          <p className="text-red-500 font-bold mb-2">Sync Error</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="w-full h-full flex flex-col p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-serif">Insights</h1>
          <p className="text-slate-500 mt-1">Your ethereal study sanctuary.</p>
        </div>
        <EmptyState />
      </div>
    );
  }

  const summary = data!;
  const totalThisWeekH = (summary.total_minutes_this_week / 60).toFixed(1);
  const todayFmt = fmtMinutes(summary.total_minutes_today);

  // Calculate Completion %
  const totalTasks = summary.task_mastery.on_time + summary.task_mastery.late + summary.task_mastery.incomplete;
  const completionPct = totalTasks > 0 
    ? Math.round(((summary.task_mastery.on_time + summary.task_mastery.late) / totalTasks) * 100)
    : 0;

  // Donut data for Task Mastery
  const masteryData = [
    { name: "On Time", value: summary.task_mastery.on_time, fill: "#34d399" }, // emerald-400
    { name: "Late", value: summary.task_mastery.late, fill: "#fbbf24" }, // amber-400
    { name: "Incomplete", value: summary.task_mastery.incomplete, fill: "#cbd5e1" }, // slate-300
  ].filter(d => d.value > 0);

  return (
    <div className="w-full min-h-full flex flex-col p-6 lg:p-10 space-y-8">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-serif">Ethereal Insights</h1>
        <p className="text-slate-500 mt-1">Your study patterns, beautifully visualized.</p>
      </div>

      {/* ── Overview Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Clock}
          label="Weekly Focus"
          value={`${totalThisWeekH}h`}
          sub={`${todayFmt} today`}
          accentColor={soulColor === "#e2e8f0" ? "#818cf8" : soulColor}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${summary.current_streak_days} Days`}
          sub={summary.current_streak_days > 0 ? "You're on fire!" : "Start today."}
          accentColor="#fb923c"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion"
          value={`${completionPct}%`}
          sub="Task mastery rate"
          accentColor="#34d399"
        />
      </div>

      {/* ── AI Insights Mentor ── */}
      <div className="w-full">
        {summary.total_sessions_completed < 10 ? (
          <GlassCard className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Awakening AI Mentor
              </h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                {summary.total_sessions_completed}/10
              </span>
            </div>
            <p className="text-sm text-indigo-800/80 mb-4">
              Complete 10 sessions to unlock deep, personalized insights from your AI Mentor.
            </p>
            <div className="w-full h-2 bg-indigo-200/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((summary.total_sessions_completed / 10) * 100, 100)}%` }}
              />
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 font-serif">Wisdom from the Void</h2>
              <button
                onClick={async () => {
                  setIsGeneratingLlm(true);
                  setLlmMessage(null);
                  try {
                    await generateLlmInsight();
                    setIsPolling(true);
                  } catch (err: any) {
                    setLlmMessage(err.message || "Failed to summon AI.");
                    setIsGeneratingLlm(false);
                  }
                }}
                disabled={isGeneratingLlm || isPolling}
                className="text-sm font-semibold text-indigo-600 bg-white/40 border border-white/50 hover:bg-white/80 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingLlm || isPolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Summon Insight
              </button>
            </div>
            
            {llmMessage && (
              <div className="bg-indigo-100/50 text-indigo-800 px-4 py-2 rounded-xl text-sm font-medium animate-pulse border border-indigo-200/50">
                {llmMessage}
              </div>
            )}

            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onFeedback={(id, score, dismiss) => submitInsightFeedback(id, { score, dismiss })}
                onDismiss={handleDismissInsight}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Focus Trends Bar Chart */}
        <GlassCard className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Focus Trends
          </h2>
          <div className="flex-1 min-h-[300px] w-full">
            {summary.daily_trend.every((d) => d.minutes === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No recent activity.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.daily_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" vertical={false} />
                  <XAxis 
                    dataKey={(d) => shortDay(d.date)} 
                    tick={{ fontSize: 12, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.4)" }} />
                  <Bar
                    dataKey="minutes"
                    fill={soulColor === "#e2e8f0" ? "#a5b4fc" : soulColor}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Task Mastery Donut */}
        <GlassCard className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target className="w-4 h-4" /> Task Mastery
          </h2>
          <div className="flex-1 min-h-[300px] w-full relative">
            {masteryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No tasks completed yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masteryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {masteryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 font-medium text-sm ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center Text for Donut */}
            {masteryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-bold text-slate-800">{totalTasks}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Tasks</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Subject Balance Bars */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Subject Balance
          </h2>
          {summary.subject_balance.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Assign colors to your tasks to see subject balance.
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.subject_balance}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category_name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.4)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const entry = payload[0].payload;
                      return (
                        <div className="backdrop-blur-md bg-white/80 border border-white/50 rounded-xl px-4 py-2 shadow-lg text-sm">
                          <p className="font-semibold text-slate-700 mb-0.5">{entry.category_name}</p>
                          <p className="font-bold text-slate-900">{entry.percentage}%</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="percentage" radius={[0, 8, 8, 0]} barSize={24}>
                    {summary.subject_balance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color_code || "#cbd5e1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
