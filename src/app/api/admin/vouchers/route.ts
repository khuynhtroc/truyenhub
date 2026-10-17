import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Voucher, VoucherRedemption } from "@/types";

export const dynamic = "force-dynamic";

const VOUCHERS_KEY = "vouchers_system";
const REDEMPTIONS_KEY = "voucher_redemptions";
const CHECKIN_KEY = "daily_checkins";

const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: "voucher-tan-thu",
    code: "TANTHU2026",
    title: "Quà Tặng Tân Thủ - Khởi Đầu Đọc Truyện",
    reward_type: "coins",
    reward_coins: 50,
    max_uses: 10000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "voucher-vip-dong-7ngay",
    code: "VIPDONG7NGAY",
    title: "Tặng 7 Ngày VIP Đồng (Trải nghiệm đọc miễn phí VIP 1)",
    reward_type: "vip",
    reward_coins: 20,
    reward_vip_days: 7,
    reward_vip_level: 1,
    max_uses: 5000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "voucher-truyenhub-vip",
    code: "TRUYENHUBVIP",
    title: "Tri Ân Độc Giả Thân Thiết DocTruyen.vip (100 Xu + 14 Ngày VIP 2)",
    reward_type: "both",
    reward_coins: 100,
    reward_vip_days: 14,
    reward_vip_level: 2,
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
    reward_type: "coins",
    reward_coins: 30,
    max_uses: 10000,
    used_count: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Get vouchers
    const { data: vData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", VOUCHERS_KEY)
      .single();

    let vouchers: Voucher[] = (vData?.value as Voucher[]) || DEFAULT_VOUCHERS;
    if (!vData?.value) {
      await supabase.from("settings").upsert({
        key: VOUCHERS_KEY,
        value: DEFAULT_VOUCHERS,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Get redemptions
    const { data: rData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", REDEMPTIONS_KEY)
      .single();

    const redemptions: VoucherRedemption[] = (rData?.value as VoucherRedemption[]) || [];

    // 3. Get checkins
    const { data: cData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", CHECKIN_KEY)
      .single();

    const checkins: any[] = (cData?.value as any[]) || [];

    // Calculate stats
    const totalCoinsVouchers = redemptions.reduce((acc, r) => acc + (r.reward_coins || 0), 0);
    const totalCoinsCheckins = checkins.reduce((acc, c) => acc + (c.reward_coins || 0), 0);
    const vipVouchersCount = vouchers.filter((v) => v.reward_type === "vip" || v.reward_type === "both" || (v.reward_vip_days || 0) > 0).length;

    const stats = {
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter((v) => v.is_active).length,
      vipVouchersCount,
      totalRedemptions: redemptions.length,
      totalCheckins: checkins.length,
      totalCoinsAwarded: totalCoinsVouchers + totalCoinsCheckins,
      totalCoinsFromVouchers: totalCoinsVouchers,
      totalCoinsFromCheckins: totalCoinsCheckins,
    };

    return NextResponse.json({
      success: true,
      vouchers,
      redemptions: redemptions.slice(-50).reverse(), // Last 50 redemptions
      stats,
    });
  } catch (error: any) {
    console.error("Admin vouchers GET error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tải danh sách voucher" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await req.json();

    // Load existing vouchers
    const { data: vData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", VOUCHERS_KEY)
      .single();

    let vouchers: Voucher[] = (vData?.value as Voucher[]) || DEFAULT_VOUCHERS;

    // ACTION: BATCH GIVEAWAY GENERATOR
    if (body.action === "batch_giveaway") {
      const count = Math.min(100, Math.max(1, parseInt(body.count || 10, 10)));
      const rawPrefix = (body.prefix || "GIVEAWAY").toString().trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      const prefix = rawPrefix || "GIVEAWAY";
      const vipLevel = Math.min(4, Math.max(1, parseInt(body.reward_vip_level || 2, 10)));
      const vipDays = Math.max(1, parseInt(body.reward_vip_days || 7, 10));
      const coins = Math.max(0, parseInt(body.reward_coins || 0, 10));
      const maxUses = Math.max(1, parseInt(body.max_uses || 1, 10));
      const campaignTitle = (body.campaign_title || `Chương trình Give Away VIP ${vipLevel} (${vipDays} ngày)`).toString().trim();
      const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null;

      const generatedCodes: string[] = [];
      const newVouchers: Voucher[] = [];

      for (let i = 0; i < count; i++) {
        // Generate random 5-char alphanumeric suffix
        let suffix = "";
        const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude ambiguous 0, O, 1, I
        for (let c = 0; c < 5; c++) {
          suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        let codeCandidate = `${prefix}-${suffix}`;
        // Ensure uniqueness
        while (vouchers.some((v) => v.code === codeCandidate) || generatedCodes.includes(codeCandidate)) {
          suffix = "";
          for (let c = 0; c < 5; c++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          codeCandidate = `${prefix}-${suffix}`;
        }

        generatedCodes.push(codeCandidate);

        const vItem: Voucher = {
          id: `ga_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          code: codeCandidate,
          title: campaignTitle,
          reward_type: coins > 0 ? "both" : "vip",
          reward_coins: coins,
          reward_vip_days: vipDays,
          reward_vip_level: vipLevel,
          max_uses: maxUses,
          used_count: 0,
          expires_at: expiresAt,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        newVouchers.push(vItem);
      }

      vouchers = [...newVouchers, ...vouchers];

      const { error: saveErr } = await supabase.from("settings").upsert({
        key: VOUCHERS_KEY,
        value: vouchers,
        updated_at: new Date().toISOString(),
      });

      if (saveErr) throw saveErr;

      return NextResponse.json({
        success: true,
        message: `Đã tạo thành công ${count} mã Give Away VIP ${vipLevel} (${vipDays} ngày)!`,
        created_codes: generatedCodes,
        vouchers: newVouchers,
      });
    }

    // NORMAL SINGLE VOUCHER CREATION
    const code = (body.code || "").toString().trim().toUpperCase();
    const title = (body.title || "").toString().trim();
    const rewardType = (body.reward_type || "coins") as "coins" | "vip" | "both";
    const rewardCoins = Number(body.reward_coins || 0);
    const rewardVipDays = Number(body.reward_vip_days || 0);
    const rewardVipLevel = Number(body.reward_vip_level || (rewardVipDays > 0 ? 1 : 0));
    const maxUses = Number(body.max_uses ?? 100);
    const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null;
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

    if (!code) {
      return NextResponse.json({ error: "Mã code không được để trống" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Tiêu đề không được để trống" }, { status: 400 });
    }
    if (rewardCoins <= 0 && rewardVipDays <= 0) {
      return NextResponse.json({ error: "Vui lòng nhập số Xu thưởng hoặc số ngày kích hoạt VIP" }, { status: 400 });
    }

    // Check duplicate code
    if (vouchers.some((v) => v.code.toUpperCase() === code)) {
      return NextResponse.json(
        { error: `Mã code "${code}" đã tồn tại. Vui lòng chọn mã khác.` },
        { status: 400 }
      );
    }

    const newVoucher: Voucher = {
      id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      title,
      reward_type: rewardType,
      reward_coins: rewardCoins,
      reward_vip_days: rewardVipDays > 0 ? rewardVipDays : undefined,
      reward_vip_level: rewardVipDays > 0 ? rewardVipLevel : undefined,
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt,
      is_active: isActive,
      created_at: new Date().toISOString(),
    };

    vouchers.unshift(newVoucher);

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: VOUCHERS_KEY,
      value: vouchers,
      updated_at: new Date().toISOString(),
    });

    if (saveErr) throw saveErr;

    return NextResponse.json({
      success: true,
      message: `Đã tạo mã voucher "${code}" thành công!`,
      voucher: newVoucher,
    });
  } catch (error: any) {
    console.error("Admin vouchers POST error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tạo voucher" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await req.json();

    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "Thiếu ID voucher cần cập nhật" }, { status: 400 });
    }

    const { data: vData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", VOUCHERS_KEY)
      .single();

    let vouchers: Voucher[] = (vData?.value as Voucher[]) || [];
    const index = vouchers.findIndex((v) => v.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Không tìm thấy voucher" }, { status: 404 });
    }

    // Update fields if provided
    if (body.title !== undefined) vouchers[index].title = body.title.toString().trim();
    if (body.reward_type !== undefined) vouchers[index].reward_type = body.reward_type;
    if (body.reward_coins !== undefined) vouchers[index].reward_coins = Number(body.reward_coins);
    if (body.reward_vip_days !== undefined) vouchers[index].reward_vip_days = Number(body.reward_vip_days);
    if (body.reward_vip_level !== undefined) vouchers[index].reward_vip_level = Number(body.reward_vip_level);
    if (body.max_uses !== undefined) vouchers[index].max_uses = Number(body.max_uses);
    if (body.expires_at !== undefined) {
      vouchers[index].expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;
    }
    if (body.is_active !== undefined) vouchers[index].is_active = Boolean(body.is_active);

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: VOUCHERS_KEY,
      value: vouchers,
      updated_at: new Date().toISOString(),
    });

    if (saveErr) throw saveErr;

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật voucher thành công!",
      voucher: vouchers[index],
    });
  } catch (error: any) {
    console.error("Admin vouchers PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi cập nhật voucher" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID voucher cần xóa" }, { status: 400 });
    }

    const { data: vData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", VOUCHERS_KEY)
      .single();

    let vouchers: Voucher[] = (vData?.value as Voucher[]) || [];
    vouchers = vouchers.filter((v) => v.id !== id);

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: VOUCHERS_KEY,
      value: vouchers,
      updated_at: new Date().toISOString(),
    });

    if (saveErr) throw saveErr;

    return NextResponse.json({
      success: true,
      message: "Đã xóa voucher thành công!",
    });
  } catch (error: any) {
    console.error("Admin vouchers DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xóa voucher" },
      { status: 500 }
    );
  }
}
