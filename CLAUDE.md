@AGENTS.md

# Shared Supabase

This project shares a Supabase project (`zgafubhzhxikuknihmnu`) with Rachel's Tutoring Tracker.

**Before writing any migration or adding any table, read the schema registry:**
`../Rachel's Supabase/SCHEMA.md`

This project owns: `terms`, `courses`, `assignments`, `checklists`, `checklist_items`, `subtasks`, `attachments`, `push_subscriptions`.
Do NOT touch tutoring tables: `clients`, `students`, `profiles`, `sessions`, `recurring_schedules`, `settings`.
Shared: `workspace_members`, `is_workspace_member()`, `set_updated_at()`.

After applying a migration here, copy it to `../Rachel's Supabase/migrations/` and update `../Rachel's Supabase/SCHEMA.md`.
