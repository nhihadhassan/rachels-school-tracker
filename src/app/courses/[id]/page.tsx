import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDueDate } from "@/lib/dates";
import { GradeSection } from "./grade-toggle";
import { NeedCalculator } from "./need-calculator";
import type { Assignment } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*, term:terms(id, name, is_active)")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { data: assignmentsRaw } = await supabase
    .from("assignments")
    .select("*")
    .eq("course_id", id)
    .order("due_date", { ascending: true });

  const assignments = (assignmentsRaw ?? []) as Assignment[];
  const open = assignments.filter((a) => a.status === "open");
  const done = assignments.filter((a) => a.status === "done");
  const skipped = assignments.filter((a) => a.status === "skipped");

  return (
    <div className="min-h-screen bg-zinc-50 pb-28 lg:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="flex items-center gap-3 px-5 py-4 lg:px-8 lg:py-5">
          <Link href="/courses" className="text-zinc-400 hover:text-zinc-800 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          {/* Course color dot on desktop */}
          <span
            className="hidden lg:flex h-4 w-4 flex-none rounded-full"
            style={{ backgroundColor: course.color ?? "#94a3b8" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-400">{course.code}</p>
            <h1 className="text-sm font-semibold leading-snug text-zinc-900 line-clamp-1 lg:text-lg lg:font-bold">{course.name}</h1>
          </div>
          <Link
            href={`/courses/${id}/edit`}
            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Edit
          </Link>
        </div>
      </header>

      {/* Two-column layout on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-8 lg:pt-6 lg:items-start">

        {/* ── Left: assignment list ── */}
        <div className="flex flex-col gap-5 px-5 pt-5 lg:px-0 lg:pt-0">
          {open.length > 0 && <AssignmentSection title="Open" assignments={open} courseId={id} />}
          {done.length > 0 && <AssignmentSection title="Done" assignments={done} courseId={id} faded />}
          {skipped.length > 0 && <AssignmentSection title="Skipped" assignments={skipped} courseId={id} faded />}
          {assignments.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm text-zinc-400">No assignments yet.</p>
            </div>
          )}
        </div>

        {/* ── Right: grade panel (sticky on desktop, inline on mobile) ── */}
        <div className="flex flex-col gap-4 px-5 pt-0 pb-0 lg:px-0 lg:sticky lg:top-[73px]">
          {/* Grade section — on mobile shown inside the left column above, on desktop shown here */}
          <div className="order-first lg:order-none">
            {/* Mobile: shown above the left column */}
            <div className="lg:hidden flex flex-col gap-4 pt-5">
              <GradeSection assignments={assignments} color={course.color} />
              <NeedCalculator assignments={assignments} />
              <Link
                href={`/assignments/new?courseId=${id}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                </svg>
                Add assignment
              </Link>
            </div>

            {/* Desktop: right column */}
            <div className="hidden lg:flex flex-col gap-4">
              <GradeSection assignments={assignments} color={course.color} />
              <NeedCalculator assignments={assignments} />
              <Link
                href={`/assignments/new?courseId=${id}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                </svg>
                Add assignment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentSection({
  title, assignments, courseId, faded,
}: {
  title: string;
  assignments: Assignment[];
  courseId: string;
  faded?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
      <ul className="flex flex-col gap-1.5">
        {assignments.map((a) => (
          <Link
            key={a.id}
            href={`/assignments/${a.id}/edit`}
            className={`flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-zinc-100 hover:ring-zinc-200 active:bg-zinc-50 transition-colors ${faded ? "opacity-50" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium text-zinc-900 leading-snug ${faded ? "line-through" : ""}`}>
                {a.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Due {formatDueDate(a.due_date)}
                {a.weight != null ? ` · ${a.weight}%` : ""}
                {a.priority ? ` · ${a.priority}` : ""}
                {a.time_estimate_minutes ? ` · ~${a.time_estimate_minutes}m` : ""}
              </p>
            </div>
            <div className="flex-none text-right">
              {a.mark_received != null ? (
                <span className={`text-sm font-bold tabular-nums ${
                  a.mark_received >= 80 ? "text-emerald-600" : a.mark_received >= 70 ? "text-amber-600" : "text-red-600"
                }`}>{a.mark_received}%</span>
              ) : a.weight != null ? (
                <span className="text-xs text-zinc-300">--</span>
              ) : null}
            </div>
          </Link>
        ))}
      </ul>
    </section>
  );
}
