import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { storyId, slug } = body;

    if (!storyId && !slug) {
      return NextResponse.json(
        { success: false, error: "storyId hoặc slug là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    let query = supabase.from("stories").select("id, total_views");
    if (storyId) {
      query = query.eq("id", storyId);
    } else if (slug) {
      query = query.eq("slug", slug);
    }

    const { data: story, error: findErr } = await query.single();
    if (findErr || !story) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy truyện" },
        { status: 404 }
      );
    }

    const currentViews = story.total_views || 0;
    const newViews = currentViews + 1;

    const { error: updateErr } = await supabase
      .from("stories")
      .update({ total_views: newViews })
      .eq("id", story.id);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      story_id: story.id,
      total_views: newViews,
    });
  } catch (error: any) {
    console.error("Track view error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
