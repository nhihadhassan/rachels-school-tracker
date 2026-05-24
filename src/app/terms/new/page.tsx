"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTerm } from "@/app/_actions/terms";

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export default function NewTermPage() {
  const [state, formAction, pending] = useActionState(createTerm, null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/95 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <Link href="/courses" className="text-zinc-500 hover:text-zinc-800">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">New semester</h1>
      </header>

      <div className="flex flex-col gap-6 px-5 pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-800">
              Semester name <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Fall 2026"
              className={inputCls}
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">Start date</span>
              <input name="start_date" type="date" className={inputCls} />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-800">End date</span>
              <input name="end_date" type="date" className={inputCls} />
            </label>
          </div>

          <p className="text-xs text-zinc-400 -mt-1">
            Creating a new semester will not delete this one. You can switch back any time.
          </p>

          <div className="flex gap-3 pt-2">
            <Link
              href="/courses"
              className="flex-1 rounded-xl border border-zinc-200 py-3 text-center text-sm font-medium text-zinc-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Creating..." : "Create semester"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
