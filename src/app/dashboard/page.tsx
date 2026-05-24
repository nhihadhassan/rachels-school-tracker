import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groupDashboardItems } from "@/lib/dates";
import { currentGrade } from "@/lib/grade";
import type { DashboardItem, AssignmentWithCourse, ChecklistItemWithChecklist, Assignment } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";
import { DashboardRow } from "./dashboard-row";
import { PushOptIn } from "@/components/push-opt-in";
import { getMySubscriptionEndpoint } from "@/app/_actions/push";

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

export default async function DashboardPage() {
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

  const [items, storedEndpoint, { data: coursesRaw }] = await Promise.all([
    fetchDashboardItems(term.id),
    getMySubscriptionEndpoint(),
    supabase.from("courses").select("*, assignments(*)").eq("term_id", term.id).order("code"),
  ]);

  const groups = groupDashboardItems(items);
  const openCount = items.filter((i) =>
    i.kind === "assignment" ? i.item.status === "open" : !i.item.is_done
  ).length;
  const doneCount = items.filter((i) =>
    i.kind === "assignment" ? i.item.status === "done" : i.item.is_done
  ).length;

  const courses = (coursesRaw ?? []) as Array<{ id: string; code: string; name: string; color: string | null; assignments: Assignment[] }>;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header — mobile only (desktop uses sidebar) */}
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
          <SignOutButton />
        </div>
      </header>

      {/* Desktop page header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Today&apos;s Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{term.name}</p>
        </div>
        <Link
          href="/assignments/new"
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          Add assignment
        </Link>
      </div>

      {/* Body — two columns on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:px-8 lg:pt-4 lg:pb-8 lg:items-start">

        {/* ── Left: assignment groups ── */}
        <div className="flex flex-col gap-5 px-5 pt-5 pb-32 lg:px-0 lg:pt-0 lg:pb-0">
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

          {/* Push opt-in — below content */}
          <PushOptIn storedEndpoint={storedEndpoint} />
        </div>

        {/* ── Right: stats panel (desktop only) ── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-6">
          {/* Summary counts */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">This term</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-zinc-900">{openCount}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Open</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{doneCount}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Done</p>
              </div>
            </div>
          </div>

          {/* Grades per course */}
          {courses.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Grades</p>
              <ul className="flex flex-col gap-2">
                {courses.map((course) => {
                  const grade = currentGrade(course.assignments);
                  const open = course.assignments.filter((a) => a.status === "open").length;
                  return (
                    <li key={course.id}>
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-50 transition-colors group"
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

          {/* Push opt-in on desktop too */}
          <PushOptIn storedEndpoint={storedEndpoint} />
        </aside>
      </div>

      {/* Mobile FAB */}
      <Link
        href="/assignments/new"
        className="lg:hidden fixed right-5 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg active:scale-95 transition-transform z-10"
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
