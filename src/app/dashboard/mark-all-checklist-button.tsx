"use client";

import { useTransition } from "react";
import { markOverdueDone } from "@/app/_actions/assignments";

interface Props {
  termId: string;
}

export function MarkOverdueButton({ termId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => markOverdueDone(termId))}
      disabled={pending}
      className="ml-auto flex-none rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
    >
      {pending ? "Marking..." : "Mark all done"}
    </button>
  );
}
