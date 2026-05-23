/**
 * Seed script for Winter 2026 term data.
 * Run once locally: npx tsx scripts/seed-winter-2026.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit that key).
 * Idempotent: uses fixed UUIDs + ON CONFLICT DO NOTHING.
 *
 * Data parsed from:
 *   reference/Class Components - Winter 2025.docx
 *   reference/Due Dates - Winter 2026.docx
 *
 * NOTE: This script was already run via the Supabase MCP during initial setup.
 * Only re-run if you wipe and recreate the DB.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TERM_ID         = "00000000-0000-0000-0000-000000000001";
const COURSE_4510     = "00000000-0000-0000-0000-000000000010";
const COURSE_4605     = "00000000-0000-0000-0000-000000000011";
const COURSE_4654     = "00000000-0000-0000-0000-000000000012";
const CHECKLIST_PRAC  = "00000000-0000-0000-0000-000000000020";

async function seed() {
  // Term
  await sb.from("terms").upsert({
    id: TERM_ID, name: "Winter 2026",
    start_date: "2026-01-08", end_date: "2026-05-29", is_active: true,
  });

  // Courses
  await sb.from("courses").upsert([
    { id: COURSE_4510, term_id: TERM_ID, code: "SWK 4510",
      name: "Research for Evidence-Based Social Work Practice", color: "#6366f1" },
    { id: COURSE_4605, term_id: TERM_ID, code: "SWK 4605",
      name: "Social Work Practice with Individuals and Families", color: "#f59e0b" },
    { id: COURSE_4654, term_id: TERM_ID, code: "SWK 4654",
      name: "Social Work Practice in Organizations and Communities", color: "#10b981" },
  ]);

  // SWK 4510 assignments
  await sb.from("assignments").upsert([
    { course_id: COURSE_4510, title: "In-Class Quiz",                   due_date: "2026-02-09T17:00:00-05:00", weight: null },
    { course_id: COURSE_4510, title: "Individual Assignment #1",         due_date: "2026-02-13T17:00:00-05:00", weight: 25 },
    { course_id: COURSE_4510, title: "Individual Assignment #2",         due_date: "2026-03-20T17:00:00-04:00", weight: 25 },
    { course_id: COURSE_4510, title: "Group Simulation Assignment",      due_date: "2026-03-27T17:00:00-04:00", weight: 15 },
    { course_id: COURSE_4510, title: "Group Simulation Observation Form",due_date: "2026-03-30T17:00:00-04:00", weight: null },
    { course_id: COURSE_4510, title: "Simulation Reflection Assignment", due_date: "2026-04-02T17:00:00-04:00", weight: 20 },
  ], { onConflict: "id" });

  // SWK 4605 assignments
  await sb.from("assignments").upsert([
    { course_id: COURSE_4605, title: "Assignment #1: Video",            due_date: "2026-02-16T17:00:00-05:00", weight: 40 },
    { course_id: COURSE_4605, title: "Assignment #2: Self-Reflection",  due_date: "2026-03-31T17:00:00-04:00", weight: 10 },
    { course_id: COURSE_4605, title: "Assignment #3: Final Paper",      due_date: "2026-04-07T17:00:00-04:00", weight: 50 },
  ], { onConflict: "id" });

  // SWK 4654 assignments
  await sb.from("assignments").upsert([
    { course_id: COURSE_4654, title: "Social Justice Reflective Paper",         due_date: "2026-01-27T17:00:00-05:00", weight: 20 },
    { course_id: COURSE_4654, title: "Asset Map Group Presentation",            due_date: "2026-03-03T17:00:00-05:00", weight: 25 },
    { course_id: COURSE_4654, title: "One Page Summary (Ostrow & Hayes, 2015)", due_date: "2026-03-06T17:00:00-05:00", weight: 10, notes: "Submit by 5pm" },
    { course_id: COURSE_4654, title: "Asset Map -- Group Evaluation Component", due_date: "2026-03-13T17:00:00-05:00", weight: 5 },
    { course_id: COURSE_4654, title: "Class Participation and Reflection",      due_date: "2026-04-01T17:00:00-04:00", weight: 10 },
    { course_id: COURSE_4654, title: "Organizational Assessment for Change",    due_date: "2026-04-10T17:00:00-04:00", weight: 30 },
  ], { onConflict: "id" });

  // Practicum checklist
  await sb.from("checklists").upsert({ id: CHECKLIST_PRAC, term_id: TERM_ID, name: "Practicum" });
  await sb.from("checklist_items").upsert([
    { checklist_id: CHECKLIST_PRAC, title: "Checklist 1: Practicum Safety & Orientation", due_date: "2026-01-08T17:00:00-05:00", sort_order: 1 },
    { checklist_id: CHECKLIST_PRAC, title: "Learning Contract",                           due_date: "2026-02-06T17:00:00-05:00", sort_order: 2 },
    { checklist_id: CHECKLIST_PRAC, title: "Checklist 2: Practicum Learning & Reflection",due_date: "2026-02-13T17:00:00-05:00", sort_order: 3 },
    { checklist_id: CHECKLIST_PRAC, title: "Midterm Evaluations",                         due_date: "2026-03-27T17:00:00-04:00", sort_order: 4 },
    { checklist_id: CHECKLIST_PRAC, title: "Final Evaluation",                            due_date: "2026-05-29T17:00:00-04:00", sort_order: 5 },
  ], { onConflict: "id" });

  console.log("Seed complete.");
}

seed().catch((err) => { console.error(err); process.exit(1); });
