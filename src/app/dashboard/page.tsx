import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groupDashboardItems } from "@/lib/dates";
import type { DashboardItem, AssignmentWithCourse, ChecklistItemWithChecklist } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";
import { DashboardRow } from "./dashboard-row";
import { PushOptIn } from "@/components/push-opt-in";
import { getMySubscriptionEndpoint } from "@/app/_actions/push";

export const dynamic = "force-dynamic";

async function fetchDashboardItems(termId: string): Promise<DashboardItem[]> {
  const supabase = await createClient();

  const [{ data: assignments }, { data: checklistItems }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, course:courses!inner(id, term_id, code, name, color)")
      .eq("course.term_id", termId)
      .order("due_date", { ascending: true }),
    supabase
      .from("checklist_items")
      .select("*, checklist:checklists!inner(id, term_id, name, notes)")
      .eq("checklist.term_id", termId)
      .order("due_date", { ascending: true }),
  ]);

  return [
    ...(assignments ?? []).map((a) => ({
      kind: "assignment" as const,
      item: a as AssignmentWithCourse,
    })),
    ...(checklistItems ?? []).map((ci) => ({
      kind: "checklist_item" as const,
      item: ci as ChecklistItemWithChecklist,
    })),
  ];
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!term) {
    return (
      <main className="mx-auto max-w-md px-5 py-8">
        <p className="text-sm text-zinc-500">No active term. Add one to get started.</p>
      </main>
    );
  }

  const [items, storedEndpoint] = await Promise.all([
    fetchDashboardItems(term.id),
    getMySubscriptionEndpoint(),
  ]);
  const groups = groupDashboardItems(items);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-1 bg-zinc-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <div>
          <h1 className="text-base font-semibold leading-tight">Rachel&apos;s Tracker</h1>
          <p className="text-xs text-zinc-500">{term.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/courses" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
            Courses
          </Link>
          <SignOutButton />
        </div>
      </header>

      {/* Push opt-in */}
      <div className="px-5 pt-4">
        <PushOptIn storedEndpoint={storedEndpoint} />
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-4 px-5 pt-4">
        {groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">No assignments yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-500 font-normal normal-case tracking-normal">
                  {group.items.length}
                </span>
              </h2>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <DashboardRow key={item.kind === "assignment" ? `a-${item.item.id}` : `ci-${item.item.id}`} item={item} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* FAB: add assignment */}
      <Link
        href="/assignments/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-700 active:scale-95 transition-transform"
        aria-label="Add assignment"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </main>
  );
}
