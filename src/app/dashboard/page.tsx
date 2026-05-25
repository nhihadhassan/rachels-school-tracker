import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groupDashboardItems } from "@/lib/dates";
import { currentGrade } from "@/lib/grade";
import type { DashboardItem, AssignmentWithCourse, ChecklistItemWithChecklist, Assignment } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";
import { DashboardRow } from "./dashboard-row";
import { MiniCalendar } from "./mini-calendar";
import { MarkOverdueButton } from "./mark-all-checklist-button";
import { PushOptIn } from "@/components/push-opt-in";
import { GCalConnect } from "@/components/gcal-connect";
import { getMySubscriptionEndpoint } from "@/app/_actions/push";
import { getGCalStatus } from "@/app/_actions/google-calendar";

export const dynamic = "force-dynamic";

async function fetchDashboardItems(termId: string): Promise<DashboardItem[]> {
  const supabase = await createClient();
  const [{ data: assignments }, { data: checklistItems }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, course:courses!inner(id, term_id, code, name, color)")
      .eq("course.term_id", termId)
      .order("due_date", { ascending: true }),
    supabase
      .from("checklist_items")
      .select("*, checklist:checklists!inner(id, term_id, name, notes)")
      .eq("checklist.term_id", termId)
      .order("due_date", { ascending: true }),
  ]);
  return [
    ...(assignments ?? []).map((a) => ({ kind: "assignment" as const, item: a as AssignmentWithCourse })),
    ...(checklistItems ?? []).map((ci) => ({ kind: "checklist_item" as const, item: ci as ChecklistItemWithChecklist })),
  ];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string }>;
}) {
  const { gcal } = await searchParams;
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms").select("*").eq("is_active", true).limit(1).maybeSingle();

  if (!term) {
    return (
      <main className="mx-auto max-w-md px-5 py-8">
        <p className="text-sm text-zinc-500">No active term. Add one in Courses.</p>
      </main>
    );
  }

  const [items, storedEndpoint, gcalConnected, { data: coursesRaw }] = await Promise.all([
    fetchDashboardItems(term.id),
    getMySubscriptionEndpoint(),
    getGCalStatus(),
    supabase.from("courses").select("*, assignments(*)").eq("term_id", term.id).order("code"),
  ]);

  const groups = groupDashboardItems(items);
  const openCount = items.filter((i) =>
    i.kind === "assignment" ? i.item.status === "open" : !i.item.is_done
  ).length;
  const doneCount = items.filter((i) =>
    i.kind === "assignment" ? i.item.status === "done" : i.item.is_done
  ).length;

  const thisWeekItems = groups.find((g) => g.key === "this-week")?.items ?? [];
  const overdueCount = groups.find((g) => g.key === "overdue")?.items.length ?? 0;
  const nextDueItem = thisWeekItems[0] ?? null;
  const extraThisWeek = Math.max(0, thisWeekItems.length - 1);

  const courses = (coursesRaw ?? []) as Array<{ id: string; code: string; name: string; color: string | null; assignments: Assignment[] }>;

  // Compute average grade across all courses that have a grade
  const gradesWithValues = courses
    .map((c) => currentGrade(c.assignments))
    .filter((g): g is number => g != null);
  const avgGrade = gradesWithValues.length
    ? gradesWithValues.reduce((a, b) => a + b, 0) / gradesWithValues.length
    : null;

  // Format time estimate for display
  function fmtTime(mins: number) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header — mobile only */}
      <header className="lg:hidden sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <div>
          <h1 className="text-base font-semibold leading-tight">Rachel&apos;s Tracker</h1>
          <p className="text-xs text-zinc-400">{term.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
              {openCount} open
            </span>
          )}
        </div>
      </header>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block px-8 pt-8 pb-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Welcome back, Rachel!</h1>
            <p className="text-sm text-slate-500 mt-1">Here&apos;s your assignment overview for {term.name}.</p>
          </div>
          <Link
            href="/assignments/new"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add assignment
          </Link>
        </div>

        {/* GCal connection feedback */}
        {gcal === "connected" && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-3">
            <svg className="h-4 w-4 text-emerald-600 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <p className="text-sm text-emerald-700 font-medium">Google Calendar connected! New assignments will sync automatically.</p>
          </div>
        )}
        {gcal === "error" && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-5 py-3">
            <svg className="h-4 w-4 text-red-500 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-red-700 font-medium">Could not connect Google Calendar. Please try again.</p>
          </div>
        )}

        {/* Top cards row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Up Next spotlight — spans 3 cols */}
          <div className="col-span-3 rounded-xl bg-white border border-zinc-100 shadow-sm p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Up Next This Week</p>
            {nextDueItem ? (() => {
              if (nextDueItem.kind === "assignment") {
                const a = nextDueItem.item;
                const accentColor = a.course?.color ?? "#94a3b8";
                const dueStr = new Date(a.due_date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div className="flex gap-4">
                    <div className="w-1 rounded-full flex-none" style={{ backgroundColor: accentColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>{a.course?.code}</span>
                        <span className="text-zinc-200">·</span>
                        <span className="text-xs text-zinc-500">Due {dueStr}</span>
                        {extraThisWeek > 0 && (
                          <span className="ml-auto text-xs text-zinc-400">+{extraThisWeek} more this week</span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-zinc-900 mb-2 leading-tight">{a.title}</p>
                      {/* Prep chips */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {a.weight != null && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                            Worth {a.weight}%
                          </span>
                        )}
                        {a.time_estimate_minutes != null && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Est. {fmtTime(a.time_estimate_minutes)}
                          </span>
                        )}
                        {a.priority === "high" && (
                          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                            High priority
                          </span>
                        )}
                        {a.priority === "med" && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                            Medium priority
                          </span>
                        )}
                      </div>
                      {a.notes ? (
                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                          <span className="font-medium text-zinc-600">Prep note: </span>{a.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-400 italic">
                          {a.weight != null && a.weight >= 25
                            ? "High-weight item — review materials thoroughly before the due date."
                            : "No prep notes yet — add notes on this assignment for guidance."}
                        </p>
                      )}
                    </div>
                  </div>
                );
              } else {
                const ci = nextDueItem.item;
                const dueStr = ci.due_date
                  ? new Date(ci.due_date).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
                  : null;
                return (
                  <div className="flex gap-4">
                    <div className="w-1 rounded-full flex-none bg-amber-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-amber-500">Practicum</span>
                        {dueStr && <><span className="text-zinc-200">·</span><span className="text-xs text-zinc-500">Due {dueStr}</span></>}
                        {extraThisWeek > 0 && (
                          <span className="ml-auto text-xs text-zinc-400">+{extraThisWeek} more this week</span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-zinc-900 mb-2 leading-tight">{ci.title}</p>
                      <p className="text-sm text-zinc-400 italic">Complete and submit via your practicum portal.</p>
                    </div>
                  </div>
                );
              }
            })() : (
              <div className="flex items-center gap-4 py-1">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="font-semibold text-zinc-700">Nothing due this week!</p>
                  <p className="text-sm text-zinc-400 mt-0.5">Great time to get ahead on upcoming work.</p>
                </div>
              </div>
            )}
          </div>

          {/* Avg Grade */}
          <div className="rounded-xl bg-white border border-zinc-100 p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs text-zinc-500">Avg Grade</p>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-none">
                <svg className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-900 mt-2">
              {avgGrade != null ? `${avgGrade.toFixed(1)}%` : "--"}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {gradesWithValues.length > 0 ? `Across ${gradesWithValues.length} course${gradesWithValues.length > 1 ? "s" : ""}` : "No marks yet"}
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
          {/* Left: assignment groups */}
          <div className="flex flex-col gap-5">
            {/* Overdue callout */}
            {overdueCount > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-3.5 flex items-center gap-3">
                <svg className="h-5 w-5 text-red-500 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm font-medium text-red-700 flex-1">
                  {overdueCount} overdue {overdueCount === 1 ? "item" : "items"} — take care of these first.
                </p>
                <MarkOverdueButton termId={term.id} />
              </div>
            )}

            {groups.length === 0 ? (
              <div className="rounded-xl bg-white border border-zinc-100 shadow-sm flex flex-col items-center gap-3 py-20 text-center">
                <span className="text-5xl">🎉</span>
                <p className="text-lg font-semibold text-zinc-700">All caught up!</p>
                <p className="text-sm text-zinc-400">No open assignments right now.</p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.key}>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {group.label}
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-500 font-medium normal-case tracking-normal">
                      {group.items.length}
                    </span>
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {group.items.map((item) => (
                      <DashboardRow
                        key={item.kind === "assignment" ? `a-${item.item.id}` : `ci-${item.item.id}`}
                        item={item}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>

          {/* Right: sidebar panels */}
          <div className="flex flex-col gap-4 sticky top-6">
            {/* Quick Actions */}
            <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <h2 className="text-sm font-semibold text-zinc-800">Quick Actions</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/assignments/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border border-zinc-100"
                >
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add assignment
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border border-zinc-100"
                >
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  View courses
                </Link>
                <Link
                  href="/calendar"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border border-zinc-100"
                >
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Open calendar
                </Link>
              </div>
            </div>

            {/* Mini calendar */}
            <MiniCalendar items={items} />

            {/* Grades per course */}
            {courses.length > 0 && (
              <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <h2 className="text-sm font-semibold text-zinc-800">Grades</h2>
                </div>
                <ul className="flex flex-col gap-1">
                  {courses.map((course) => {
                    const grade = currentGrade(course.assignments);
                    const open = course.assignments.filter((a) => a.status === "open").length;
                    return (
                      <li key={course.id}>
                        <Link
                          href={`/courses/${course.id}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50 transition-colors group"
                        >
                          <span
                            className="h-2.5 w-2.5 flex-none rounded-full"
                            style={{ backgroundColor: course.color ?? "#94a3b8" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 truncate">{course.code}</p>
                            {open > 0 && (
                              <p className="text-xs text-zinc-400">{open} open</p>
                            )}
                          </div>
                          {grade != null ? (
                            <span className={`text-sm font-bold tabular-nums ${
                              grade >= 80 ? "text-emerald-600" : grade >= 70 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {grade.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-300">--</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Push opt-in */}
            <PushOptIn storedEndpoint={storedEndpoint} />

            {/* Google Calendar connect */}
            <GCalConnect connected={gcalConnected} />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col gap-5 px-5 pt-5 pb-32">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-5xl">🎉</span>
            <p className="text-lg font-semibold text-zinc-700">All caught up!</p>
            <p className="text-sm text-zinc-400">No open assignments right now.</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {group.label}
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-500 font-medium normal-case tracking-normal">
                  {group.items.length}
                </span>
              </h2>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <DashboardRow
                    key={item.kind === "assignment" ? `a-${item.item.id}` : `ci-${item.item.id}`}
                    item={item}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
        <PushOptIn storedEndpoint={storedEndpoint} />
      </div>

      {/* Mobile FAB */}
      <Link
        href="/assignments/new"
        className="lg:hidden fixed right-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg active:scale-95 transition-transform z-10"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        aria-label="Add assignment"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
