import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  // Whitelist check via RLS-protected RPC (uses current session's JWT email).
  const { data: allowed, error: rpcError } = await supabase.rpc("is_workspace_member");
  if (rpcError || !allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=not_authorized`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
