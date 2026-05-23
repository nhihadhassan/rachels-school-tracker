"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function uploadAttachment(assignmentId: string, formData: FormData) {
  const { supabase } = await getAuthedClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file selected" };
  if (file.size > 20 * 1024 * 1024) return { error: "File must be under 20 MB" };

  // Store under assignment_id/uuid_filename to avoid collisions
  const ext = file.name.split(".").pop() ?? "";
  const safeName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const storagePath = `${assignmentId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("attachments").insert({
    assignment_id: assignmentId,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
  });

  if (dbError) {
    // Roll back the storage upload if the DB insert fails
    await supabase.storage.from("attachments").remove([storagePath]);
    return { error: dbError.message };
  }

  revalidatePath(`/assignments/${assignmentId}/edit`);
  return { error: null };
}

export async function deleteAttachment(id: string, storagePath: string, assignmentId: string) {
  const { supabase } = await getAuthedClient();

  await supabase.storage.from("attachments").remove([storagePath]);
  await supabase.from("attachments").delete().eq("id", id);
  revalidatePath(`/assignments/${assignmentId}/edit`);
}

export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60 * 60); // 1-hour expiry
  return data?.signedUrl ?? null;
}
