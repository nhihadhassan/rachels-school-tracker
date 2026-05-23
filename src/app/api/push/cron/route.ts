import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";
import {
  startOfDay, endOfDay, addDays, formatDistance,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Toronto timezone for "today"
const TZ = "America/Toronto";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function GET(request: NextRequest) {
  // Verify cron secret.
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  // Manual test calls can use ?secret=<CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const querySecret = request.nextUrl.searchParams.get("secret");
  const secret = bearerSecret ?? querySecret;

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service-role client so we can read all rows regardless of RLS
  const supabase = await createClient();

  // What counts as "today" in Toronto
  const nowToronto = toZonedTime(new Date(), TZ);
  const today = startOfDay(nowToronto);

  // Fetch all push subscriptions
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscribers" });
  }

  // Fetch open assignments due in the next 3 days (today inclusive)
  const windowEnd = endOfDay(addDays(today, 3));

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, due_date, course:courses(code)")
    .eq("status", "open")
    .gte("due_date", today.toISOString())
    .lte("due_date", windowEnd.toISOString())
    .order("due_date", { ascending: true });

  // Fetch open checklist items due in the next 3 days
  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("id, title, due_date")
    .eq("is_done", false)
    .gte("due_date", today.toISOString())
    .lte("due_date", windowEnd.toISOString())
    .order("due_date", { ascending: true });

  const allItems = [
    ...(assignments ?? []).map((a) => ({
      title: a.title,
      due: new Date(a.due_date),
      label: (a.course as unknown as { code: string } | null)?.code ?? "",
    })),
    ...(checklistItems ?? []).filter((ci) => ci.due_date).map((ci) => ({
      title: ci.title,
      due: new Date(ci.due_date!),
      label: "Practicum",
    })),
  ];

  if (allItems.length === 0) {
    return NextResponse.json({ sent: 0, message: "Nothing due soon" });
  }

  // Build notification
  const dueToday = allItems.filter(
    (i) => i.due >= today && i.due <= endOfDay(today),
  );
  const dueTomorrow = allItems.filter(
    (i) => i.due > endOfDay(today) && i.due <= endOfDay(addDays(today, 1)),
  );
  const dueSoon = allItems.filter(
    (i) => i.due > endOfDay(addDays(today, 1)),
  );

  function itemLine(item: { title: string; label: string; due: Date }) {
    return item.label ? `${item.label}: ${item.title}` : item.title;
  }

  const lines: string[] = [];
  if (dueToday.length) lines.push(`Due today: ${dueToday.map(itemLine).join(", ")}`);
  if (dueTomorrow.length) lines.push(`Due tomorrow: ${dueTomorrow.map(itemLine).join(", ")}`);
  if (dueSoon.length) {
    dueSoon.forEach((i) =>
      lines.push(`Due ${formatDistance(i.due, today, { addSuffix: true })}: ${itemLine(i)}`),
    );
  }

  const title = dueToday.length
    ? `${dueToday.length} thing${dueToday.length > 1 ? "s" : ""} due today`
    : `${allItems.length} thing${allItems.length > 1 ? "s" : ""} coming up`;

  const payload = JSON.stringify({
    title,
    body: lines.join("\n"),
    url: "/dashboard",
  });

  // Send to all subscribers, collect failures
  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60 * 12 }, // 12-hour TTL
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 = subscription expired; remove it
        if (status === 404 || status === 410) {
          stale.push(sub.endpoint);
        }
      }
    }),
  );

  // Clean up stale subscriptions
  if (stale.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", stale);
  }

  return NextResponse.json({ sent, stale: stale.length, items: allItems.length });
}
