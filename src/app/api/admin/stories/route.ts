import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { schedulePublishedPostAutoShare } from "@/lib/social/schedule-auto-share";
import { broadcastNewStory } from "@/lib/telegram-broadcast";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "date_desc";
    const genre = searchParams.get("genre");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createAdminSupabaseClient();
    let query = supabase.from("stories").select("*", { count: "exact" });

    // Handle Sorting
    if (sort === "views_desc") {
      query = query.order("total_views", { ascending: false });
    } else if (sort === "chapters_desc") {
      query = query.order("total_chapters", { ascending: false });
    } else if (sort === "title_asc") {
      query = query.order("title", { ascending: true });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,author_name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    // Type filter (comic, novel, book)
    if (type === "book") {
      query = query.or('type.eq.book,genres.cs.{"Sách"},genres.cs.{"Sách Nói"},genres.cs.{"Ebook"},genres.cs.{"Kỹ Năng Sống"}');
    } else if (type && (type === "comic" || type === "novel")) {
      query = query.eq("type", type);
    }

    // Status / Trash filter
    if (status === "trash") {
      query = query.eq("status", "trash");
    } else if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!status) {
      query = query.neq("status", "trash");
    }

    if (genre) {
      query = query.contains("genres", [genre]);
    }

    const { data: stories, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      stories: stories || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("Admin stories GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, type, description, cover_url, author_name, status, genres } = body;

    if (!title || !slug || !type) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề, slug và loại truyện là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("stories")
      .insert({
        title,
        slug: slug.trim().toLowerCase(),
        type,
        description: description || "",
        cover_url: cover_url || "https://media.doctruyen.vip/covers/doraemon-cover.webp",
        author_name: author_name || "Đang cập nhật",
        status: status || "ongoing",
        genres: Array.isArray(genres) ? genres : typeof genres === "string" ? genres.split(",").map((g: string) => g.trim()).filter(Boolean) : [],
        total_chapters: 0,
        total_views: 0,
        total_likes: 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Tự động đăng lên Fanpage và các mạng xã hội đã bật (nếu có cấu hình Auto-Share)
    if (data && data.status !== "trash" && data.status !== "draft") {
      schedulePublishedPostAutoShare({
        id: data.id,
        title: data.title,
        slug: data.slug,
        cover_url: data.cover_url,
        description: data.description,
        status: data.status,
      } as any, "Admin New Story").catch((shareErr) => {
        console.warn("[Social Auto-Share] Failed for new story:", shareErr);
      });

      // Tự động phát sóng thông báo truyện mới đến nhóm cộng đồng Telegram
      broadcastNewStory({
        title: data.title,
        slug: data.slug,
        author_name: data.author_name,
        cover_url: data.cover_url,
        genres: data.genres,
        description: data.description,
      }).catch((tgErr) => {
        console.warn("[Telegram Broadcast] Failed for new story:", tgErr);
      });
    }

    return NextResponse.json({ success: true, story: data });
  } catch (error: any) {
    console.error("Admin stories POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, slug, type, description, cover_url, author_name, status, genres, total_views, total_likes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID truyện là bắt buộc" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updatePayload.title = title;
    if (slug !== undefined) updatePayload.slug = slug.trim().toLowerCase();
    if (type !== undefined) updatePayload.type = type;
    if (description !== undefined) updatePayload.description = description;
    if (cover_url !== undefined) updatePayload.cover_url = cover_url;
    if (author_name !== undefined) updatePayload.author_name = author_name;
    if (status !== undefined) updatePayload.status = status;
    if (total_views !== undefined) updatePayload.total_views = Math.max(0, parseInt(total_views, 10) || 0);
    if (total_likes !== undefined) updatePayload.total_likes = Math.max(0, parseInt(total_likes, 10) || 0);
    if (genres !== undefined) {
      updatePayload.genres = Array.isArray(genres)
        ? genres
        : typeof genres === "string"
        ? genres.split(",").map((g: string) => g.trim()).filter(Boolean)
        : [];
    }

    const { data, error } = await supabase
      .from("stories")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, story: data });
  } catch (error: any) {
    console.error("Admin stories PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID truyện là bắt buộc" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("stories").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Đã xóa truyện thành công" });
  } catch (error: any) {
    console.error("Admin stories DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
