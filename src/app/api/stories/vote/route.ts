import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // 1. Kiểm tra đăng nhập
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để bỏ phiếu đề cử truyện!" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { story_id, points = 10, cheer_message } = body;

    const votePoints = parseInt(points, 10);
    if (!story_id || isNaN(votePoints) || votePoints < 10) {
      return NextResponse.json(
        { success: false, error: "Số Point đề cử tối thiểu là 10 Point." },
        { status: 400 }
      );
    }

    // 2. Kiểm tra số dư Point hiện tại của độc giả
    const { data: profile, error: profErr } = await adminSupabase
      .from("profiles")
      .select("coins_balance, display_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng." },
        { status: 404 }
      );
    }

    const currentBalance = profile.coins_balance || 0;
    if (currentBalance < votePoints) {
      return NextResponse.json(
        {
          success: false,
          error: `Số dư Point của bạn (${currentBalance.toLocaleString()} Point) không đủ để đề cử ${votePoints.toLocaleString()} Point. Hãy tham gia like, comment hoặc điểm danh để tích lũy thêm!`,
        },
        { status: 400 }
      );
    }

    // 3. Trừ Point của người dùng
    const newBalance = currentBalance - votePoints;
    const { error: deductErr } = await adminSupabase
      .from("profiles")
      .update({ coins_balance: newBalance })
      .eq("id", user.id);

    if (deductErr) {
      throw new Error("Lỗi khi cập nhật số dư Point: " + deductErr.message);
    }

    // 4. Cộng lượt đề cử / like vào tác phẩm
    const { data: story } = await adminSupabase
      .from("stories")
      .select("id, title, total_likes")
      .eq("id", story_id)
      .single();

    const votesAdded = Math.max(1, Math.round(votePoints / 10));
    const currentLikes = story?.total_likes || 0;

    await adminSupabase
      .from("stories")
      .update({ total_likes: currentLikes + votesAdded })
      .eq("id", story_id);

    // 5. Thêm bình luận vinh danh đề cử vào phần comment của truyện
    const voterName = profile.display_name?.trim() || profile.email?.split("@")[0] || "Độc giả VIP";
    const praiseContent = cheer_message?.trim()
      ? `👑 <b>Đề cử ${votePoints.toLocaleString()} Point</b>: "${cheer_message.trim()}"`
      : `👑 <b>Đã buff ${votePoints.toLocaleString()} Point đề cử</b> cho tác phẩm! Chúc truyện ngày càng phát triển rực rỡ!`;

    await adminSupabase.from("comments").insert({
      story_id,
      user_name: voterName,
      avatar_url: profile.avatar_url || null,
      content: praiseContent,
      is_spoiler: false,
      status: "approved",
    });

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      points_voted: votePoints,
      votes_added: votesAdded,
      message: `🎉 Bỏ phiếu đề cử thành công! Bạn đã ủng hộ ${votePoints.toLocaleString()} Point cho tác phẩm.`,
    });
  } catch (err: any) {
    console.error("POST /api/stories/vote error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Lỗi hệ thống khi xử lý đề cử." },
      { status: 500 }
    );
  }
}
