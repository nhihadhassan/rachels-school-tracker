import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem } from "@/lib/types";
import { ChecklistRow } from "./checklist-row";
import { AddItemForm } from "./add-item-form";
import { MarkAllButton } from "./mark-all-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ChecklistPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: checklist } = await supabase
    .from("checklists")
    .select("*, term:terms(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!checklist) notFound();

  const { data: itemsRaw } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_id", id)
    .order("sort_order", { ascending: true });

  const items = (itemsRaw ?? []) as ChecklistItem[];
  const done = items.filter((i) => i.is_done).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-zinc-50 pb-28">
      <header className="sticky top-0 z-10 bg-white/90 px-5 py-4 backdrop-blur border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="text-zinc-500 hover:text-zinc-800">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold">{checklist.name}</h1>
            <p className="text-xs text-zinc-500">{checklist.term?.name} · {done}/{items.length} done</p>
          </div>
          <MarkAllButton checklistId={id} allDone={done === items.length} />
        </div>
      </header>

      <div className="mx-5 mt-4 h-1.5 rounded-full bg-zinc-200">
        <div
          className="h-1.5 rounded-full bg-slate-500 transition-all"
          style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }}
        />
      </div>

      <ul className="flex flex-col gap-1.5 px-5 pt-4">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} checklistId={id} checklistName={checklist.name} />
        ))}
      </ul>

      <div className="px-5 pt-4">
        <AddItemForm checklistId={id} />
      </div>
    </main>
  );
}
