import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentGrade } from "@/lib/grade";
import { TermSwitcher } from "@/components/term-switcher";
import type { Assignment, Term } from "@/lib/types";

export const dynamic = "force-dynamic";

function gradeColor(grade: number): string {
  if (grade >= 80) return "text-emerald-600 bg-emerald-50";
  if (grade >= 70) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default async function CoursesPage() {
  const supabase = await createClient();

  const [{ data: term }, { data: allTerms }] = await Promise.all([
    supabase.from("terms").select("*").eq("is_active", true).limit(1).maybeSingle(),
    supabase.from("terms").select("*").order("created_at", { ascending: false }),
  ]);

  const { data: courses } = term
    ? await supabase
        .from("courses")
        .select("*, assignments(*)")
        .eq("term_id", term.id)
        .order("code")
    : { data: [] };

  const { data: checklists } = term
    ? await supabase
        .from("checklists")
        .select("*, checklist_items(*)")
        .eq("term_id", term.id)
    : { data: [] };

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 lg:pb-12">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 py-4 backdrop-blur border-b border-zinc-100 lg:px-8 lg:py-5">
        <div>
          <h1 className="text-base font-semibold lg:text-2xl lg:font-bold">Courses</h1>
          {term && (
            <TermSwitcher
              terms={(allTerms ?? []) as Term[]}
              activeTermId={term.id}
            />
          )}
        </div>
        <Link
          href="/courses/new"
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          Add course
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-2 px-5 pt-5 lg:grid-cols-2 lg:px-8 lg:gap-3 lg:pt-6">
        {(courses ?? []).length === 0 && (checklists ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-400">No courses yet. Tap Add course to get started.</p>
        )}

        {(courses ?? []).map((course) => {
          const assignments = (course.assignments ?? []) as Assignment[];
          const grade = currentGrade(assignments);
          const open = assignments.filter((a) => a.status === "open").length;
          const total = assignments.length;

          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-100 active:bg-zinc-50 transition-colors"
            >
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white text-xs font-bold tracking-tight shadow-sm"
                style={{ backgroundColor: course.color ?? "#94a3b8" }}
              >
                {course.code.split(" ")[1] ?? course.code.slice(0, 3)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{course.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {course.code}
                  {open > 0 ? ` · ${open} open` : total > 0 ? " · all done" : " · no assignments"}
                </p>
              </div>
              {grade != null ? (
                <span className={`flex-none rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums ${gradeColor(grade)}`}>
                  {grade.toFixed(1)}%
                </span>
              ) : (
                <span className="flex-none text-xs text-zinc-300">No marks</span>
              )}
            </Link>
          );
        })}

        {(checklists ?? []).map((checklist) => {
          const items = checklist.checklist_items ?? [];
          const done = items.filter((i: { is_done: boolean }) => i.is_done).length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;

          return (
            <Link
              key={checklist.id}
              href={`/checklist/${checklist.id}`}
              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-100 active:bg-zinc-50 transition-colors"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
                PR
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{checklist.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Practicum checklist · {done}/{items.length} done
                </p>
              </div>
              <span className={`flex-none rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums ${
                pct === 100 ? "text-emerald-600 bg-emerald-50" : "text-zinc-600 bg-zinc-100"
              }`}>
                {pct}%
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
