"use client";

import Link from "next/link";
import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isToday, format, isSameMonth,
  addMonths, subMonths,
} from "date-fns";
import type { DashboardItem } from "@/lib/types";

interface Props {
  items: DashboardItem[];
}

export function MiniCalendar({ items }: Props) {
  const [offset, setOffset] = useState(0); // 0 = current month, -1 = prev, +1 = next
  const base = new Date();
  const viewing = offset === 0 ? base : offset > 0 ? addMonths(base, offset) : subMonths(base, -offset);

  const monthStart = startOfMonth(viewing);
  const monthEnd = endOfMonth(viewing);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const monthSlug = format(viewing, "yyyy-MM");

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
        : "#f59e0b";
    if (!dayColors[key]) dayColors[key] = [];
    if (!dayColors[key].includes(color)) dayColors[key].push(color);
  }

  return (
    <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-zinc-400 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Previous month"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-zinc-800 w-28 text-center">{format(viewing, "MMMM yyyy")}</h2>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Next month"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
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
          const inMonth = isSameMonth(day, viewing);
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
