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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 px-5 pt-4 pb-4 backdrop-blur border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="text-zinc-500 hover:text-zinc-800">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">{course.code}</p>
            <h1 className="text-sm font-semibold leading-snug text-zinc-900 line-clamp-2">{course.name}</h1>
          </div>
          <Link
            href={`/courses/${id}/edit`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600"
          >
            Edit
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-4">
        {/* Grade section with toggle */}
        <GradeSection assignments={assignments} color={course.color} />

        {/* What score do I need? */}
        <NeedCalculator assignments={assignments} />

        {/* Add assignment shortcut */}
        <Link
          href={`/assignments/new?courseId=${id}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
          </svg>
          Add assignment
        </Link>

        {open.length > 0 && <AssignmentSection title="Open" assignments={open} courseId={id} />}
        {done.length > 0 && <AssignmentSection title="Done" assignments={done} courseId={id} faded />}
        {skipped.length > 0 && <AssignmentSection title="Skipped" assignments={skipped} courseId={id} faded />}
        {assignments.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-400">No assignments yet.</p>
        )}
      </div>
    </main>
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
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      <ul className="flex flex-col gap-1.5">
        {assignments.map((a) => (
          <Link
            key={a.id}
            href={`/assignments/${a.id}/edit`}
            className={`flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-100 hover:ring-zinc-200 ${faded ? "opacity-60" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium text-zinc-900 leading-snug ${faded ? "line-through" : ""}`}>
                {a.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Due {formatDueDate(a.due_date)}
                {a.weight != null ? ` · ${a.weight}%` : ""}
              </p>
            </div>
            <div className="flex-none text-right">
              {a.mark_received != null ? (
                <span className="text-sm font-semibold text-zinc-800">{a.mark_received}%</span>
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
