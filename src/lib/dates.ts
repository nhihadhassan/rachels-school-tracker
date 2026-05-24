import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  isPast,
  isFuture,
  parseISO,
  isWithinInterval,
  format,
  formatDistanceToNow,
} from "date-fns";
import type { DashboardItem } from "./types";

/** Toronto is America/Toronto but for grouping we just use the local machine time.
 *  The server runs in UTC — we offset to match the user's expectation loosely.
 *  For a personal tracker this is good enough; proper timezone handling is a Phase 2 polish.
 */
function now() {
  return new Date();
}

function weekStart(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 }); // Monday
}

export type GroupKey = "overdue" | "this-week" | "next-week" | "later" | "done";

export interface DashboardGroup {
  key: GroupKey;
  label: string;
  items: DashboardItem[];
}

function itemDueDate(item: DashboardItem): Date | null {
  if (item.kind === "assignment") {
    return parseISO(item.item.due_date);
  }
  return item.item.due_date ? parseISO(item.item.due_date) : null;
}

function itemIsDone(item: DashboardItem): boolean {
  if (item.kind === "assignment") return item.item.status === "done" || item.item.status === "skipped";
  return item.item.is_done;
}

export function groupDashboardItems(items: DashboardItem[]): DashboardGroup[] {
  const today = now();
  const thisWeekStart = weekStart(today);
  const nextWeekStart = addWeeks(thisWeekStart, 1);
  const weekAfterStart = addWeeks(thisWeekStart, 2);

  const groups: Record<GroupKey, DashboardItem[]> = {
    overdue: [],
    "this-week": [],
    "next-week": [],
    later: [],
    done: [],
  };

  for (const item of items) {
    if (itemIsDone(item)) {
      groups.done.push(item);
      continue;
    }
    const due = itemDueDate(item);
    if (!due) {
      groups.later.push(item);
      continue;
    }

    if (due < thisWeekStart) {
      groups.overdue.push(item);
    } else if (due >= thisWeekStart && due < nextWeekStart) {
      groups["this-week"].push(item);
    } else if (due >= nextWeekStart && due < weekAfterStart) {
      groups["next-week"].push(item);
    } else {
      groups.later.push(item);
    }
  }

  // Sort each group: priority desc (high > med > low > none), then due_date asc
  const priorityRank: Record<string, number> = { high: 0, med: 1, low: 2 };
  function itemPriority(item: DashboardItem): number {
    if (item.kind === "assignment") {
      return priorityRank[item.item.priority ?? ""] ?? 3;
    }
    return 3; // checklist items have no priority
  }

  for (const key of Object.keys(groups) as GroupKey[]) {
    groups[key].sort((a, b) => {
      const pa = itemPriority(a);
      const pb = itemPriority(b);
      if (pa !== pb) return pa - pb;
      const da = itemDueDate(a)?.getTime() ?? Infinity;
      const db = itemDueDate(b)?.getTime() ?? Infinity;
      return da - db;
    });
  }

  return ([
    { key: "overdue"   as GroupKey, label: "Overdue",    items: groups.overdue },
    { key: "this-week" as GroupKey, label: "This Week",  items: groups["this-week"] },
    { key: "next-week" as GroupKey, label: "Next Week",  items: groups["next-week"] },
    { key: "later"     as GroupKey, label: "Later",      items: groups.later },
    { key: "done"      as GroupKey, label: "Done",       items: groups.done },
  ] satisfies DashboardGroup[]).filter((g) => g.items.length > 0);
}

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = parseISO(dateStr);
  return format(d, "MMM d");
}

export function isLate(item: DashboardItem): boolean {
  if (item.kind === "assignment") {
    const a = item.item;
    if (a.status === "done" && a.completed_at) {
      return parseISO(a.completed_at) > parseISO(a.due_date);
    }
    if (a.status === "open") {
      return parseISO(a.due_date) < now();
    }
    return false;
  }
  const ci = item.item;
  if (ci.is_done && ci.completed_at && ci.due_date) {
    return parseISO(ci.completed_at) > parseISO(ci.due_date);
  }
  if (!ci.is_done && ci.due_date) {
    return parseISO(ci.due_date) < now();
  }
  return false;
}
