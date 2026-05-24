"use client";

import { useState, useTransition, useEffect } from "react";
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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSwitch(id: string) {
    if (id === activeTermId) { setOpen(false); return; }
    startTransition(async () => {
      await setActiveTerm(id);
      setOpen(false);
    });
  }

  return (
    <>
      {/* Tappable term pill */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg -mx-1 px-1 py-0.5 hover:bg-zinc-100 active:bg-zinc-100 transition-colors"
      >
        <span className="text-xs text-zinc-400">{activeTerm?.name ?? "No active term"}</span>
        <svg className="h-3 w-3 text-zinc-400 flex-none" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L2 4h8L6 8z" />
        </svg>
      </button>

      {/* Portal-style overlay — only mounted when open */}
      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet — stop clicks from bubbling to backdrop */}
          <div
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Switch semester</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Tap a semester to make it active.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Term list */}
            <ul className="px-3 pb-3 flex flex-col gap-1">
              {terms.map((term) => {
                const isActive = term.id === activeTermId;
                return (
                  <li key={term.id}>
                    <button
                      onClick={() => handleSwitch(term.id)}
                      disabled={isPending}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                        isActive
                          ? "bg-zinc-900 text-white"
                          : "hover:bg-zinc-50 active:bg-zinc-100"
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
                              .map((d) =>
                                new Date(d!).toLocaleDateString("en-CA", {
                                  month: "short",
                                  year: "numeric",
                                })
                              )
                              .join(" – ")}
                          </p>
                        )}
                      </div>
                      {isActive && !isPending && (
                        <svg className="h-5 w-5 flex-none text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isPending && !isActive && (
                        <div className="h-4 w-4 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin flex-none" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* New semester button */}
            <div className="border-t border-zinc-100 px-5 pb-4 pt-3">
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
        </div>
      )}
    </>
  );
}
