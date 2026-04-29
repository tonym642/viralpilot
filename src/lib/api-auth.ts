import { NextResponse } from "next/server";
import { createSupabaseServer } from "./supabase-server";

export async function withAuth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, supabase };
}
