"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X, Clock, Flag, Type, AlignLeft, Palette, AlertTriangle,
  Loader2, Trash2, Play, RefreshCw, Plus, GripVertical,
  Check, Repeat, Timer, Link2, ChevronDown,
} from "lucide-react";
import { useSubjectStore } from "@/store/useSubjectStore";
import type { SubTask } from "@/types/planner";

export type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "CUSTOM";

export const SUBJECT_COLORS = [
  { hex: "#ef4444", name: "Red", textColor: "text-red-600", borderColor: "border-red-500" },
  { hex: "#f97316", name: "Orange", textColor: "text-orange-600", borderColor: "border-orange-500" },
  { hex: "#f59e0b", name: "Amber", textColor: "text-amber-600", borderColor: "border-amber-500" },
  { hex: "#84cc16", name: "Lime", textColor: "text-lime-600", borderColor: "border-lime-500" },
  { hex: "#10b981", name: "Emerald", textColor: "text-emerald-600", borderColor: "border-emerald-500" },
  { hex: "#06b6d4", name: "Cyan", textColor: "text-cyan-600", borderColor: "border-cyan-500" },
  { hex: "#3b82f6", name: "Blue", textColor: "text-blue-600", borderColor: "border-blue-500" },
  { hex: "#8b5cf6", name: "Violet", textColor: "text-violet-600", borderColor: "border-violet-500" },
  { hex: "#d946ef", name: "Fuchsia", textColor: "text-fuchsia-600", borderColor: "border-fuchsia-500" },
  { hex: "#f43f5e", name: "Rose", textColor: "text-rose-600", borderColor: "border-rose-500" },
  { hex: "#64748b", name: "Slate", textColor: "text-slate-600", borderColor: "border-slate-500" },
];

// ─── Color Palette (re-exported for backward compat) ────────────

export interface ColorOption {
  hex: string; name: string; textColor: string; borderColor: string;
}

export const TASK_COLORS: ColorOption[] = SUBJECT_COLORS.map(c => ({
  hex: c.hex, name: c.name, textColor: c.textColor, borderColor: c.borderColor,
}));

// ─── Types ───────────────────────────────────────────────────────

export interface TaskEditData {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  color_code: string | null;
  planned_start: string;
  planned_end: string;
  subjectId?: string;
  overtimeMinutes?: number;
  recurrence?: RecurrencePattern;
  recurrenceDays?: number[];
  subTasks?: SubTask[];
  linkedNoteId?: string | null;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskFormData) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  initialStart?: Date;
  initialEnd?: Date;
  editTask?: TaskEditData | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: number;
  color_code: string;
  planned_start: string;
  planned_end: string;
  subjectId?: string;
  overtimeMinutes?: number;
  recurrence?: RecurrencePattern;
  recurrenceDays?: number[];
  subTasks?: SubTask[];
}

// ─── Helpers ─────────────────────────────────────────────────────

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ─── SubTask Item ────────────────────────────────────────────────

