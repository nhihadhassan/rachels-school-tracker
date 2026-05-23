"use client";

import { useState, useEffect, useTransition } from "react";
import { subscribePush, unsubscribePush } from "@/app/_actions/push";

interface Props {
  /** Endpoint already stored in DB for this user (null = not subscribed) */
  storedEndpoint: string | null;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export function PushOptIn({ storedEndpoint }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);

    if (!ok) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setSubscribed(true);
          setCurrentEndpoint(sub.endpoint);
        } else {
          // If DB has a stored endpoint but browser has no sub, clean up
          if (storedEndpoint) {
            unsubscribePush(storedEndpoint).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [storedEndpoint]);

  async function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notification permission denied. Enable it in your browser settings.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        });

        await subscribePush({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!)),
            ),
            auth: btoa(
              String.fromCharCode(...new Uint8Array(sub.getKey("auth")!)),
            ),
          },
        });

        setSubscribed(true);
        setCurrentEndpoint(sub.endpoint);
      } catch (err) {
        setError("Could not enable notifications. Try again.");
        console.error(err);
      }
    });
  }

  async function handleUnsubscribe() {
    setError(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        await sub?.unsubscribe();
        if (currentEndpoint) await unsubscribePush(currentEndpoint);
        setSubscribed(false);
        setCurrentEndpoint(null);
      } catch (err) {
        setError("Could not disable notifications.");
        console.error(err);
      }
    });
  }

  if (!supported) return null;

  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800">Daily reminders</p>
          <p className="text-xs text-zinc-500">
            {subscribed
              ? "You will get a push each morning for upcoming work."
              : "Get a push notification each morning for upcoming deadlines."}
          </p>
        </div>
        <button
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isPending}
          className={`flex-none rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50
            ${subscribed
              ? "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
            }`}
        >
          {isPending ? "..." : subscribed ? "Turn off" : "Turn on"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
