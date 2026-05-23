"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CourseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  name: z.string().min(1, "Course name is required"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
});

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function createCourse(_prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();

  const { data: term } = await supabase
    .from("terms")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!term) return { error: "No active term" };

  const parsed = CourseSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await supabase.from("courses").insert({ ...parsed.data, term_id: term.id });
  revalidatePath("/courses");
  redirect("/courses");
}

export async function updateCourse(id: string, _prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();
  const parsed = CourseSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await supabase.from("courses").update(parsed.data).eq("id", id);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  redirect(`/courses/${id}`);
}

export async function deleteCourse(id: string) {
  const supabase = await getAuthedClient();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/courses");
  redirect("/courses");
}
