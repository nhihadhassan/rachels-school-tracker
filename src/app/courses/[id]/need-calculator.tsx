"use client";

import { useState } from "react";
import { scoreNeededToHit } from "@/lib/grade";
import type { Assignment } from "@/lib/types";

export function NeedCalculator({ assignments }: { assignments: Assignment[] }) {
  const [target, setTarget] = useState(75);

  const needed = scoreNeededToHit(assignments, target);
  const impossible = needed !== null && needed > 100;
  const alreadyDone = needed === null;

  return (
    <div className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        What do I need?
      </p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-zinc-600">To get</span>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-center text-sm font-semibold"
        />
        <span className="text-sm text-zinc-600">% overall</span>
      </div>
      {alreadyDone ? (
        <p className="text-sm text-zinc-500">All weighted work is marked -- check the current grade above.</p>
      ) : impossible ? (
        <p className="text-sm font-semibold text-red-600">
          Not achievable -- you would need {needed!.toFixed(1)}% on remaining work.
        </p>
      ) : (
        <p className="text-sm text-zinc-700">
          You need{" "}
          <span className="text-xl font-bold text-zinc-900">{needed!.toFixed(1)}%</span>{" "}
          on your remaining weighted assignments.
        </p>
      )}
    </div>
  );
}
