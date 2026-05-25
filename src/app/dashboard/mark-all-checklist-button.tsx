"use client";

import { useTransition } from "react";
import { markAllItemsDone } from "@/app/_actions/checklists";

interface Props {
  checklists: Array<{ id: string; name: string }>;
}

export function MarkAllChecklistButtons({ checklists }: Props) {
  const [pending, startTransition] = useTransition();

  if (checklists.length === 0) return null;

  return (
    <>
      {checklists.map((cl) => (
        <button
          key={cl.id}
          onClick={() => startTransition(() => markAllItemsDone(cl.id))}
          disabled={pending}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors border border-zinc-100 w-full text-left"
        >
          <svg className="h-4 w-4 text-zinc-400 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          {pending ? "Marking done..." : `Mark all ${cl.name} done`}
        </button>
      ))}
    </>
  );
}
