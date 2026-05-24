"use client";

import { useState } from "react";
import { scoreNeededToHit } from "@/lib/grade";
import type { Assignment } from "@/lib/types";

export function NeedCalculator({ assignments }: { assignments: Assignment[] }) {
  const [target, setTarget] = useState(75);

  // Only render when there are ungraded weighted assignments left
  const hasRemaining = assignments.some(
    (a) => a.weight != null && a.mark_received == null && a.status !== "skipped",
  );
  if (!hasRemaining) return null;

  const needed = scoreNeededToHit(assignments, target);
  const impossible = needed !== null && needed > 100;

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
        What do I need?
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-zinc-500">To get</span>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-16 rounded-xl border border-zinc-200 px-2 py-1.5 text-center text-sm font-semibold focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <span className="text-sm text-zinc-500">% overall</span>
      </div>
      {impossible ? (
        <p className="text-sm font-semibold text-red-500">
          Not achievable -- you would need {needed!.toFixed(1)}% on remaining work.
        </p>
      ) : needed !== null ? (
        <p className="text-sm text-zinc-600">
          You need{" "}
          <span className={`text-xl font-bold ${needed >= 90 ? "text-red-600" : needed >= 80 ? "text-amber-600" : "text-emerald-600"}`}>
            {needed.toFixed(1)}%
          </span>{" "}
          on remaining weighted assignments.
        </p>
      ) : null}
    </div>
  );
}
