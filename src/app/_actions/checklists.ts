"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  due_date: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
});

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function markItemDone(id: string, checklistId: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("checklist_items")
    .update({ is_done: true, completed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/checklist/${checklistId}`);
  revalidatePath("/dashboard");
}

export async function markItemUndone(id: string, checklistId: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("checklist_items")
    .update({ is_done: false, completed_at: null })
    .eq("id", id);
  revalidatePath(`/checklist/${checklistId}`);
  revalidatePath("/dashboard");
}

export async function createChecklistItem(
  checklistId: string,
  _prev: unknown,
  formData: FormData,
) {
  const supabase = await getAuthedClient();
  const parsed = ItemSchema.safeParse({
    title: formData.get("title"),
    due_date: formData.get("due_date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: maxOrder } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("checklist_items").insert({
    checklist_id: checklistId,
    title: parsed.data.title,
    due_date: parsed.data.due_date
      ? new Date(parsed.data.due_date).toISOString()
      : null,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/checklist/${checklistId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteChecklistItem(id: string, checklistId: string) {
  const supabase = await getAuthedClient();
  await supabase.from("checklist_items").delete().eq("id", id);
  revalidatePath(`/checklist/${checklistId}`);
  revalidatePath("/dashboard");
}

export async function markAllItemsDone(checklistId: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("checklist_items")
    .update({ is_done: true, completed_at: new Date().toISOString() })
    .eq("checklist_id", checklistId)
    .eq("is_done", false);
  revalidatePath(`/checklist/${checklistId}`);
  revalidatePath("/dashboard");
}
