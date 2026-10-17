import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { VIP_PACKAGES, VIP_TIERS } from "@/lib/vip";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để nâng cấp gói VIP" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const packageId = body.package_id;

    const pkg = VIP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: "Gói VIP không hợp lệ hoặc đã ngừng cung cấp" },
        { status: 400 }
      );
    }

    // 2. Fetch user profile
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("id, coins_balance, vip_level, vip_until")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ người dùng" },
        { status: 404 }
      );
    }

    const currentCoins = Number(profile.coins_balance || 0);
    if (currentCoins < pkg.priceCoins) {
      return NextResponse.json(
        {
          error: `Số dư xu không đủ. Bạn đang có ${currentCoins} Xu, cần thêm ${pkg.priceCoins - currentCoins} Xu để đăng ký gói ${pkg.name}.`,
          shortfall: pkg.priceCoins - currentCoins,
          current_balance: currentCoins,
          required_coins: pkg.priceCoins,
        },
        { status: 400 }
      );
    }

    // 3. Calculate new VIP expiry & level
    const currentExp = profile.vip_until ? new Date(profile.vip_until).getTime() : 0;
    const baseTime = currentExp > Date.now() ? currentExp : Date.now();
    const newVipUntil = new Date(baseTime + pkg.durationDays * 86400000).toISOString();
    const newVipLevel = Math.max(Number(profile.vip_level || 0), pkg.tierLevel);
    const newBalance = currentCoins - pkg.priceCoins;

    // 4. Update profile
    const { error: updateErr } = await adminSupabase
      .from("profiles")
      .update({
        coins_balance: newBalance,
        vip_level: newVipLevel,
        vip_until: newVipUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // 5. Record coin transaction
    try {
      await adminSupabase.from("coin_transactions").insert({
        user_id: user.id,
        amount_vnd: pkg.priceVnd,
        coins_added: -pkg.priceCoins,
        order_code: `VIP_${pkg.id.toUpperCase()}_${Date.now()}`,
        status: "completed",
      });
    } catch (e) {
      console.warn("Could not log coin_transactions for VIP subscription:", e);
    }

    const tierInfo = VIP_TIERS[newVipLevel] || VIP_TIERS[1];
    const expiryDateStr = new Date(newVipUntil).toLocaleDateString("vi-VN");

    return NextResponse.json({
      success: true,
      message: `Chúc mừng bạn đã nâng cấp thành công ${tierInfo.name}! Hạn sử dụng đến ngày ${expiryDateStr}.`,
      package_name: pkg.name,
      vip_level: newVipLevel,
      vip_until: newVipUntil,
      new_balance: newBalance,
      tier_info: tierInfo,
    });
  } catch (error: any) {
    console.error("VIP subscribe error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý đăng ký gói VIP" },
      { status: 500 }
    );
  }
}
