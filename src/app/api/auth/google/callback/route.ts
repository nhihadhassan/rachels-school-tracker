import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?gcal=denied", req.nextUrl.origin),
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/login", req.nextUrl.origin),
      );
    }

    const tokens = await exchangeCode(code);

    // Upsert — one row per user
    await supabase.from("google_oauth_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
      },
      { onConflict: "user_id" },
    );

    return NextResponse.redirect(
      new URL("/dashboard?gcal=connected", req.nextUrl.origin),
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?gcal=error", req.nextUrl.origin),
    );
  }
}
