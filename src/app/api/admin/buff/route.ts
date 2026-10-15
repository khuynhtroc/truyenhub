import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action = "single", // "single" | "bulk_random" | "multiply"
      story_id,
      story_ids,
      target_type = "all",
      mode = "add", // "add" | "set"
      views = 0,
      likes = 0,
      min_views = 500,
      max_views = 5000,
      min_likes = 50,
      max_likes = 500,
      multiplier = 2
    } = body;

    const supabase = createAdminSupabaseClient();

    // 1. Single story buff
    if (action === "single") {
      if (!story_id) {
        return NextResponse.json(
          { success: false, error: "Thiếu story_id cần buff" },
          { status: 400 }
        );
      }

      const { data: story, error: getErr } = await supabase
        .from("stories")
        .select("id, title, total_views, total_likes")
        .eq("id", story_id)
        .single();

      if (getErr || !story) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy truyện" },
          { status: 404 }
        );
      }

      const currentViews = story.total_views || 0;
      const currentLikes = story.total_likes || 0;

      const newViews = mode === "add" ? currentViews + Math.max(0, parseInt(views, 10) || 0) : Math.max(0, parseInt(views, 10) || 0);
      const newLikes = mode === "add" ? currentLikes + Math.max(0, parseInt(likes, 10) || 0) : Math.max(0, parseInt(likes, 10) || 0);

      const { error: updateErr } = await supabase
        .from("stories")
        .update({
          total_views: newViews,
          total_likes: newLikes,
          updated_at: new Date().toISOString()
        })
        .eq("id", story_id);

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật chỉ số ảo cho "${story.title}": ${newViews.toLocaleString()} lượt xem, ${newLikes.toLocaleString()} lượt thích!`,
        data: { id: story_id, title: story.title, total_views: newViews, total_likes: newLikes }
      });
    }

    // 2. Bulk Random Buff
    if (action === "bulk_random") {
      let targetIds: string[] = [];

      if (Array.isArray(story_ids) && story_ids.length > 0) {
        targetIds = story_ids;
      } else {
        // Query stories according to target_type
        let q = supabase.from("stories").select("id, total_views, total_likes").neq("status", "trash");
        if (target_type === "comic") {
          q = q.eq("type", "comic");
        } else if (target_type === "novel") {
          q = q.eq("type", "novel");
        } else if (target_type === "book") {
          q = q.or('type.eq.book,genres.cs.{"Sách"}');
        }
        const { data: storiesToBuff } = await q.limit(100);
        if (storiesToBuff) {
          targetIds = storiesToBuff.map(s => s.id);
        }
      }

      if (targetIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy truyện nào thỏa mãn để buff" },
          { status: 400 }
        );
      }

      const minV = Math.max(0, parseInt(min_views, 10) || 100);
      const maxV = Math.max(minV, parseInt(max_views, 10) || 5000);
      const minL = Math.max(0, parseInt(min_likes, 10) || 10);
      const maxL = Math.max(minL, parseInt(max_likes, 10) || 500);

      // Fetch targets
      const { data: list } = await supabase
        .from("stories")
        .select("id, total_views, total_likes")
        .in("id", targetIds);

      if (!list || list.length === 0) {
        return NextResponse.json({ success: false, error: "Không thể lấy thông tin truyện" }, { status: 400 });
      }

      let updatedCount = 0;
      for (const item of list) {
        const addedViews = Math.floor(Math.random() * (maxV - minV + 1)) + minV;
        const addedLikes = Math.floor(Math.random() * (maxL - minL + 1)) + minL;

        const newViews = (item.total_views || 0) + addedViews;
        const newLikes = (item.total_likes || 0) + addedLikes;

        await supabase
          .from("stories")
          .update({
            total_views: newViews,
            total_likes: newLikes,
            updated_at: new Date().toISOString()
          })
          .eq("id", item.id);

        updatedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Đã buff ngẫu nhiên lượt xem và lượt thích ảo cho thành công ${updatedCount} truyện! (+${minV.toLocaleString()} ~ +${maxV.toLocaleString()} views, +${minL.toLocaleString()} ~ +${maxL.toLocaleString()} likes)`,
        updatedCount
      });
    }

    return NextResponse.json({ success: false, error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Buff API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi buff tương tác ảo" },
      { status: 500 }
    );
  }
}
