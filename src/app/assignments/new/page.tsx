import { createClient } from "@/lib/supabase/server";
import { createAssignment } from "@/app/_actions/assignments";
import { AssignmentForm } from "@/components/assignment-form";
import Link from "next/link";
import type { Course } from "@/lib/types";

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms").select("id").eq("is_active", true).limit(1).maybeSingle();

  const { data: courses } = term
    ? await supabase.from("courses").select("*").eq("term_id", term.id).order("code")
    : { data: [] };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-800">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">New assignment</h1>
      </header>
      <div className="px-5 pt-6">
        <AssignmentForm
          action={createAssignment}
          courses={(courses ?? []) as Course[]}
          defaultValues={{ course_id: courseId }}
          submitLabel="Add assignment"
        />
      </div>
    </main>
  );
}
