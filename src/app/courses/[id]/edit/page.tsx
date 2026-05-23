import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCourse, deleteCourse } from "@/app/_actions/courses";
import { CourseForm } from "@/components/assignment-form";
import { DeleteCourseButton } from "./delete-button";

type Params = Promise<{ id: string }>;

export default async function EditCoursePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses").select("*").eq("id", id).maybeSingle();
  if (!course) notFound();

  const action = updateCourse.bind(null, id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <Link href={`/courses/${id}`} className="text-zinc-500 hover:text-zinc-800">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">Edit course</h1>
      </header>
      <div className="flex flex-col gap-6 px-5 pt-6">
        <CourseForm
          action={action}
          defaultValues={course}
          submitLabel="Save changes"
          cancelHref={`/courses/${id}`}
        />
        <div className="border-t border-zinc-100 pt-4">
          <DeleteCourseButton id={id} />
        </div>
      </div>
    </main>
  );
}
