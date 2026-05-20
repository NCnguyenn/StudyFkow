/**
 * Calendar Utility Functions
 *
 * Handles all time-to-pixel math and overlap resolution for the
 * custom CSS Grid calendar view. The overlap algorithm mirrors
 * Google Calendar's cascading/stacking approach.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface CalendarTask {
  id: string;
  title: string;
  planned_start: Date;
  planned_end: Date;
  color: string;        // Pastel hex, e.g. "#dbeafe"
  textColor: string;    // Darker accent for contrast, e.g. "#1e40af"
  borderColor: string;  // Left-border accent, e.g. "#3b82f6"
  category?: string;
  priority?: number;
}

export interface PositionedTask extends CalendarTask {
  /** Percentage from the top of the day column (0–100) */
  topPercent: number;
  /** Height as a percentage of the full day column */
  heightPercent: number;
  /** Fractional left offset within the column (0–1) */
  leftFraction: number;
  /** Fractional width within the column (0–1) */
  widthFraction: number;
  /** z-index for stacking order */
  zIndex: number;
}

// ─── Constants ───────────────────────────────────────────────────

const MINUTES_IN_DAY = 24 * 60;
const MIN_BLOCK_HEIGHT_PERCENT = (15 / MINUTES_IN_DAY) * 100; // 15-min minimum

// ─── Time-to-Position Math ───────────────────────────────────────

/**
 * Converts a Date into a "minutes since midnight" value.
 * Uses local time so the grid aligns with the user's viewport.
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Returns the top% and height% for a task within a 24-hour column.
 */
export function getTimePosition(start: Date, end: Date): { topPercent: number; heightPercent: number } {
  const startMinutes = dateToMinutes(start);
  const endMinutes = dateToMinutes(end);

  const topPercent = (startMinutes / MINUTES_IN_DAY) * 100;
  const rawHeight = ((endMinutes - startMinutes) / MINUTES_IN_DAY) * 100;
  const heightPercent = Math.max(rawHeight, MIN_BLOCK_HEIGHT_PERCENT);

  return { topPercent, heightPercent };
}

// ─── Overlap Resolution (Google Calendar Algorithm) ──────────────
//
// The algorithm works in three passes:
//   1. Sort tasks by start time, then by duration (longest first).
//   2. Group tasks into "collision clusters" — sets of tasks that
//      transitively overlap with each other.
//   3. Within each cluster, assign column indices. The width of each
//      task is 1/maxColumns, and the left offset is columnIndex/maxColumns.
//      To mimic Google Calendar's overlapping feel, we expand width
//      slightly so adjacent tasks overlap by a few percent.

interface TaskSlot {
  task: CalendarTask;
  startMin: number;
  endMin: number;
  column: number;
}

/**
 * Groups tasks that belong to the same day and resolves overlaps,
 * returning fully positioned task objects ready for CSS rendering.
 */
export function resolveOverlaps(tasks: CalendarTask[]): PositionedTask[] {
  if (tasks.length === 0) return [];

  // 1. Convert to minute ranges and sort
  const slots: TaskSlot[] = tasks.map((task) => ({
    task,
    startMin: dateToMinutes(task.planned_start),
    endMin: dateToMinutes(task.planned_end),
    column: 0,
  }));

  slots.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    // Longer events first — they anchor the column layout
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  // 2. Build collision clusters
  const clusters: TaskSlot[][] = [];
  let currentCluster: TaskSlot[] = [];
  let clusterEnd = -1;

  for (const slot of slots) {
    if (currentCluster.length === 0 || slot.startMin < clusterEnd) {
      // This slot overlaps with the current cluster
      currentCluster.push(slot);
      clusterEnd = Math.max(clusterEnd, slot.endMin);
    } else {
      // Start a new cluster
      clusters.push(currentCluster);
      currentCluster = [slot];
      clusterEnd = slot.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 3. Assign columns within each cluster
  const positioned: PositionedTask[] = [];

  for (const cluster of clusters) {
    // Track which columns are in use at any given time
    const columnEnds: number[] = []; // columnEnds[i] = the end-minute of the task currently occupying column i

    for (const slot of cluster) {
      // Find the first column where this task fits (no overlap)
      let assignedColumn = -1;
      for (let col = 0; col < columnEnds.length; col++) {
        if (slot.startMin >= columnEnds[col]) {
          assignedColumn = col;
          break;
        }
      }

      if (assignedColumn === -1) {
        // Need a new column
        assignedColumn = columnEnds.length;
        columnEnds.push(0);
      }

      slot.column = assignedColumn;
      columnEnds[assignedColumn] = slot.endMin;
    }

    const maxColumns = columnEnds.length;

    // Google Calendar style: each task gets slightly more than its
    // fair share of width so that adjacent tasks visually overlap.
    // The overlap factor shrinks as columns increase.
    const OVERLAP_EXTRA = maxColumns <= 2 ? 0.15 : 0.08;

    for (const slot of cluster) {
      const { topPercent, heightPercent } = getTimePosition(
        slot.task.planned_start,
        slot.task.planned_end
      );

      const baseWidth = 1 / maxColumns;
      const widthFraction = Math.min(baseWidth + OVERLAP_EXTRA, 1 - slot.column * baseWidth);
      const leftFraction = slot.column * baseWidth;

      positioned.push({
        ...slot.task,
        topPercent,
        heightPercent,
        leftFraction,
        widthFraction,
        zIndex: 10 + slot.column, // Later columns render on top
      });
    }
  }

  return positioned;
}

// ─── Week Helpers ────────────────────────────────────────────────

/**
 * Returns the Monday of the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns an array of 7 Date objects (Mon–Sun) for the week
 * containing the given date.
 */
export function getWeekDays(date: Date): Date[] {
  const monday = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Checks if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Checks if a date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Formats an hour index (0–23) into a 12-hour label.
 * e.g. 0 → "12 AM", 9 → "9 AM", 13 → "1 PM"
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Short day name (Mon, Tue, …)
 */
export function formatDayShort(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Day of month number
 */
export function formatDayNumber(date: Date): string {
  return date.getDate().toString();
}
