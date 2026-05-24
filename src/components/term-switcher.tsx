"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setActiveTerm } from "@/app/_actions/terms";
import type { Term } from "@/lib/types";

interface Props {
  terms: Term[];
  activeTermId: string;
}

export function TermSwitcher({ terms, activeTermId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeTerm = terms.find((t) => t.id === activeTermId);

  function handleSwitch(id: string) {
    if (id === activeTermId) { setOpen(false); return; }
    startTransition(async () => {
      await setActiveTerm(id);
      setOpen(false);
    });
  }

  return (
    <>
      {/* Tappable term pill in the header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-0.5 -mx-2 hover:bg-zinc-100 active:bg-zinc-100 transition-colors"
      >
        <span className="text-xs text-zinc-400">{activeTerm?.name ?? "No active term"}</span>
        <svg className="h-3 w-3 text-zinc-400 flex-none" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L2 4h8L6 8z" />
        </svg>
      </button>

      {/* Sheet backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="px-5 pb-2 pt-2">
          <h2 className="text-base font-semibold text-zinc-900">Switch semester</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Tap a semester to make it active.</p>
        </div>

        <ul className="px-3 pb-3">
          {terms.map((term) => {
            const isActive = term.id === activeTermId;
            return (
              <li key={term.id}>
                <button
                  onClick={() => handleSwitch(term.id)}
                  disabled={isPending}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                    isActive ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-800"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-zinc-900"}`}>
                      {term.name}
                    </p>
                    {(term.start_date || term.end_date) && (
                      <p className={`text-xs mt-0.5 ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>
                        {[term.start_date, term.end_date]
                          .filter(Boolean)
                          .map((d) => new Date(d!).toLocaleDateString("en-CA", { month: "short", year: "numeric" }))
                          .join(" -- ")}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <svg className="h-5 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isPending && !isActive && (
                    <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin flex-none" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-zinc-100 px-5 pb-5 pt-3">
          <Link
            href="/terms/new"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-3.5 text-sm font-semibold text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            New semester
          </Link>
        </div>
      </div>
    </>
  );
}
