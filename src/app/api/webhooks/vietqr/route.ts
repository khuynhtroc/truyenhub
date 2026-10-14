import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0";

// Khởi tạo Supabase Admin Client với Service Role Key để cập nhật balance người dùng an toàn
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_KEY
);

export async function POST(req: NextRequest) {
  try {
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
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, coins_balance")
      .or(`id.eq.${orderOrUserId},email.ilike.%${orderOrUserId}%`)
      .single();

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
