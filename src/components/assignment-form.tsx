"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import type { Course, Assignment } from "@/lib/types";

interface Props {
  action: (prev: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
  courses: Course[];
  defaultValues?: Partial<Assignment> & { course_id?: string };
  submitLabel?: string;
  cancelHref?: string;
}

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function AssignmentForm({ action, courses, defaultValues, submitLabel = "Save", cancelHref = "/dashboard" }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  const defaultDate = defaultValues?.due_date
    ? format(new Date(defaultValues.due_date), "yyyy-MM-dd")
    : "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Title" required>
        <input
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title ?? ""}
          placeholder="e.g. Individual Assignment #1"
          className={inputCls}
        />
      </Field>

      <Field label="Course" required>
        <select name="course_id" required defaultValue={defaultValues?.course_id ?? ""} className={inputCls}>
          <option value="" disabled>Pick a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Due date" required>
        <input
          name="due_date"
          type="date"
          required
          defaultValue={defaultDate}
          className={inputCls}
        />
      </Field>

      <div className="flex gap-3">
        <Field label="Weight (%)" className="flex-1">
          <input
            name="weight"
            type="number"
            min="0"
            max="100"
            step="0.5"
            defaultValue={defaultValues?.weight ?? ""}
            placeholder="e.g. 25"
            className={inputCls}
          />
        </Field>
        <Field label="Mark received (%)" className="flex-1">
          <input
            name="mark_received"
            type="number"
            min="0"
            max="100"
            step="0.5"
            defaultValue={defaultValues?.mark_received ?? ""}
            placeholder="e.g. 88"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Priority + time estimate */}
      <div className="flex gap-3">
        <Field label="Priority" className="flex-1">
          <select name="priority" defaultValue={defaultValues?.priority ?? ""} className={inputCls}>
            <option value="">None</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Field label="Est. time (min)" className="flex-1">
          <input
            name="time_estimate_minutes"
            type="number"
            min="0"
            step="5"
            defaultValue={defaultValues?.time_estimate_minutes ?? ""}
            placeholder="e.g. 90"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Optional notes..."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <a
          href={cancelHref}
          className="flex-1 rounded-xl border border-zinc-200 py-3 text-center text-sm font-medium text-zinc-600"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function CourseForm({
  action,
  defaultValues,
  submitLabel = "Save",
  cancelHref = "/courses",
}: {
  action: (prev: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
  defaultValues?: { code?: string; name?: string; color?: string };
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const defaultColor = defaultValues?.color ?? COLORS[0];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Course code" required>
        <input
          name="code"
          type="text"
          required
          defaultValue={defaultValues?.code ?? ""}
          placeholder="e.g. SWK 4510"
          className={inputCls}
        />
      </Field>

      <Field label="Course name" required>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="e.g. Research for Evidence-Based Practice"
          className={inputCls}
        />
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2 pt-1">
          {COLORS.map((hex) => (
            <label key={hex} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={hex}
                defaultChecked={hex === defaultColor}
                className="sr-only"
              />
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent ring-offset-1 has-[:checked]:ring-2 has-[:checked]:ring-zinc-900"
                style={{ backgroundColor: hex }}
              />
            </label>
          ))}
        </div>
      </Field>

      <div className="flex gap-3 pt-2">
        <a
          href={cancelHref}
          className="flex-1 rounded-xl border border-zinc-200 py-3 text-center text-sm font-medium text-zinc-600"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label, required, children, className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-zinc-800">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";
