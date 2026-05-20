/**
 * GlobalSearchModal — Cmd+K Omni-Search Palette
 *
 * Uses the `cmdk` library for a fast, keyboard-first search across:
 *   - Tasks (Planner)
 *   - Subjects
 *   - Notes
 *   - Navigation shortcuts
 *
 * Ethereal glassmorphism styling with smooth animations.
 */

"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  CheckSquare,
  BookOpen,
  Timer,
  LineChart,
  Settings,
  Home,
  Hash,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useSubjectStore } from "@/store/useSubjectStore";

// ─── Types ──────────────────────────────────────────────────────

interface SearchableItem {
  id: string;
  label: string;
  type: "task" | "subject" | "note" | "navigation" | "tag";
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

// ─── Props ──────────────────────────────────────────────────────

interface GlobalSearchModalProps {
  /** External note items for searching (passed from notes store) */
  noteItems?: Array<{
    id: string;
    title: string;
    tags: string[];
    parentFolderName?: string;
  }>;
  /** External task items for searching */
  taskItems?: Array<{
    id: string;
    title: string;
    subjectId?: string;
    status?: string;
  }>;
  /** Callback when a task is selected */
  onTaskSelect?: (taskId: string) => void;
  /** Callback when a note is selected */
  onNoteSelect?: (noteId: string) => void;
}

// ─── Component ──────────────────────────────────────────────────

export default function GlobalSearchModal({
  noteItems = [],
  taskItems = [],
  onTaskSelect,
  onNoteSelect,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const { isGlobalSearchOpen, setGlobalSearchOpen, isLiteMode } = useAppStore();
  const subjects = useSubjectStore((s) => s.subjects);

  const [internalTasks, setInternalTasks] = useState<any[]>([]);
  const [internalNotes, setInternalNotes] = useState<any[]>([]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (e.key === "Escape" && isGlobalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isGlobalSearchOpen, setGlobalSearchOpen]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setGlobalSearchOpen(false);
    },
    [router, setGlobalSearchOpen]
  );

  // Fetch omni-data when opened
  useEffect(() => {
    if (isGlobalSearchOpen) {
      const fetchOmniData = async () => {
        try {
          const now = new Date();
          const start = new Date(now);
          start.setDate(now.getDate() - 30);
          const end = new Date(now);
          end.setDate(now.getDate() + 30);

          const { fetchTasks } = await import("@/features/task_management/api/taskApi");
          const fetchedTasks = await fetchTasks(start.toISOString(), end.toISOString());
          setInternalTasks(fetchedTasks);

          const notesStr = localStorage.getItem("studyflow_notes_v1");
          if (notesStr) {
            const parsed = JSON.parse(notesStr);
            const notesArr = Object.values(parsed.notes || {});
            setInternalNotes(notesArr);
          }
        } catch (e) {
          console.error("OmniSearch sync error", e);
        }
      };
      fetchOmniData();
    }
  }, [isGlobalSearchOpen]);

  // Build searchable items
  const searchItems = useMemo<SearchableItem[]>(() => {
    const items: SearchableItem[] = [];

    // Navigation shortcuts
    const navItems = [
      { label: "Dashboard", path: "/", icon: <Home className="w-4 h-4" /> },
      { label: "Planner", path: "/tasks", icon: <CheckSquare className="w-4 h-4" /> },
      { label: "Focus", path: "/focus", icon: <Timer className="w-4 h-4" /> },
      { label: "Notes", path: "/notes", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Insights", path: "/insights", icon: <LineChart className="w-4 h-4" /> },
      { label: "Settings", path: "/settings", icon: <Settings className="w-4 h-4" /> },
    ];
    navItems.forEach((nav) => {
      items.push({
        id: `nav-${nav.path}`,
        label: nav.label,
        type: "navigation",
        description: `Go to ${nav.label}`,
        icon: nav.icon,
        action: () => navigate(nav.path),
      });
    });

    // Active data
    const activeTasks = taskItems.length > 0 ? taskItems : internalTasks;
    const activeNotes = noteItems.length > 0 ? noteItems : internalNotes;

    // Subjects
    subjects.forEach((subj) => {
      const subjectTaskCount = activeTasks.filter((t: any) => t.subjectId === subj.id || t.subject_id === subj.id).length;
      items.push({
        id: `subj-${subj.id}`,
        label: subj.title,
        type: "subject",
        description: `Subject · ${subjectTaskCount} tasks`,
        icon: (
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: subj.color || '#cbd5e1' }}
          />
        ),
        action: () => navigate("/tasks"),
      });
    });

    // Tasks
    activeTasks.forEach((task: any) => {
      const subject = subjects.find((s) => s.id === task.subjectId || s.id === task.subject_id);
      items.push({
        id: `task-${task.id}`,
        label: task.title,
        type: "task",
        description: subject ? `Task · ${subject.title}` : "Task",
        icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onTaskSelect?.(task.id);
          setGlobalSearchOpen(false);
        },
      });
    });

    // Notes
    activeNotes.forEach((note: any) => {
      items.push({
        id: `note-${note.id}`,
        label: note.title,
        type: "note",
        description: note.parentFolderName
          ? `Note · ${note.parentFolderName}`
          : "Note",
        icon: <FileText className="w-4 h-4 text-amber-400" />,
        action: () => {
          onNoteSelect?.(note.id);
          setGlobalSearchOpen(false);
        },
      });

      // Hashtags from notes
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => {
          if (!items.some((i) => i.id === `tag-${tag}`)) {
          items.push({
            id: `tag-${tag}`,
            label: `#${tag}`,
            type: "tag",
            description: "Hashtag",
            icon: <Hash className="w-4 h-4 text-violet-400" />,
            action: () => {
              onNoteSelect?.(note.id);
              setGlobalSearchOpen(false);
            },
          });
        }
      });
      }
    });

    return items;
  }, [subjects, taskItems, noteItems, internalTasks, internalNotes, navigate, onTaskSelect, onNoteSelect, setGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setGlobalSearchOpen(false)}
      />

      {/* Command Palette */}
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-3 fade-in duration-200 ${
          isLiteMode
            ? "bg-white border border-slate-200"
            : "bg-white/80 backdrop-blur-xl border border-white/50"
        }`}
      >
        <Command className="w-full" loop>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/20">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Command.Input
              placeholder="Search tasks, notes, subjects…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-400 bg-slate-100/60 border border-slate-200/50">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-400">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-indigo-300" />
              No results found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {searchItems
                .filter((i) => i.type === "navigation")
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={item.action}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 cursor-pointer transition-colors data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                  >
                    <span className="shrink-0 text-slate-400">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {item.description}
                    </span>
                  </Command.Item>
                ))}
            </Command.Group>

            {/* Subjects Group */}
            {searchItems.some((i) => i.type === "subject") && (
              <Command.Group
                heading="Subjects"
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {searchItems
                  .filter((i) => i.type === "subject")
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 cursor-pointer transition-colors data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        {item.description}
                      </span>
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            {/* Tasks Group */}
            {searchItems.some((i) => i.type === "task") && (
              <Command.Group
                heading="Tasks"
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {searchItems
                  .filter((i) => i.type === "task")
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 cursor-pointer transition-colors data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        {item.description}
                      </span>
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            {/* Notes & Tags Group */}
            {searchItems.some((i) => i.type === "note" || i.type === "tag") && (
              <Command.Group
                heading="Notes & Tags"
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {searchItems
                  .filter((i) => i.type === "note" || i.type === "tag")
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 cursor-pointer transition-colors data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        {item.description}
                      </span>
                    </Command.Item>
                  ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/20 text-[10px] text-slate-400">
            <span>
              <kbd className="px-1 py-0.5 rounded font-mono bg-slate-100/60 border border-slate-200/50">↑↓</kbd> Navigate
              <span className="mx-1.5">·</span>
              <kbd className="px-1 py-0.5 rounded font-mono bg-slate-100/60 border border-slate-200/50">↵</kbd> Select
            </span>
            <span className="font-semibold text-indigo-400">⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
