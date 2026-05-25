"use client";

import { useTransition } from "react";
import { markAllItemsDone } from "@/app/_actions/checklists";

export function MarkAllButton({ checklistId, allDone }: { checklistId: string; allDone: boolean }) {
  const [pending, startTransition] = useTransition();

  if (allDone) return null;

  return (
    <button
      onClick={() => startTransition(() => markAllItemsDone(checklistId))}
      disabled={pending}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 disabled:opacity-50 transition-colors"
    >
      {pending ? "Marking..." : "Mark all done"}
    </button>
  );
}
