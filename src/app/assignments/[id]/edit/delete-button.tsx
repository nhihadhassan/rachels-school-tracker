"use client";

import { useTransition } from "react";
import { deleteAssignment } from "@/app/_actions/assignments";

export function DeleteAssignmentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this assignment?")) {
          startTransition(() => deleteAssignment(id));
        }
      }}
      className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Delete assignment"}
    </button>
  );
}
