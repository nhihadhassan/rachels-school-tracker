import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, format,
} from "date-fns";
import type { AssignmentWithCourse, ChecklistItemWithChecklist } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ month?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const { month } = await searchParams;

  // Parse ?month=YYYY-MM, default to current month
  const base = month ? new Date(`${month}-01T12:00:00`) : new Date();
  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);

  // Calendar grid: pad to full weeks
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start (most intuitive for students)
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, course:courses(id, term_id, code, name, color)")
    .gte("due_date", monthStart.toISOString())
    .lte("due_date", monthEnd.toISOString())
    .neq("status", "skipped")
    .order("due_date", { ascending: true });

  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("*, checklist:checklists(id, term_id, name, notes)")
    .gte("due_date", monthStart.toISOString())
    .lte("due_date", monthEnd.toISOString())
    .eq("is_done", false)
    .order("due_date", { ascending: true });

  const allAssignments = (assignments ?? []) as AssignmentWithCourse[];
  const allChecklistItems = (checklistItems ?? []) as ChecklistItemWithChecklist[];

  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");
  const todayMonth = format(new Date(), "yyyy-MM");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-zinc-900">
            {format(monthStart, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-2">
            {month !== todayMonth && (
              <Link
                href={`/calendar?month=${todayMonth}`}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600"
              >
                Today
              </Link>
            )}
            <Link
              href={`/calendar?month=${prevMonth}`}
              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href={`/calendar?month=${nextMonth}`}
              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="mt-3 grid grid-cols-7 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d} className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{d}</span>
          ))}
        </div>
      </header>

      {/* Grid */}
      <div className="px-2 pt-2">
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayAssignments = allAssignments.filter((a) =>
              isSameDay(new Date(a.due_date), day),
            );
            const dayChecklist = allChecklistItems.filter((ci) =>
              ci.due_date && isSameDay(new Date(ci.due_date), day),
            );
            const total = dayAssignments.length + dayChecklist.length;
            const inMonth = isSameMonth(day, monthStart);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 border-b border-r border-zinc-100 ${!inMonth ? "bg-zinc-50/50" : "bg-white"}`}
              >
                {/* Day number */}
                <div className="flex items-center justify-center mb-1">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                      ${today ? "bg-zinc-900 text-white" : inMonth ? "text-zinc-700" : "text-zinc-300"}`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Dots / items */}
                <div className="flex flex-col gap-0.5">
                  {dayAssignments.slice(0, 3).map((a) => (
                    <Link
                      key={a.id}
                      href={`/assignments/${a.id}/edit`}
                      className="block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
                      style={{
                        backgroundColor: a.course?.color ? `${a.course.color}22` : "#f4f4f5",
                        color: a.course?.color ?? "#52525b",
                      }}
                    >
                      {a.title}
                    </Link>
                  ))}
                  {dayChecklist.slice(0, total <= 3 ? 3 : 2).map((ci) => (
                    <span
                      key={ci.id}
                      className="block truncate rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium leading-tight text-amber-700"
                    >
                      {ci.title}
                    </span>
                  ))}
                  {total > 3 && (
                    <span className="px-1 text-[10px] text-zinc-400">+{total - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs text-zinc-400">
          Tap an item to edit. Amber = practicum. Skipped items hidden.
        </p>
      </div>
    </main>
  );
}
