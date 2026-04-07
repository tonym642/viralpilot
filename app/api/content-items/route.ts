import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
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
