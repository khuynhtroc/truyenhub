import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Voucher, VoucherRedemption } from "@/types";

export const dynamic = "force-dynamic";

const VOUCHERS_KEY = "vouchers_system";
const REDEMPTIONS_KEY = "voucher_redemptions";

const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: "voucher-tan-thu",
    code: "TANTHU2026",
    title: "Quà Tặng Tân Thủ - Khởi Đầu Đọc Truyện",
    reward_coins: 50,
    max_uses: 10000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "voucher-truyenhub-vip",
    code: "TRUYENHUBVIP",
    title: "Tri Ân Độc Giả Thân Thiết DocTruyen.vip",
    reward_coins: 100,
    max_uses: 5000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "voucher-tich-diem",
    code: "TICHDIEM2026",
    title: "Mừng Ra Mắt Tính Năng Điểm Danh & Tích Xu",
    reward_coins: 30,
    max_uses: 10000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

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
        { error: "Vui lòng đăng nhập để sử dụng mã voucher quà tặng." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawCode = (body.code || "").toString().trim();

    if (!rawCode) {
      return NextResponse.json(
        { error: "Vui lòng nhập mã voucher." },
        { status: 400 }
      );
    }

    const code = rawCode.toUpperCase();

    // 2. Load vouchers from settings
    const { data: vSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", VOUCHERS_KEY)
      .single();

    let vouchers: Voucher[] = (vSettings?.value as Voucher[]) || DEFAULT_VOUCHERS;
    if (!vSettings?.value) {
      // Seed default vouchers if not yet stored
      await adminSupabase.from("settings").upsert({
        key: VOUCHERS_KEY,
        value: DEFAULT_VOUCHERS,
        updated_at: new Date().toISOString(),
      });
    }

    // 3. Find matching voucher
    const voucherIndex = vouchers.findIndex(
      (v) => v.code.toUpperCase() === code
    );

    if (voucherIndex === -1) {
      return NextResponse.json(
        { error: "Mã voucher không tồn tại. Vui lòng kiểm tra lại chính xác từng ký tự." },
        { status: 404 }
      );
    }

    const voucher = vouchers[voucherIndex];

    // Check active status
    if (!voucher.is_active) {
      return NextResponse.json(
        { error: "Mã voucher này hiện đang tạm dừng kích hoạt." },
        { status: 400 }
      );
    }

    // Check expiration
    if (voucher.expires_at) {
      const expDate = new Date(voucher.expires_at);
      if (expDate.getTime() < Date.now()) {
        return NextResponse.json(
          { error: "Mã voucher này đã hết thời hạn sử dụng." },
          { status: 400 }
        );
      }
    }

    // Check usage limit
    if (voucher.max_uses > 0 && voucher.used_count >= voucher.max_uses) {
      return NextResponse.json(
        { error: "Mã voucher này đã hết lượt sử dụng." },
        { status: 400 }
      );
    }

    // 4. Check if user has already redeemed this voucher
    const { data: rSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", REDEMPTIONS_KEY)
      .single();

    const redemptions: VoucherRedemption[] = (rSettings?.value as VoucherRedemption[]) || [];
    const alreadyRedeemed = redemptions.some(
      (r) => r.voucher_code.toUpperCase() === code && r.user_id === user.id
    );

    if (alreadyRedeemed) {
      return NextResponse.json(
        { error: "Bạn đã đổi mã voucher này rồi! Mỗi tài khoản chỉ được nhận 1 lần." },
        { status: 400 }
      );
    }

    // 5. Fetch user profile
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("id, coins_balance, vip_level, vip_until")
      .eq("id", user.id)
      .single();

    if (profileErr && profileErr.code !== "PGRST116") {
      throw profileErr;
    }

    const currentCoins = Number(profile?.coins_balance || 0);
    const rewardCoins = Number(voucher.reward_coins || 0);
    const newCoins = currentCoins + rewardCoins;

    // Handle VIP rewards
    const rewardVipDays = Number(voucher.reward_vip_days || 0);
    const rewardVipLevel = Number(voucher.reward_vip_level || (rewardVipDays > 0 ? 1 : 0));
    let newVipUntil = profile?.vip_until || null;
    let newVipLevel = Number(profile?.vip_level || 0);

    if (rewardVipDays > 0) {
      const currentExp = profile?.vip_until ? new Date(profile.vip_until).getTime() : 0;
      const baseTime = currentExp > Date.now() ? currentExp : Date.now();
      newVipUntil = new Date(baseTime + rewardVipDays * 86400000).toISOString();
      newVipLevel = Math.max(newVipLevel, rewardVipLevel || 1);
    }

    // 6. Update user profile (coins + VIP)
    if (profile) {
      const updatePayload: Record<string, any> = {
        coins_balance: newCoins,
        updated_at: new Date().toISOString(),
      };
      if (rewardVipDays > 0) {
        updatePayload.vip_level = newVipLevel;
        updatePayload.vip_until = newVipUntil;
      }
      await adminSupabase.from("profiles").update(updatePayload).eq("id", user.id);
    } else {
      await adminSupabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        coins_balance: newCoins,
        vip_level: newVipLevel > 0 ? newVipLevel : 0,
        vip_until: newVipUntil,
      });
    }

    // 7. Update voucher used count
    vouchers[voucherIndex].used_count = (vouchers[voucherIndex].used_count || 0) + 1;
    await adminSupabase.from("settings").upsert({
      key: VOUCHERS_KEY,
      value: vouchers,
      updated_at: new Date().toISOString(),
    });

    // 8. Record redemption log
    const newRedemption: VoucherRedemption = {
      id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      voucher_code: code,
      user_id: user.id,
      user_email: user.email || "",
      reward_coins: rewardCoins,
      reward_vip_days: rewardVipDays > 0 ? rewardVipDays : undefined,
      reward_vip_level: rewardVipDays > 0 ? newVipLevel : undefined,
      created_at: new Date().toISOString(),
    };
    redemptions.push(newRedemption);
    await adminSupabase.from("settings").upsert({
      key: REDEMPTIONS_KEY,
      value: redemptions,
      updated_at: new Date().toISOString(),
    });

    // 9. Record transaction in coin_transactions if coins were added
    if (rewardCoins > 0) {
      try {
        await adminSupabase.from("coin_transactions").insert({
          user_id: user.id,
          amount_vnd: 0,
          coins_added: rewardCoins,
          order_code: `VOUCHER_${code}_${Date.now()}`,
          status: "completed",
        });
      } catch (e) {
        console.warn("Could not log coin_transactions:", e);
      }
    }

    // Build success message
    let successMessage = `Đổi mã thành công!`;
    const parts: string[] = [];
    if (rewardCoins > 0) {
      parts.push(`+${rewardCoins} Xu`);
    }
    if (rewardVipDays > 0 && newVipUntil) {
      const expDateStr = new Date(newVipUntil).toLocaleDateString("vi-VN");
      parts.push(`Kích hoạt VIP ${newVipLevel} trong ${rewardVipDays} ngày (hạn đến ${expDateStr})`);
    }
    if (parts.length > 0) {
      successMessage += ` Bạn nhận được ${parts.join(" & ")}.`;
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      reward_coins: rewardCoins,
      reward_vip_days: rewardVipDays,
      reward_vip_level: newVipLevel,
      vip_until: newVipUntil,
      voucher_title: voucher.title,
      new_balance: newCoins,
    });
  } catch (error: any) {
    console.error("Voucher redemption error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý đổi mã voucher." },
      { status: 500 }
    );
  }
}
