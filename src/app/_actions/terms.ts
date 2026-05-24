"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TermSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().nullable(),
  ),
  end_date: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().nullable(),
  ),
});

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

export async function createTerm(_prev: unknown, formData: FormData) {
  const supabase = await getAuthedClient();

  const parsed = TermSchema.safeParse({
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: term, error } = await supabase
    .from("terms")
    .insert({
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      is_active: false, // user must explicitly switch to it
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  // Redirect to courses so user can start adding courses for the new term
  redirect(`/terms/${term.id}/activate`);
}

export async function setActiveTerm(id: string) {
  const supabase = await getAuthedClient();

  // Deactivate all, then activate the chosen one
  await supabase.from("terms").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("terms").update({ is_active: true }).eq("id", id);

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
