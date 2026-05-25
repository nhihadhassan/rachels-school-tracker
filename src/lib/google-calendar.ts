/**
 * Google Calendar REST API helpers.
 * Uses the REST API directly (no googleapis package needed).
 */

const GCAL_API = "https://www.googleapis.com/calendar/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// Rachel's "Due Dates" calendar -- all assignment events go here, not to primary
const DUE_DATES_CALENDAR_ID = encodeURIComponent(
  "eac1d7e3da514aabeda180eb3ae49d0352874b8920fef7fe12780e20f84f0df5@group.calendar.google.com",
);

export interface GCalToken {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO
}

/** Exchange an auth code for tokens */
export async function exchangeCode(code: string): Promise<GCalToken> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

/** Refresh an expired access token using the refresh token */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: string }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google token");
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

/**
 * Get a valid access token for `userId`, refreshing if expired.
 * Returns null if no token is stored yet (user hasn't connected GCal).
 */
export async function getValidToken(userId: string): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  // If token expires in under 60 seconds, refresh it
  const expiresAt = new Date(data.expires_at).getTime();
  if (expiresAt - Date.now() < 60_000) {
    const refreshed = await refreshAccessToken(data.refresh_token);
    await supabase
      .from("google_oauth_tokens")
      .update({
        access_token: refreshed.access_token,
        expires_at: refreshed.expires_at,
      })
      .eq("user_id", userId);
    return refreshed.access_token;
  }

  return data.access_token;
}

/** Check if user has Google Calendar connected */
export async function isGCalConnected(userId: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

interface GCalEventInput {
  summary: string;
  description?: string;
  date: string; // YYYY-MM-DD
}

/** Create a Google Calendar event. Returns the created event ID. */
export async function createCalendarEvent(
  accessToken: string,
  event: GCalEventInput,
): Promise<string> {
  const res = await fetch(`${GCAL_API}/calendars/${DUE_DATES_CALENDAR_ID}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description ?? "",
      start: { date: event.date },
      end: { date: nextDay(event.date) },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GCal create failed: ${err}`);
  }
  const data = await res.json();
  return data.id as string;
}

/** Update an existing Google Calendar event */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: GCalEventInput,
): Promise<void> {
  const res = await fetch(`${GCAL_API}/calendars/${DUE_DATES_CALENDAR_ID}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description ?? "",
      start: { date: event.date },
      end: { date: nextDay(event.date) },
    }),
  });
  // 404 means event was deleted manually — ignore
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`GCal update failed: ${err}`);
  }
}

/** Delete a Google Calendar event */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(`${GCAL_API}/calendars/${DUE_DATES_CALENDAR_ID}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 404/410 = already deleted, that's fine
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`GCal delete failed: ${res.status}`);
  }
}

/** Get events for a date range (to display in the calendar) */
export async function getCalendarEvents(
  accessToken: string,
  timeMin: string, // ISO
  timeMax: string, // ISO
): Promise<Array<{ id: string; summary: string; date: string }>> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await fetch(`${GCAL_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((e: { id: string; summary?: string; start?: { date?: string; dateTime?: string } }) => ({
    id: e.id,
    summary: e.summary ?? "(no title)",
    date: e.start?.date ?? e.start?.dateTime?.slice(0, 10) ?? "",
  }));
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
