import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("comments")
      .select("*, stories(id, title, slug)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.ilike("content", `%${q}%`);
    }

    const { data: comments, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      comments: comments || [],
    });
  } catch (error: any) {
    console.error("GET admin comments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải danh sách bình luận" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { story_id, user_name, content, is_spoiler, likes_count, status } = body;

    if (!story_id || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn truyện và nhập nội dung" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        story_id,
        user_name: user_name?.trim() || "Độc giả ẩn danh",
        content: content.trim(),
        is_spoiler: Boolean(is_spoiler),
        likes_count: parseInt(likes_count || "0", 10),
        status: status || "approved",
      })
      .select("*, stories(id, title, slug)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      comment: data,
      message: "Đã thêm bình luận thành công!",
    });
  } catch (error: any) {
    console.error("POST admin comment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo bình luận" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, content } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID bình luận" }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (content) updates.content = content;

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("comments")
      .update(updates)
      .eq("id", id)
      .select("*, stories(id, title, slug)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      comment: data,
      message: "Đã cập nhật trạng thái bình luận!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật bình luận" },
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
        { success: false, error: "Thiếu ID bình luận cần xóa" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Đã xóa bình luận thành công!",
    });
  } catch (error: any) {
    console.error("DELETE admin comment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa bình luận" },
      { status: 500 }
    );
  }
}
