import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("story_id");
    const chapterId = searchParams.get("chapter_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: "Thiếu story_id" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("comments")
      .select("*")
      .eq("story_id", storyId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (chapterId) {
      query = query.eq("chapter_id", chapterId);
    }

    const { data: comments, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      comments: comments || [],
    });
  } catch (error: any) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải bình luận" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { story_id, chapter_id, user_name, content, is_spoiler, avatar_url } = body;

    if (!story_id || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập nội dung bình luận" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        story_id,
        chapter_id: chapter_id || null,
        user_name: user_name?.trim() || "Độc giả vô danh",
        avatar_url: avatar_url || "",
        content: content.trim(),
        is_spoiler: Boolean(is_spoiler),
        status: "approved",
        likes_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      comment: data,
    });
  } catch (error: any) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi gửi bình luận" },
      { status: 500 }
    );
  }
}
