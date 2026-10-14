import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyId, action } = body;

    if (!storyId) {
      return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Get current likes
    const { data: story, error: fetchError } = await supabase
      .from("stories")
      .select("id, total_likes")
      .eq("id", storyId)
      .maybeSingle();

    if (fetchError || !story) {
      // Also try querying by slug if storyId was passed as slug
      const { data: storyBySlug } = await supabase
        .from("stories")
        .select("id, total_likes")
        .eq("slug", storyId)
        .maybeSingle();

      if (!storyBySlug) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const current = storyBySlug.total_likes || 0;
      const nextLikes = action === "unlike" ? Math.max(0, current - 1) : current + 1;

      await supabase
        .from("stories")
        .update({ total_likes: nextLikes })
        .eq("id", storyBySlug.id);

      return NextResponse.json({ success: true, total_likes: nextLikes });
    }

    const current = story.total_likes || 0;
    const nextLikes = action === "unlike" ? Math.max(0, current - 1) : current + 1;

    const { error: updateError } = await supabase
      .from("stories")
      .update({ total_likes: nextLikes })
      .eq("id", story.id);

    if (updateError) {
      console.error("Failed to update story likes:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, total_likes: nextLikes });
  } catch (err: any) {
    console.error("Story like API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
