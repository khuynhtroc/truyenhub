import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRank } from "@/lib/ranks";

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

    // Fetch user profiles map to enrich comments with real user points and rank
    const userNames = Array.from(new Set((comments || []).map((c: any) => c.user_name).filter(Boolean)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("display_name, coins_balance, avatar_url")
      .in("display_name", userNames);

    const profileMap = new Map((profiles || []).map((p: any) => [p.display_name, p]));

    const enriched = (comments || []).map((c: any) => {
      const p = profileMap.get(c.user_name);
      const points = p?.coins_balance ?? (c.user_name ? 1000 : 0);
      const rank = getUserRank(points);
      const avatar = c.avatar_url || p?.avatar_url || null;

      return {
        ...c,
        avatar_url: avatar,
        user_points: points,
        user_rank: rank,
      };
    });

    return NextResponse.json({
      success: true,
      comments: enriched,
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
    const supabaseUser = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    let defaultName = "Độc giả DocTruyen";
    let defaultAvatar = "";
    let userPoints = 1000;

    if (user) {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("display_name, avatar_url, coins_balance")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        defaultName = profile.display_name || user.email?.split("@")[0] || defaultName;
        defaultAvatar = profile.avatar_url || "";
        userPoints = profile.coins_balance || 1000;
      }
    }

    const body = await request.json();
    const { story_id, chapter_id, user_name, content, is_spoiler, avatar_url } = body;

    if (!story_id || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập nội dung bình luận" },
        { status: 400 }
      );
    }

    const finalName = user_name?.trim() || defaultName;
    const finalAvatar = avatar_url || defaultAvatar;

    const { data, error } = await adminSupabase
      .from("comments")
      .insert({
        story_id,
        chapter_id: chapter_id || null,
        user_name: finalName,
        avatar_url: finalAvatar,
        content: content.trim(),
        is_spoiler: Boolean(is_spoiler),
        status: "approved",
        likes_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    const rank = getUserRank(userPoints);

    return NextResponse.json({
      success: true,
      comment: {
        ...data,
        user_points: userPoints,
        user_rank: rank,
      },
    });
  } catch (error: any) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi gửi bình luận" },
      { status: 500 }
    );
  }
}
