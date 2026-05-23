"use client";

import { useOptimistic, useTransition, useActionState, useRef } from "react";
import { toggleSubtask, createSubtask, deleteSubtask } from "@/app/_actions/subtasks";
import type { Subtask } from "@/lib/types";

interface Props {
  assignmentId: string;
  initialSubtasks: Subtask[];
}

export function SubtaskList({ assignmentId, initialSubtasks }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(
    initialSubtasks,
    (state: Subtask[], update: { type: "toggle"; id: string; isDone: boolean } | { type: "delete"; id: string }) => {
      if (update.type === "toggle") {
        return state.map((s) => s.id === update.id ? { ...s, is_done: update.isDone } : s);
      }
      return state.filter((s) => s.id !== update.id);
    },
  );

  function handleToggle(id: string, isDone: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id, isDone });
      await toggleSubtask(id, isDone, assignmentId);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "delete", id });
      await deleteSubtask(id, assignmentId);
    });
  }

  const done = optimistic.filter((s) => s.is_done).length;

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-800">Subtasks</p>
        {optimistic.length > 0 && (
          <span className="text-xs text-zinc-400">{done}/{optimistic.length}</span>
        )}
      </div>

      {/* List */}
      {optimistic.length > 0 ? (
        <ul className="divide-y divide-zinc-50">
          {optimistic.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 group">
              <button
                onClick={() => handleToggle(s.id, !s.is_done)}
                disabled={isPending}
                className="flex-none h-5 w-5 rounded-full border-2 border-zinc-300 flex items-center justify-center transition-colors data-[done=true]:border-emerald-500 data-[done=true]:bg-emerald-500"
                data-done={s.is_done}
                aria-label={s.is_done ? "Mark incomplete" : "Mark complete"}
              >
                {s.is_done && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm text-zinc-800 ${s.is_done ? "line-through text-zinc-400" : ""}`}>
                {s.title}
              </span>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                className="flex-none opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-300 hover:text-red-400 transition-opacity"
                aria-label="Delete subtask"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-zinc-400">No subtasks yet.</p>
      )}

      {/* Add form */}
      <AddSubtaskForm assignmentId={assignmentId} />
    </div>
  );
}

function AddSubtaskForm({ assignmentId }: { assignmentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = createSubtask.bind(null, assignmentId);
  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await boundAction(prev, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    null,
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-center gap-2 border-t border-zinc-100 px-4 py-3"
    >
      <input
        name="title"
        type="text"
        placeholder="Add a subtask..."
        className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 bg-transparent outline-none"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="flex-none rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {pending ? "..." : "Add"}
      </button>
    </form>
  );
}
