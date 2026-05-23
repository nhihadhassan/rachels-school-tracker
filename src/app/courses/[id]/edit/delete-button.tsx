"use client";

import { useTransition } from "react";
import { deleteCourse } from "@/app/_actions/courses";

export function DeleteCourseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this course and all its assignments?")) {
          startTransition(() => deleteCourse(id));
        }
      }}
      className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Delete course"}
    </button>
  );
}
