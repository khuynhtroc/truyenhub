import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Lấy thông tin profile
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (pErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng" },
        { status: 404 }
      );
    }

    // 2. Lấy toàn bộ lịch sử giao dịch & nạp xu
    const { data: transactions, error: txErr } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    // 3. Tính toán thống kê tài chính & nạp xu
    const txList = transactions || [];
    let totalRechargedVnd = 0;
    let totalCoinsEarned = 0;
    let totalRechargeTxCount = 0;
    let pendingTxCount = 0;

    for (const tx of txList) {
      const amountVnd = Number(tx.amount_vnd || 0);
      const coinsAdded = Number(tx.coins_added || 0);

      if (tx.status === "completed") {
        totalCoinsEarned += coinsAdded;
        if (amountVnd > 0) {
          totalRechargedVnd += amountVnd;
          totalRechargeTxCount++;
        }
      } else if (tx.status === "pending") {
        pendingTxCount++;
      }
    }

    // 4. Lấy thống kê lịch sử đọc
    const { count: readingCount } = await supabase
      .from("reading_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: bookmarkCount } = await supabase
      .from("reading_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_bookmarked", true);

    return NextResponse.json({
      success: true,
      profile,
      stats: {
        totalRechargedVnd,
        totalCoinsEarned,
        totalRechargeTxCount,
        pendingTxCount,
        readingCount: readingCount || 0,
        bookmarkCount: bookmarkCount || 0,
        coinsBalance: profile.coins_balance ?? profile.coins ?? 0,
        vipLevel: profile.vip_level || 0,
        vipUntil: profile.vip_until,
      },
      transactions: txList,
    });
  } catch (error: any) {
    console.error("Lỗi profile-stats API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
