import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/src/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      const user = data.session.user as unknown as Record<string, unknown>;
      const amr = Array.isArray(user?.amr) ? user.amr : [];
      const isRecovery =
        type === "recovery" ||
        user?.recovery_sent_at != null ||
        amr.some((a: Record<string, unknown>) => a.method === "recovery");

      if (isRecovery) {
        return NextResponse.redirect(new URL("/login/reset-password", request.url));
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
}
