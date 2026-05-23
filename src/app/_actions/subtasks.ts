"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function toggleSubtask(id: string, isDone: boolean, assignmentId: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("subtasks")
    .update({ is_done: isDone })
    .eq("id", id);
  revalidatePath(`/assignments/${assignmentId}/edit`);
}

export async function createSubtask(assignmentId: string, _prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();
  const title = formData.get("title");
  const parsed = z.string().min(1).safeParse(title);
  if (!parsed.success) return { error: "Title is required" };

  const { data: max } = await supabase
    .from("subtasks")
    .select("sort_order")
    .eq("assignment_id", assignmentId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("subtasks").insert({
    assignment_id: assignmentId,
    title: parsed.data,
    sort_order: (max?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/assignments/${assignmentId}/edit`);
  return { error: null };
}

export async function deleteSubtask(id: string, assignmentId: string) {
  const supabase = await getAuthedClient();
  await supabase.from("subtasks").delete().eq("id", id);
  revalidatePath(`/assignments/${assignmentId}/edit`);
}
