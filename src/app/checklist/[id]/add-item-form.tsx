"use client";

import { useActionState, useRef, useEffect } from "react";
import { createChecklistItem } from "@/app/_actions/checklists";

export function AddItemForm({ checklistId }: { checklistId: string }) {
  const action = createChecklistItem.bind(null, checklistId);
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Add item</p>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <input
        name="title"
        type="text"
        required
        placeholder="Item title"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
      />
      <input
        name="due_date"
        type="date"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
