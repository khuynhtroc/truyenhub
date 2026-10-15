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
