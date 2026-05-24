import Link from "next/link";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, format, isSameMonth,
} from "date-fns";
import type { DashboardItem } from "@/lib/types";

interface Props {
  items: DashboardItem[];
}

export function MiniCalendar({ items }: Props) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const monthSlug = format(today, "yyyy-MM");

  // Build a map: date string -> array of colors for that day
  const dayColors: Record<string, string[]> = {};
  for (const item of items) {
    const raw = item.kind === "assignment" ? item.item.due_date : item.item.due_date;
    if (!raw) continue;
    const d = new Date(raw);
    const key = format(d, "yyyy-MM-dd");
    const color =
      item.kind === "assignment"
        ? (item.item.course?.color ?? "#94a3b8")
        : "#f59e0b"; // amber for practicum
    if (!dayColors[key]) dayColors[key] = [];
    if (!dayColors[key].includes(color)) dayColors[key].push(color);
  }

  return (
    <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <h2 className="text-sm font-semibold text-zinc-800">{format(today, "MMMM yyyy")}</h2>
        </div>
        <Link
          href={`/calendar?month=${monthSlug}`}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Full view
        </Link>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const colors = dayColors[key] ?? [];
          const inMonth = isSameMonth(day, today);
          const isT = isToday(day);
          const daySlug = format(day, "yyyy-MM");

          return (
            <Link
              key={key}
              href={`/calendar?month=${daySlug}`}
              className="flex flex-col items-center gap-0.5 py-0.5 rounded-lg hover:bg-zinc-50 transition-colors group"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors
                  ${isT
                    ? "bg-slate-900 text-white"
                    : inMonth
                      ? "text-zinc-700 group-hover:bg-zinc-100"
                      : "text-zinc-300"
                  }`}
              >
                {format(day, "d")}
              </span>
              {/* Colored dots */}
              {colors.length > 0 && (
                <div className="flex gap-0.5 h-1.5">
                  {colors.slice(0, 3).map((color, i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full flex-none"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
