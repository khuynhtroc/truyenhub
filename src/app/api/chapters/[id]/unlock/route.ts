import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const supabase = await createServerSupabaseClient();

    // 1. Lấy thông tin user hiện tại
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để mở khóa chương" },
        { status: 401 }
      );
    }

    // 2. Gọi hàm Stored Procedure an toàn trong Supabase
    // Hàm này chạy trong 1 transaction ACID: kiểm tra số dư, trừ xu, ghi bảng unlocked_chapters
    const { data, error } = await supabase.rpc("unlock_chapter_with_coins", {
      p_user_id: user.id,
      p_chapter_id: chapterId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      remaining_coins: data.remaining_coins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý server" },
      { status: 500 }
    );
  }
}
