import { NextResponse } from "next/server";
import { withAuth, requireProjectOwnership } from "@/src/lib/api-auth";

export async function POST(req: Request) {
  try {
    const auth = await withAuth();
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const body = await req.json();

    const {
      projectId,
      day,
      title,
      platform,
      hook,
      script,
      caption,
      hashtags,
      visualDirection,
      status = "draft",
    } = body;

    if (!projectId || !day || !title || !platform) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const ownershipError = await requireProjectOwnership(projectId, supabase);
    if (ownershipError) return ownershipError;

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        project_id: projectId,
        day,
        title,
        platform,
        hook,
        script,
        caption,
        hashtags,
        visual_direction: visualDirection,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error("content_items insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("POST /api/content-items error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
