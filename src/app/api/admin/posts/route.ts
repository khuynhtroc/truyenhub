import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { schedulePublishedPostAutoShare } from "@/lib/social/schedule-auto-share";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const type = searchParams.get("type"); // 'page' or 'article'
    const status = searchParams.get("status");

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (type && type !== "all") {
      if (type === "blog" || type === "article") {
        query = query.neq("type", "page");
      } else {
        query = query.eq("type", type);
      }
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,excerpt.ilike.%${q}%`);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      posts: posts || [],
    });
  } catch (error: any) {
    console.error("GET admin posts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải bài viết" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      type = "page",
      excerpt = "",
      content_html = "",
      status = "published",
      seo_title = "",
      seo_description = "",
      focus_keyword = "",
      hero_image = "",
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề và đường dẫn (slug) là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-"),
        type,
        excerpt,
        content_html,
        status,
        seo_title: seo_title || title,
        seo_description: seo_description || excerpt,
        focus_keyword,
        hero_image,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    if (data && data.status === "published") {
      schedulePublishedPostAutoShare({
        id: data.id,
        title: data.title,
        slug: data.slug,
        category: "blog",
        type: data.type || "article",
        hero_image: data.hero_image,
        excerpt: data.excerpt,
        seo_description: data.seo_description,
        status: data.status,
      } as any, "Admin New Post").catch((shareErr) => {
        console.warn("[Social Auto-Share] Failed for new post:", shareErr);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã tạo trang/bài viết thành công!",
      post: data,
    });
  } catch (error: any) {
    console.error("POST admin posts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo bài viết" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID bài viết cần sửa" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật trang/bài viết thành công!",
      post: data,
    });
  } catch (error: any) {
    console.error("PUT admin posts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật bài viết" },
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
        { success: false, error: "Thiếu ID trang/bài viết cần xóa" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Đã xóa trang/bài viết thành công!",
    });
  } catch (error: any) {
    console.error("DELETE admin posts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa bài viết" },
      { status: 500 }
    );
  }
}
