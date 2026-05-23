"use client";

import { useTransition, useState } from "react";
import { markItemDone, markItemUndone, deleteChecklistItem } from "@/app/_actions/checklists";
import { ActionSheet } from "@/components/action-sheet";
import { formatDueDate, isLate } from "@/lib/dates";
import type { ChecklistItem, DashboardItem } from "@/lib/types";

const LONG_PRESS_MS = 500;

export function ChecklistRow({ item, checklistId, checklistName }: { item: ChecklistItem; checklistId: string; checklistName: string }) {
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const isDone = optimisticDone ?? item.is_done;

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let didLongPress = false;

  function onTouchStart() {
    didLongPress = false;
    longPressTimer = setTimeout(() => { didLongPress = true; setSheetOpen(true); }, LONG_PRESS_MS);
  }
  function onTouchEnd() { if (longPressTimer) clearTimeout(longPressTimer); }

  function onCheckTap(e: React.MouseEvent) {
    e.stopPropagation();
    if (didLongPress) return;
    const next = !isDone;
    setOptimisticDone(next);
    startTransition(async () => {
      if (next) await markItemDone(item.id, checklistId);
      else await markItemUndone(item.id, checklistId);
      setOptimisticDone(null);
    });
  }

  const dashItem: DashboardItem = {
    kind: "checklist_item",
    item: { ...item, checklist: { id: checklistId, term_id: "", name: checklistName, notes: null } },
  };
  const late = isLate(dashItem);

  return (
    <>
      <li
        onMouseDown={onTouchStart} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        className={`flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-zinc-100 select-none ${pending ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          onClick={onCheckTap}
          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-colors ${isDone ? "border-slate-600 bg-slate-600" : "border-zinc-300"}`}
        >
          {isDone && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <p className={`flex-1 text-sm font-medium text-zinc-900 ${isDone ? "line-through text-zinc-400" : ""}`}>
          {item.title}
        </p>
        <div className="flex flex-none flex-col items-end gap-1">
          {item.due_date && <span className={`text-xs ${late && !isDone ? "font-medium text-red-500" : "text-zinc-500"}`}>{formatDueDate(item.due_date)}</span>}
          {late && !isDone && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">late</span>}
        </div>
      </li>
      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        actions={[
          { label: isDone ? "Mark not done" : "Mark done", onClick: () => { const next = !isDone; setOptimisticDone(next); startTransition(async () => { if (next) await markItemDone(item.id, checklistId); else await markItemUndone(item.id, checklistId); setOptimisticDone(null); }); } },
          { label: "Delete", destructive: true, onClick: () => startTransition(() => deleteChecklistItem(item.id, checklistId)) },
        ]}
      />
    </>
  );
}
