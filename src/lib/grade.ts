import type { Assignment } from "./types";

/**
 * Current grade: weighted average of graded assignments that have a mark.
 * Returns null if no graded + marked assignments exist.
 */
export function currentGrade(assignments: Assignment[]): number | null {
  const graded = assignments.filter((a) => a.weight != null && a.mark_received != null);
  if (graded.length === 0) return null;

  const totalWeight = graded.reduce((sum, a) => sum + a.weight!, 0);
  if (totalWeight === 0) return null;

  const weightedSum = graded.reduce(
    (sum, a) => sum + a.mark_received! * a.weight!,
    0,
  );
  return weightedSum / totalWeight;
}

/**
 * Projected grade: uses actual mark_received where available,
 * and assumes `projection` (0-100) for assignments not yet marked.
 * Skipped assignments are excluded.
 * Returns null if there are no weighted assignments at all.
 */
export function projectedGrade(
  assignments: Assignment[],
  projection = 85,
): number | null {
  const graded = assignments.filter(
    (a) => a.weight != null && a.status !== "skipped",
  );
  if (graded.length === 0) return null;

  const totalWeight = graded.reduce((sum, a) => sum + a.weight!, 0);
  if (totalWeight === 0) return null;

  const weightedSum = graded.reduce((sum, a) => {
    const mark = a.mark_received ?? projection;
    return sum + mark * a.weight!;
  }, 0);

  return weightedSum / totalWeight;
}

/** Total graded weight (denominator) for all non-skipped assignments */
export function totalGradedWeight(assignments: Assignment[]): number {
  return assignments
    .filter((a) => a.weight != null && a.status !== "skipped")
    .reduce((sum, a) => sum + a.weight!, 0);
}

/** Weight earned so far (sum of weights for marked assignments) */
export function earnedWeight(assignments: Assignment[]): number {
  return assignments
    .filter((a) => a.weight != null && a.mark_received != null)
    .reduce((sum, a) => sum + a.weight!, 0);
}

/**
 * Score needed on all remaining (unmarked, non-skipped) work to hit a target grade.
 * Returns null if no remaining weighted work exists.
 * Returns a number > 100 if target is mathematically impossible.
 */
export function scoreNeededToHit(
  assignments: Assignment[],
  targetGrade: number,
): number | null {
  const active = assignments.filter(
    (a) => a.weight != null && a.status !== "skipped",
  );
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, a) => sum + a.weight!, 0);
  if (totalWeight === 0) return null;

  const pointsEarned = active
    .filter((a) => a.mark_received != null)
    .reduce((sum, a) => sum + a.mark_received! * a.weight!, 0);

  const remainingWeight = active
    .filter((a) => a.mark_received == null)
    .reduce((sum, a) => sum + a.weight!, 0);

  if (remainingWeight === 0) return null; // everything is marked already

  const needed = (targetGrade * totalWeight - pointsEarned) / remainingWeight;
  return needed;
}
