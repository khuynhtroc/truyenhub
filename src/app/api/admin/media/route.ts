import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(`name.ilike.%${q}%,alt_text.ilike.%${q}%,url.ilike.%${q}%`);
    }

    const { data: mediaItems, error } = await query;
    if (error) throw error;

    // Also fetch unique covers from stories to enrich media library if media table has few items
    let combinedItems = mediaItems || [];
    if (combinedItems.length < 10) {
      const { data: storyCovers } = await supabase
        .from("stories")
        .select("id, title, cover_url, updated_at")
        .not("cover_url", "is", null)
        .order("updated_at", { ascending: false })
        .limit(30);

      if (storyCovers) {
        const existingUrls = new Set(combinedItems.map((m) => m.url));
        for (const sc of storyCovers) {
          if (sc.cover_url && !existingUrls.has(sc.cover_url)) {
            combinedItems.push({
              id: `story-cover-${sc.id}`,
              name: `Bìa: ${sc.title}`,
              original_name: sc.cover_url.split("/").pop() || "cover.webp",
              url: sc.cover_url,
              storage_provider: "cloudflare_r2",
              size_bytes: 45000,
              mime_type: "image/webp",
              alt_text: sc.title,
              created_at: sc.updated_at,
            });
            existingUrls.add(sc.cover_url);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      media: combinedItems,
      total: combinedItems.length,
    });
  } catch (error: any) {
    console.error("GET admin media error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải thư viện media" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, alt_text, size_bytes = 0, mime_type = "image/webp" } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Đường dẫn URL ảnh là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("media")
      .insert({
        name: name || url.split("/").pop() || "media-item",
        original_name: url.split("/").pop() || "image.webp",
        url,
        storage_provider: "cloudflare_r2",
        size_bytes,
        mime_type,
        alt_text: alt_text || name || "Ảnh truyện",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Đã thêm media vào thư viện!",
      media: data,
    });
  } catch (error: any) {
    console.error("POST admin media error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi lưu media" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID media cần xóa" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Đã xóa media khỏi thư viện!",
    });
  } catch (error: any) {
    console.error("DELETE admin media error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa media" },
      { status: 500 }
    );
  }
}
