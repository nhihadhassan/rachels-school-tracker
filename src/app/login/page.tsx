"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Rachel&apos;s Tracker</h1>
          <p className="text-sm text-zinc-500">Sign in with a magic link.</p>
        </div>

        {status === "sent" ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Check your inbox for the link. You can close this tab.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Send magic link"}
            </button>
            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </form>
        )}
      </div>
    </main>
  );
}
