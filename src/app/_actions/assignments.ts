"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  course_id: z.string().uuid("Pick a course"),
  due_date: z.string().min(1, "Due date is required"),
  weight: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).max(100).nullable(),
  ),
  mark_received: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).max(100).nullable(),
  ),
  notes: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  priority: z.preprocess((v) => (v === "" ? null : v), z.enum(["low", "med", "high"]).nullable()),
  time_estimate_minutes: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
});

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function markDone(id: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("assignments")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function markUndone(id: string) {
  const supabase = await getAuthedClient();
  await supabase
    .from("assignments")
    .update({ status: "open", completed_at: null })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function deleteAssignment(id: string) {
  const supabase = await getAuthedClient();
  await supabase.from("assignments").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function createAssignment(_prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();
  const raw = {
    title: formData.get("title"),
    course_id: formData.get("course_id"),
    due_date: formData.get("due_date"),
    weight: formData.get("weight"),
    mark_received: formData.get("mark_received"),
    notes: formData.get("notes"),
    priority: formData.get("priority"),
    time_estimate_minutes: formData.get("time_estimate_minutes"),
  };
  const parsed = AssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  await supabase.from("assignments").insert({
    title: d.title,
    course_id: d.course_id,
    due_date: new Date(d.due_date).toISOString(),
    weight: d.weight,
    mark_received: d.mark_received,
    notes: d.notes,
    priority: d.priority,
    time_estimate_minutes: d.time_estimate_minutes,
    status: "open",
  });
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect("/dashboard");
}

export async function updateAssignment(id: string, _prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();
  const raw = {
    title: formData.get("title"),
    course_id: formData.get("course_id"),
    due_date: formData.get("due_date"),
    weight: formData.get("weight"),
    mark_received: formData.get("mark_received"),
    notes: formData.get("notes"),
    priority: formData.get("priority"),
    time_estimate_minutes: formData.get("time_estimate_minutes"),
  };
  const parsed = AssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  await supabase.from("assignments").update({
    title: d.title,
    course_id: d.course_id,
    due_date: new Date(d.due_date).toISOString(),
    weight: d.weight,
    mark_received: d.mark_received,
    notes: d.notes,
    priority: d.priority,
    time_estimate_minutes: d.time_estimate_minutes,
  }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect("/dashboard");
}
