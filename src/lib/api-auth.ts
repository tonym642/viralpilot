import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "./supabase-server";

export async function withAuth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, supabase };
}

export async function requireProjectOwnership(
  projectId: string,
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return null;
}
