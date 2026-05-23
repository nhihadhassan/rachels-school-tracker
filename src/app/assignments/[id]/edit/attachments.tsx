"use client";

import { useRef, useTransition, useActionState } from "react";
import { uploadAttachment, deleteAttachment } from "@/app/_actions/attachments";
import type { Attachment } from "@/lib/types";

interface Props {
  assignmentId: string;
  initialAttachments: Attachment[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string | null): string {
  if (!mime) return "📎";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word")) return "📝";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "📊";
  if (mime.includes("powerpoint") || mime.includes("presentation")) return "📑";
  return "📎";
}

export function AttachmentList({ assignmentId, initialAttachments }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, storagePath: string) {
    if (!confirm("Delete this attachment?")) return;
    startTransition(() => deleteAttachment(id, storagePath, assignmentId));
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-800">Attachments</p>
        {initialAttachments.length > 0 && (
          <span className="text-xs text-zinc-400">{initialAttachments.length}</span>
        )}
      </div>

      {/* List */}
      {initialAttachments.length > 0 ? (
        <ul className="divide-y divide-zinc-50">
          {initialAttachments.map((a) => (
            <FileRow
              key={a.id}
              attachment={a}
              onDelete={() => handleDelete(a.id, a.storage_path)}
              isPending={isPending}
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-zinc-400">No attachments yet.</p>
      )}

      {/* Upload form */}
      <UploadForm assignmentId={assignmentId} />
    </div>
  );
}

function FileRow({
  attachment,
  onDelete,
  isPending,
}: {
  attachment: Attachment;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 group">
      <span className="flex-none text-xl leading-none">
        {fileIcon(attachment.mime_type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{attachment.file_name}</p>
        {attachment.size_bytes != null && (
          <p className="text-xs text-zinc-400">{formatBytes(attachment.size_bytes)}</p>
        )}
      </div>
      <DownloadButton storagePath={attachment.storage_path} fileName={attachment.file_name} />
      <button
        onClick={onDelete}
        disabled={isPending}
        className="flex-none opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-300 hover:text-red-400 transition-opacity disabled:opacity-30"
        aria-label="Delete attachment"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </li>
  );
}

function DownloadButton({ storagePath, fileName }: { storagePath: string; fileName: string }) {
  const [pending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const res = await fetch(`/api/attachments/signed-url?path=${encodeURIComponent(storagePath)}`);
      const { url } = await res.json();
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      }
    });
  }

  return (
    <button
      onClick={handleDownload}
      disabled={pending}
      className="flex-none text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
      aria-label="Download"
    >
      {pending ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

function UploadForm({ assignmentId }: { assignmentId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = uploadAttachment.bind(null, assignmentId);

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await boundAction(formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    null,
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-t border-zinc-100 px-4 py-3"
    >
      {state?.error && (
        <p className="mb-2 text-xs text-red-600">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 transition-colors">
          <input
            ref={fileRef}
            name="file"
            type="file"
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={() => formRef.current?.requestSubmit()}
          />
          {pending ? "Uploading..." : "Choose file to attach"}
        </label>
      </div>
    </form>
  );
}
