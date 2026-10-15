import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids, new_status, stories, chapters, story_id } = body;
    const supabase = createAdminSupabaseClient();

    // 1. Bulk Delete Stories
    if (action === "delete") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn ít nhất 1 mục để xóa" },
          { status: 400 }
        );
      }

      // First delete associated chapters
      await supabase.from("chapters").delete().in("story_id", ids);
      // Then delete stories
      const { error } = await supabase.from("stories").delete().in("id", ids);
      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã xóa vĩnh viễn ${ids.length} bộ truyện thành công!`,
      });
    }

    // 2. Bulk Move to Trash (Soft Delete)
    if (action === "trash") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn ít nhất 1 mục để đưa vào thùng rác" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("stories")
        .update({ status: "trash", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã chuyển ${ids.length} bộ truyện vào Thùng rác!`,
      });
    }

    // 3. Bulk Restore from Trash
    if (action === "restore") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn ít nhất 1 mục để khôi phục" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("stories")
        .update({ status: "ongoing", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã khôi phục thành công ${ids.length} bộ truyện!`,
      });
    }

    // 4. Bulk Status Update
    if (action === "status") {
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !new_status) {
        return NextResponse.json(
          { success: false, error: "Thiếu danh sách ID hoặc trạng thái mới" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("stories")
        .update({ status: new_status, updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái của ${ids.length} bộ truyện thành "${new_status}"!`,
      });
    }

    // 5. Bulk Import Stories (from JSON/CSV parse)
    if (action === "import_stories") {
      if (!stories || !Array.isArray(stories) || stories.length === 0) {
        return NextResponse.json(
          { success: false, error: "Danh sách truyện để nhập hàng loạt không hợp lệ" },
          { status: 400 }
        );
      }

      let insertedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const s of stories) {
        if (!s.title) continue;
        const slug =
          s.slug ||
          s.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const storyPayload = {
          title: s.title.trim(),
          slug,
          type: s.type === "comic" ? "comic" : s.type === "book" ? "book" : "novel",
          author_name: s.author_name || "Nhiều Tác Giả",
          description: s.description || "",
          cover_url: s.cover_url || "https://media.doctruyen.vip/covers/novel-default.webp",
          status: s.status || "ongoing",
          genres: Array.isArray(s.genres) ? s.genres : s.genres ? [s.genres] : ["Đặc Sắc"],
          total_chapters: s.total_chapters || 0,
          total_views: s.total_views || 0,
          total_likes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("stories").upsert(storyPayload, { onConflict: "slug" });
        if (error) {
          errorCount++;
          errors.push(`${s.title}: ${error.message}`);
        } else {
          insertedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${insertedCount} bộ truyện (Lỗi: ${errorCount})`,
        insertedCount,
        errorCount,
        errors: errors.slice(0, 5),
      });
    }

    // 6. Bulk Import Chapters
    if (action === "import_chapters") {
      if (!story_id || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
        return NextResponse.json(
          { success: false, error: "Thiếu Story ID hoặc danh sách chương" },
          { status: 400 }
        );
      }

      let chInserted = 0;
      for (const ch of chapters) {
        const payload: any = {
          story_id,
          chapter_number: parseFloat(ch.chapter_number) || (chInserted + 1),
          title: ch.title || `Chương ${ch.chapter_number || chInserted + 1}`,
          is_locked: !!ch.is_locked,
          price_coins: parseInt(ch.price_coins || "0", 10),
          created_at: new Date().toISOString(),
        };

        if (ch.content_text) payload.content_text = ch.content_text;
        if (ch.pages_images) payload.pages_images = ch.pages_images;

        const { error } = await supabase.from("chapters").insert(payload);
        if (!error) chInserted++;
      }

      // Update story total_chapters
      const { count } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("story_id", story_id);

      await supabase
        .from("stories")
        .update({ total_chapters: count || 0, updated_at: new Date().toISOString() })
        .eq("id", story_id);

      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${chInserted}/${chapters.length} chương!`,
      });
    }

    // 7. Bulk Add Genre / Tag Book
    if (action === "add_genre" || action === "tag_book") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn ít nhất 1 mục" },
          { status: 400 }
        );
      }

      const genresToAdd = Array.isArray(body.genres)
        ? body.genres
        : [body.genre || "Sách"];

      const { data: currentStories } = await supabase
        .from("stories")
        .select("id, genres")
        .in("id", ids);

      if (currentStories) {
        for (const cs of currentStories) {
          const current = Array.isArray(cs.genres) ? [...cs.genres] : [];
          let changed = false;
          for (const g of genresToAdd) {
            if (!current.includes(g)) {
              current.push(g);
              changed = true;
            }
          }
          if (changed) {
            await supabase
              .from("stories")
              .update({ genres: current, updated_at: new Date().toISOString() })
              .eq("id", cs.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã gán thể loại thành công cho ${ids.length} mục!`,
      });
    }

    // 8. Bulk Delete Posts
    if (action === "delete_posts") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng chọn ít nhất 1 bài viết để xóa" },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("posts").delete().in("id", ids);
      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã xóa ${ids.length} bài viết thành công!`,
      });
    }

    // 9. Bulk Status Update for Posts
    if (action === "status_posts") {
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !new_status) {
        return NextResponse.json(
          { success: false, error: "Thiếu danh sách ID bài viết hoặc trạng thái mới" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("posts")
        .update({ status: new_status, updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái ${ids.length} bài viết thành "${new_status}"!`,
      });
    }

    return NextResponse.json({ success: false, error: "Thao tác bulk không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý hàng loạt" },
      { status: 500 }
    );
  }
}
