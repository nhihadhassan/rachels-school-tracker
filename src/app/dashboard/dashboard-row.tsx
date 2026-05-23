"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useRef } from "react";
import { ActionSheet } from "@/components/action-sheet";
import { markDone, markUndone, deleteAssignment } from "@/app/_actions/assignments";
import { markItemDone, markItemUndone, deleteChecklistItem } from "@/app/_actions/checklists";
import type { DashboardItem } from "@/lib/types";
import { formatDueDate, isLate } from "@/lib/dates";

const LONG_PRESS_MS = 500;

interface Props {
  item: DashboardItem;
}

export function DashboardRow({ item }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Optimistic local override: null means "use server state"
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const isDoneServer =
    item.kind === "assignment"
      ? item.item.status === "done" || item.item.status === "skipped"
      : item.item.is_done;
  const isDone = optimisticDone ?? isDoneServer;
  const late = isLate(item);

  function onTouchStart() {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setSheetOpen(true);
    }, LONG_PRESS_MS);
  }

  function onTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function onCheckTap(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    if (didLongPress.current) return;
    const next = !isDone;
    setOptimisticDone(next);
    startTransition(async () => {
      if (item.kind === "assignment") {
        if (next) await markDone(item.item.id);
        else await markUndone(item.item.id);
      } else {
        if (next) await markItemDone(item.item.id, item.item.checklist_id);
        else await markItemUndone(item.item.id, item.item.checklist_id);
      }
      setOptimisticDone(null); // let server state take over
    });
  }

  function onRowTap() {
    if (didLongPress.current) return;
    if (item.kind === "assignment") {
      router.push(`/assignments/${item.item.id}/edit`);
    }
    // checklist items: no separate detail page in Phase 1C
  }

  function getSheetActions() {
    if (item.kind === "assignment") {
      return [
        {
          label: isDone ? "Mark open" : "Mark done",
          onClick: () => {
            const next = !isDone;
            setOptimisticDone(next);
            startTransition(async () => {
              if (next) await markDone(item.item.id);
              else await markUndone(item.item.id);
              setOptimisticDone(null);
            });
          },
        },
        {
          label: "Edit",
          onClick: () => router.push(`/assignments/${item.item.id}/edit`),
        },
        {
          label: "Delete",
          destructive: true,
          onClick: () => startTransition(() => deleteAssignment(item.item.id)),
        },
      ];
    }
    return [
      {
        label: isDone ? "Mark not done" : "Mark done",
        onClick: () => {
          const next = !isDone;
          setOptimisticDone(next);
          startTransition(async () => {
            if (next) await markItemDone(item.item.id, item.item.checklist_id);
            else await markItemUndone(item.item.id, item.item.checklist_id);
            setOptimisticDone(null);
          });
        },
      },
      {
        label: "Delete",
        destructive: true,
        onClick: () =>
          startTransition(() => deleteChecklistItem(item.item.id, item.item.checklist_id)),
      },
    ];
  }

  const color =
    item.kind === "assignment"
      ? (item.item.course.color ?? "#94a3b8")
      : "#94a3b8";

  const title =
    item.kind === "assignment" ? item.item.title : item.item.title;

  const sub =
    item.kind === "assignment"
      ? `${item.item.course.code}${item.item.weight != null ? ` · ${item.item.weight}%` : ""}`
      : item.item.checklist.name;

  const dueDate =
    item.kind === "assignment"
      ? formatDueDate(item.item.due_date)
      : item.item.due_date
        ? formatDueDate(item.item.due_date)
        : null;

  const mark =
    item.kind === "assignment" && item.item.mark_received != null
      ? `${item.item.mark_received}%`
      : null;

  return (
    <>
      <li
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onTouchStart}
        onMouseUp={onTouchEnd}
        onMouseLeave={onTouchEnd}
        onClick={onRowTap}
        className={`flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-zinc-100 transition-opacity select-none ${
          pending ? "opacity-60" : ""
        } ${item.kind === "assignment" ? "cursor-pointer active:bg-zinc-50" : ""}`}
      >
        {/* Done checkbox */}
        <button
          type="button"
          onClick={onCheckTap}
          onTouchEnd={(e) => { e.stopPropagation(); onCheckTap(e); }}
          aria-label={isDone ? "Mark open" : "Mark done"}
          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-colors ${
            isDone
              ? "border-zinc-900 bg-zinc-900"
              : "border-zinc-300 hover:border-zinc-500"
          }`}
        >
          {isDone && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Color bar */}
        <span
          className="h-8 w-1 flex-none rounded-full"
          style={{ backgroundColor: color }}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug text-zinc-900 ${
              isDone ? "line-through text-zinc-400" : ""
            }`}
          >
            {title}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
        </div>

        {/* Right side */}
        <div className="flex flex-none flex-col items-end gap-1">
          {dueDate && (
            <span className={`text-xs ${late && !isDone ? "font-medium text-red-500" : "text-zinc-500"}`}>
              {dueDate}
            </span>
          )}
          {late && !isDone && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
              late
            </span>
          )}
          {mark && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
              {mark}
            </span>
          )}
        </div>
      </li>

      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        actions={getSheetActions()}
      />
    </>
  );
}
