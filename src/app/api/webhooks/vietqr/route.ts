import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const body = await req.json();

    // Cấu trúc webhook phổ biến từ PayOS / Casso / SeAPay:
    // {
    //   "code": "00",
    //   "data": {
    //     "orderCode": 1042,
    //     "amount": 50000,
    //     "description": "NAPXU 1042",
    //     "reference": "FT262861234..."
    //   }
    // }

    const data = body.data || body;
    const description = (data.description || "").trim().toUpperCase();
    const amount = Number(data.amount || 0);

    // Tìm mã giao dịch regex: NAPXU <ORDER_CODE hoặc USER_ID>
    const match = description.match(/NAPXU\s+([A-Z0-9-]+)/i);
    if (!match) {
      return NextResponse.json({ message: "Không khớp cú pháp NAPXU, bỏ qua" }, { status: 200 });
    }

    const orderOrUserId = match[1];

    // Quy đổi tỷ lệ: 1.000 VNĐ = 10 Xu (thưởng thêm nếu gói lớn)
    let coinsToAdd = Math.floor(amount / 100);
    if (amount >= 100000) coinsToAdd = Math.floor(coinsToAdd * 1.3); // +30%
    else if (amount >= 50000) coinsToAdd = Math.floor(coinsToAdd * 1.2); // +20%
    else if (amount >= 20000) coinsToAdd = Math.floor(coinsToAdd * 1.1); // +10%

    // 1. Kiểm tra xem mã giao dịch đã từng xử lý chưa (chống cộng tiền lặp lại)
    const transactionCode = data.reference || data.transactionId || `TX_${Date.now()}`;
    const { data: existingTx } = await supabaseAdmin
      .from("coin_transactions")
      .select("id")
      .eq("order_code", transactionCode)
      .single();

    if (existingTx) {
      return NextResponse.json({ message: "Giao dịch đã được xử lý trước đó" }, { status: 200 });
    }

    // 2. Tìm profile người dùng
    let profile: any = null;
    const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderOrUserId);
    if (isFullUuid) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, coins_balance, email, display_name")
        .eq("id", orderOrUserId)
        .maybeSingle();
      profile = data;
    } else if (/^[0-9a-f]{8}$/i.test(orderOrUserId)) {
      const lower = orderOrUserId.toLowerCase();
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, coins_balance, email, display_name")
        .gte("id", `${lower}-0000-0000-0000-000000000000`)
        .lt("id", `${lower}-ffff-ffff-ffff-ffffffffffff`)
        .limit(1);
      if (data && data.length > 0) profile = data[0];
    }

    if (!profile) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, coins_balance, email, display_name")
        .ilike("email", `%${orderOrUserId}%`)
        .limit(1);
      if (data && data.length > 0) profile = data[0];
    }

    if (!profile) {
      return NextResponse.json({ message: "Không tìm thấy user" }, { status: 404 });
    }

    // 3. Ghi log giao dịch và cộng xu
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: profile.id,
      amount_vnd: amount,
      coins_added: coinsToAdd,
      order_code: transactionCode,
      status: "completed",
    });

    await supabaseAdmin
      .from("profiles")
      .update({ coins_balance: profile.coins_balance + coinsToAdd })
      .eq("id", profile.id);

    return NextResponse.json({
      success: true,
      message: `Đã cộng ${coinsToAdd} xu cho tài khoản`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
