"use client";

import { useState } from "react";
import { currentGrade, projectedGrade, earnedWeight, totalGradedWeight } from "@/lib/grade";
import type { Assignment } from "@/lib/types";

export function GradeSection({
  assignments,
  color,
}: {
  assignments: Assignment[];
  color: string | null;
}) {
  const [showProjected, setShowProjected] = useState(false);
  const [target, setTarget] = useState(85);

  const current = currentGrade(assignments);
  const projected = projectedGrade(assignments, target);
  const earned = earnedWeight(assignments);
  const total = totalGradedWeight(assignments);
  const remaining = total - earned;

  const displayGrade = showProjected ? projected : current;
  const displaySub = showProjected
    ? `${remaining}% weight @ ${target}% assumed`
    : `${earned}% of ${total}% weight marked`;

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {showProjected ? "Projected grade" : "Current grade"}
        </span>
        <button
          type="button"
          onClick={() => setShowProjected((v) => !v)}
          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
        >
          {showProjected ? "Show current" : "Show projected"}
        </button>
      </div>

      {/* Grade display */}
      <div className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-100">
        <p
          className="text-4xl font-bold tabular-nums"
          style={{ color: displayGrade != null ? (color ?? "#6366f1") : undefined }}
        >
          {displayGrade != null ? `${displayGrade.toFixed(1)}%` : "--"}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{displaySub}</p>

        {/* Projected target input */}
        {showProjected && (
          <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">
            <label className="text-xs text-zinc-500">Assume</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-center text-sm font-medium"
            />
            <span className="text-xs text-zinc-500">% on unmarked work</span>
          </div>
        )}
      </div>
    </div>
  );
}
