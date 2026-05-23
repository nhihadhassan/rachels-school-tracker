import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentGrade } from "@/lib/grade";
import type { Assignment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: courses } = term
    ? await supabase
        .from("courses")
        .select("*, assignments(*)")
        .eq("term_id", term.id)
        .order("code")
    : { data: [] };

  // Get practicum checklists
  const { data: checklists } = term
    ? await supabase
        .from("checklists")
        .select("*, checklist_items(*)")
        .eq("term_id", term.id)
    : { data: [] };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-800">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="flex-1 text-base font-semibold">{term?.name ?? "Courses"}</h1>
        <Link
          href="/courses/new"
          className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/></svg>
          Course
        </Link>
      </header>

      <div className="flex flex-col gap-2 px-5 pt-4">
        {(courses ?? []).map((course) => {
          const assignments = (course.assignments ?? []) as Assignment[];
          const grade = currentGrade(assignments);
          const done = assignments.filter((a) => a.status === "done").length;
          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="flex items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-100 hover:ring-zinc-200 active:bg-zinc-50"
            >
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white text-xs font-bold"
                style={{ backgroundColor: course.color ?? "#94a3b8" }}
              >
                {course.code.split(" ")[1]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 leading-snug">{course.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {course.code} · {done}/{assignments.length} done
                </p>
              </div>
              <div className="flex-none text-right">
                {grade != null ? (
                  <span className="text-sm font-semibold text-zinc-800">{grade.toFixed(1)}%</span>
                ) : (
                  <span className="text-xs text-zinc-400">No marks</span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Practicum checklists */}
        {(checklists ?? []).map((checklist) => {
          const items = checklist.checklist_items ?? [];
          const done = items.filter((i: { is_done: boolean }) => i.is_done).length;
          return (
            <Link
              key={checklist.id}
              href={`/checklist/${checklist.id}`}
              className="flex items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-100 hover:ring-zinc-200 active:bg-zinc-50"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-200 text-slate-600 text-xs font-bold">
                PR
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 leading-snug">{checklist.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Checklist · {done}/{items.length} done
                </p>
              </div>
              <svg className="h-4 w-4 flex-none text-zinc-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
