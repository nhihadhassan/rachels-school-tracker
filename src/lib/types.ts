export type Status = "open" | "done" | "skipped";
export type Priority = "low" | "med" | "high";

export interface Term {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface Course {
  id: string;
  term_id: string;
  code: string;
  name: string;
  color: string | null;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  weight: number | null;
  status: Status;
  mark_received: number | null;
  notes: string | null;
  priority: Priority | null;
  time_estimate_minutes: number | null;
  completed_at: string | null;
}

export interface AssignmentWithCourse extends Assignment {
  course: Course;
}

export interface Checklist {
  id: string;
  term_id: string;
  name: string;
  notes: string | null;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  due_date: string | null;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface ChecklistItemWithChecklist extends ChecklistItem {
  checklist: Checklist;
}

export interface Attachment {
  id: string;
  assignment_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Subtask {
  id: string;
  assignment_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
}

// Unified item used in the dashboard merged list
export type DashboardItem =
  | { kind: "assignment"; item: AssignmentWithCourse }
  | { kind: "checklist_item"; item: ChecklistItemWithChecklist };