function SubTaskItem({
  subTask, onToggle, onDelete, onRename,
}: {
  subTask: SubTask;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-60 cursor-grab shrink-0" />
      <button type="button" onClick={onToggle}
        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
          subTask.is_completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-slate-300 hover:border-indigo-400"
        }`}
      >
        {subTask.is_completed && <Check className="w-2.5 h-2.5 text-white" />}
      </button>
      <input
        value={subTask.title}
        onChange={(e) => onRename(e.target.value)}
        className={`flex-1 bg-transparent text-xs text-slate-700 focus:outline-none ${
          subTask.is_completed ? "line-through opacity-50" : ""
        }`}
        placeholder="Sub-task…"
      />
      <button type="button" onClick={onDelete}
        className="p-0.5 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────

export default function TaskModal({
  isOpen, onClose, onSubmit, onDelete, initialStart, initialEnd, editTask,
}: TaskModalProps) {
  const router = useRouter();
  const subjects = useSubjectStore((s) => s.subjects);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<number>(2);
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0].hex);
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [overtimeMinutes, setOvertimeMinutes] = useState(15);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>("NONE");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [enableReview, setEnableReview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const startDate = plannedStart ? new Date(plannedStart) : null;
  const endDate = plannedEnd ? new Date(plannedEnd) : null;
  const durationMinutes = startDate && endDate ? (endDate.getTime() - startDate.getTime()) / 60000 : 0;
  const showPomodoroWarning = durationMinutes > 50 && durationMinutes > 0;

  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isEditMode = !!editTask;

  // Auto-inherit color when subject changes
  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const subj = subjects.find((s) => s.id === subjectId);
    if (subj) {
      setSelectedColor(subj.color || TASK_COLORS[0].hex);
      if (!isEditMode) {
        setPriority(subj.priority === 'HIGH' ? 1 : subj.priority === 'MEDIUM' ? 2 : 3);
      }
    }
  }, [subjects, isEditMode]);

  // Pre-fill
  useEffect(() => {
    if (!isOpen) return;
    setError(""); setIsSubmitting(false); setIsDeleting(false);
    setEnableReview(false); setShowAdvanced(false);

    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description ?? "");
      setPriority(editTask.priority);
      setSelectedColor(editTask.color_code ?? TASK_COLORS[0].hex);
      setPlannedStart(toLocalDatetimeString(new Date(editTask.planned_start)));
      setPlannedEnd(toLocalDatetimeString(new Date(editTask.planned_end)));
      setSelectedSubjectId(editTask.subjectId ?? "");
      setOvertimeMinutes(editTask.overtimeMinutes ?? 15);
      setRecurrence(editTask.recurrence ?? "NONE");
      setRecurrenceDays(editTask.recurrenceDays ?? []);
      setSubTasks(editTask.subTasks ?? []);
      if (editTask.overtimeMinutes || editTask.recurrence !== "NONE") setShowAdvanced(true);
    } else {
      setTitle(""); setDescription(""); setPriority(2);
      setSelectedColor(TASK_COLORS[0].hex); setSelectedSubjectId("");
      setOvertimeMinutes(15); setRecurrence("NONE"); setRecurrenceDays([]);
      setSubTasks([]); 
      if (initialStart) setPlannedStart(toLocalDatetimeString(initialStart));
      if (initialEnd) setPlannedEnd(toLocalDatetimeString(initialEnd));
    }
    setTimeout(() => titleRef.current?.focus(), 150);
  }, [isOpen, initialStart, initialEnd, editTask]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // SubTask CRUD
  const addSubTask = () => {
    setSubTasks((prev) => [...prev, {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: "", is_completed: false, sortOrder: prev.length,
    }]);
  };
  const toggleSubTask = (id: string) => {
    setSubTasks((prev) => prev.map((s) => s.id === id ? { ...s, is_completed: !s.is_completed } : s));
  };
  const deleteSubTask = (id: string) => {
    setSubTasks((prev) => prev.filter((s) => s.id !== id));
  };
  const renameSubTask = (id: string, title: string) => {
    setSubTasks((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
  };

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!plannedStart || !plannedEnd) { setError("Both start and end times are required"); return; }
    const s = new Date(plannedStart); const en = new Date(plannedEnd);
    if (en <= s) { setError("End time must be after start time"); return; }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(), description: description.trim(), priority,
        color_code: selectedColor,
        planned_start: s.toISOString(), planned_end: en.toISOString(),
        subjectId: selectedSubjectId || undefined,
        overtimeMinutes, recurrence, recurrenceDays,
        subTasks: subTasks.filter((st) => st.title.trim()),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!editTask || !onDelete) return;
    setIsDeleting(true); setError("");
    try { await onDelete(editTask.id); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete task"); }
    finally { setIsDeleting(false); }
  };

  const priorityLabels = [
    { value: 1, label: "High", color: "bg-red-500/20 text-red-600 border-red-500/30" },
    { value: 2, label: "Medium", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
    { value: 3, label: "Low", color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" },
  ];

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const completedCount = subTasks.filter((s) => s.is_completed).length;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/60 backdrop-blur-xl rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditMode ? "Edit Task" : "New Task"}
          </h2>
          <div className="flex items-center gap-1">
            {isEditMode && editTask && (
              <button type="button" onClick={() => router.push(`/focus?taskId=${editTask.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all mr-2">
                <Play className="w-3.5 h-3.5 fill-current" /> Start Focus
              </button>
            )}
            {isEditMode && onDelete && (
              <button type="button" onClick={handleDelete} disabled={isDeleting}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete task">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}

          {/* Subject selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <Link2 className="w-3.5 h-3.5" /> Subject
            </label>
            <select value={selectedSubjectId} onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/30 border border-white/40 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all appearance-none cursor-pointer">
              <option value="">— Select Subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <Type className="w-3.5 h-3.5" /> Title
            </label>
            <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Machine Learning Lecture" maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white/30 border border-white/40 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details…" rows={2}
              className="w-full px-3.5 py-2.5 bg-white/30 border border-white/40 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-none" />
          </div>

          {/* Start / End Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Start
              </label>
              <input type="datetime-local" value={plannedStart} onChange={(e) => setPlannedStart(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/30 border border-white/40 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> End
              </label>
              <input type="datetime-local" value={plannedEnd} onChange={(e) => setPlannedEnd(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/30 border border-white/40 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
            </div>
          </div>

          {showPomodoroWarning && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span><strong>Heads up:</strong> {Math.round(durationMinutes)}min exceeds a 50-min Pomodoro block.</span>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Flag className="w-3.5 h-3.5" /> Priority
            </label>
            <div className="flex gap-2">
              {priorityLabels.map((p) => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    priority === p.value ? p.color + " ring-1 ring-white/50 bg-white/40" : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Palette className="w-3.5 h-3.5" /> Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map((c) => (
                <button key={c.hex} type="button" onClick={() => setSelectedColor(c.hex)}
                  className={`w-8 h-8 rounded-xl transition-all border-2 ${
                    selectedColor === c.hex ? "scale-110 shadow-lg border-white" : "border-transparent hover:scale-105"
                  }`} style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
          </div>

          {/* ── SubTasks (Todo List) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Check className="w-3.5 h-3.5" /> Todos
                {subTasks.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {completedCount}/{subTasks.length}
                  </span>
                )}
              </label>
              <button type="button" onClick={addSubTask}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-indigo-500 hover:bg-indigo-50 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {subTasks.length > 0 && (
              <div className="space-y-1.5 p-2.5 rounded-xl bg-white/20 border border-white/30">
                {subTasks.map((st) => (
                  <SubTaskItem key={st.id} subTask={st}
                    onToggle={() => toggleSubTask(st.id)}
                    onDelete={() => deleteSubTask(st.id)}
                    onRename={(t) => renameSubTask(st.id, t)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Advanced Toggle ── */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-3 rounded-xl bg-white/15 border border-white/25 animate-in slide-in-from-top-1 fade-in duration-150">
              {/* Overtime Allowance */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <Timer className="w-3.5 h-3.5" /> Overtime Allowance
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={180} value={overtimeMinutes}
                    onChange={(e) => setOvertimeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-2 bg-white/30 border border-white/40 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <span className="text-xs text-slate-500">minutes</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Border turns yellow during overtime, red after.
                </p>
              </div>

              {/* Recurring */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <Repeat className="w-3.5 h-3.5" /> Recurring
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {(["NONE", "DAILY", "WEEKLY", "CUSTOM"] as RecurrencePattern[]).map((r) => (
                    <button key={r} type="button" onClick={() => setRecurrence(r)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        recurrence === r
                          ? "bg-indigo-100 text-indigo-600 border-indigo-200"
                          : "bg-white/20 text-slate-500 border-white/30 hover:bg-white/40"
                      }`}>{r === "NONE" ? "None" : r.charAt(0) + r.slice(1).toLowerCase()}</button>
                  ))}
                </div>

                {recurrence === "CUSTOM" && (
                  <div className="flex gap-1.5 mt-2">
                    {dayLabels.map((label, i) => (
                      <button key={i} type="button" onClick={() => toggleRecurrenceDay(i)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-bold border transition-all ${
                          recurrenceDays.includes(i)
                            ? "bg-indigo-500 text-white border-indigo-500"
                            : "bg-white/20 text-slate-400 border-white/30 hover:bg-white/40"
                        }`}>{label.slice(0, 2)}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-review Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={enableReview}
                  onChange={(e) => setEnableReview(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-6 bg-white/40 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-400 border border-white/50 shadow-inner relative transition-colors" />
                <span className="flex items-center gap-1.5 text-xs text-slate-600 group-hover:text-indigo-600 transition-colors select-none">
                  <RefreshCw className={`w-3.5 h-3.5 ${enableReview ? "text-indigo-500 animate-spin-slow" : "text-slate-400"}`} />
                  Auto-review
                </span>
              </label>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={isSubmitting || isDeleting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500/90 to-purple-500/90 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20">
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{isEditMode ? "Saving…" : "Creating…"}</>
            ) : (
              isEditMode ? "Save Changes" : "Create Task"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
