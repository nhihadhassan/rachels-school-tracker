"use client";

import { useTransition } from "react";
import { disconnectGoogleCalendar } from "@/app/_actions/google-calendar";

interface Props {
  connected: boolean;
}

export function GCalConnect({ connected }: Props) {
  const [pending, startTransition] = useTransition();

  if (connected) {
    return (
      <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-none">
            <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">Google Calendar</p>
            <p className="text-xs text-emerald-600">Connected</p>
          </div>
        </div>
        <p className="text-xs text-zinc-400 mb-3">
          Assignments sync automatically to your Google Calendar.
        </p>
        <button
          onClick={() =>
            startTransition(async () => {
              await disconnectGoogleCalendar();
            })
          }
          disabled={pending}
          className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
        >
          {pending ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-none">
          <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Google Calendar</p>
          <p className="text-xs text-zinc-400">Not connected</p>
        </div>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        Connect to sync assignments directly to your Google Calendar.
      </p>
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Connect Google Calendar
      </a>
    </div>
  );
}
