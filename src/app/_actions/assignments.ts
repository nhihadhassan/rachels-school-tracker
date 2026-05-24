"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  getValidToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

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
  return { supabase, user };
}

/** Build the GCal event title from assignment + course code */
function gcalTitle(courseCode: string, title: string) {
  return `${courseCode} - ${title}`;
}

/** Build a concise GCal event description */
function gcalDescription(d: {
  weight: number | null;
  priority: string | null;
  time_estimate_minutes: number | null;
  notes: string | null;
}) {
  const parts: string[] = [];
  if (d.weight != null) parts.push(`Weight: ${d.weight}%`);
  if (d.priority) parts.push(`Priority: ${d.priority}`);
  if (d.time_estimate_minutes) parts.push(`Est: ~${d.time_estimate_minutes}m`);
  if (d.notes) parts.push(`Notes: ${d.notes}`);
  return parts.join(" | ");
}

export async function markDone(id: string) {
  const { supabase } = await getAuthedClient();
  await supabase
    .from("assignments")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function markUndone(id: string) {
  const { supabase } = await getAuthedClient();
  await supabase
    .from("assignments")
    .update({ status: "open", completed_at: null })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function deleteAssignment(id: string) {
  const { supabase, user } = await getAuthedClient();

  // Grab the gcal_event_id before deleting
  const { data: row } = await supabase
    .from("assignments")
    .select("gcal_event_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("assignments").delete().eq("id", id);

  // Remove from GCal in background (best-effort)
  if (row?.gcal_event_id) {
    getValidToken(user.id).then((token) => {
      if (token) deleteCalendarEvent(token, row.gcal_event_id!).catch(console.error);
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function createAssignment(_prev: unknown, formData: FormData) {
  const { supabase, user } = await getAuthedClient();
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
  const dueDate = new Date(d.due_date).toISOString();
  const dateOnly = dueDate.slice(0, 10);

  // Fetch course code for GCal title
  const { data: course } = await supabase
    .from("courses")
    .select("code")
    .eq("id", d.course_id)
    .maybeSingle();

  const { data: newRow } = await supabase
    .from("assignments")
    .insert({
      title: d.title,
      course_id: d.course_id,
      due_date: dueDate,
      weight: d.weight,
      mark_received: d.mark_received,
      notes: d.notes,
      priority: d.priority,
      time_estimate_minutes: d.time_estimate_minutes,
      status: "open",
    })
    .select("id")
    .single();

  // Sync to GCal in background (best-effort, never blocks the user)
  if (newRow && course) {
    getValidToken(user.id).then(async (token) => {
      if (!token) return;
      try {
        const eventId = await createCalendarEvent(token, {
          summary: gcalTitle(course.code, d.title),
          description: gcalDescription(d),
          date: dateOnly,
        });
        await supabase
          .from("assignments")
          .update({ gcal_event_id: eventId })
          .eq("id", newRow.id);
      } catch (e) {
        console.error("GCal create failed:", e);
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect("/dashboard");
}

export async function updateAssignment(id: string, _prev: unknown, formData: FormData) {
  const { supabase, user } = await getAuthedClient();
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
  const dueDate = new Date(d.due_date).toISOString();
  const dateOnly = dueDate.slice(0, 10);

  const { data: course } = await supabase
    .from("courses")
    .select("code")
    .eq("id", d.course_id)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("assignments")
    .select("gcal_event_id")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("assignments")
    .update({
      title: d.title,
      course_id: d.course_id,
      due_date: dueDate,
      weight: d.weight,
      mark_received: d.mark_received,
      notes: d.notes,
      priority: d.priority,
      time_estimate_minutes: d.time_estimate_minutes,
    })
    .eq("id", id);

  // Sync to GCal in background
  if (course) {
    getValidToken(user.id).then(async (token) => {
      if (!token) return;
      const eventData = {
        summary: gcalTitle(course.code, d.title),
        description: gcalDescription(d),
        date: dateOnly,
      };
      try {
        if (existing?.gcal_event_id) {
          await updateCalendarEvent(token, existing.gcal_event_id, eventData);
        } else {
          // No event yet (e.g. user connected GCal after creating the assignment)
          const eventId = await createCalendarEvent(token, eventData);
          await supabase
            .from("assignments")
            .update({ gcal_event_id: eventId })
            .eq("id", id);
        }
      } catch (e) {
        console.error("GCal update failed:", e);
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  redirect("/dashboard");
}
