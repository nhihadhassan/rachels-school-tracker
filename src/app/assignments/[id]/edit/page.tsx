import { createClient } from "@/lib/supabase/server";
import { updateAssignment } from "@/app/_actions/assignments";
import { AssignmentForm } from "@/components/assignment-form";
import { DeleteAssignmentButton } from "./delete-button";
import { SubtaskList } from "./subtasks";
import { AttachmentList } from "./attachments";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Assignment, Attachment, Course, Subtask } from "@/lib/types";

type Params = Promise<{ id: string }>;

export default async function EditAssignmentPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, course:courses(id, term_id, code, name, color)")
    .eq("id", id)
    .maybeSingle();

  if (!assignment) notFound();

  const { data: term } = await supabase
    .from("terms").select("id").eq("is_active", true).limit(1).maybeSingle();

  const { data: courses } = term
    ? await supabase.from("courses").select("*").eq("term_id", term.id).order("code")
    : { data: [] };

  const { data: subtasksRaw } = await supabase
    .from("subtasks")
    .select("*")
    .eq("assignment_id", id)
    .order("sort_order", { ascending: true });

  const subtasks = (subtasksRaw ?? []) as Subtask[];

  const { data: attachmentsRaw } = await supabase
    .from("attachments")
    .select("*")
    .eq("assignment_id", id)
    .order("created_at", { ascending: true });

  const attachments = (attachmentsRaw ?? []) as Attachment[];

  const action = updateAssignment.bind(null, id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-800">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">Edit assignment</h1>
      </header>
      <div className="flex flex-col gap-6 px-5 pt-6">
        <AssignmentForm
          action={action}
          courses={(courses ?? []) as Course[]}
          defaultValues={assignment as Assignment & { course_id: string }}
          submitLabel="Save changes"
        />
        {/* Subtasks */}
        <SubtaskList assignmentId={id} initialSubtasks={subtasks} />

        {/* Attachments */}
        <AttachmentList assignmentId={id} initialAttachments={attachments} />

        <div className="border-t border-zinc-100 pt-4">
          <DeleteAssignmentButton id={id} />
        </div>
      </div>
    </main>
  );
}
