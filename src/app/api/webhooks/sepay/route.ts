import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Tỷ lệ quy đổi VNĐ sang Xu (khớp với bảng giá trên trang /nap-xu)
function calculateCoins(amount: number): number {
  if (amount >= 500000) return Math.floor((amount / 100) * 1.5); // +50% thưởng
  if (amount >= 200000) return Math.floor((amount / 100) * 1.4); // +40% thưởng
  if (amount >= 100000) return Math.floor((amount / 100) * 1.3); // +30% thưởng
  if (amount >= 50000) return Math.floor((amount / 100) * 1.2);  // +20% thưởng
  if (amount >= 20000) return Math.floor((amount / 100) * 1.1);  // +10% thưởng
  return Math.floor(amount / 100); // 10.000 VNĐ = 100 Xu
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const body = await req.json();

    // Xác thực SePay API Key (nếu có cấu hình trong biến môi trường)
    const sepayApiKey = process.env.SEPAY_API_KEY || "DQ26QEL4BX1QURGLRIKGTAACZNCFJPSBAII7L96DWYFCBREO5GE3WKQYEDGYUURP";
    if (sepayApiKey) {
      const authHeader = req.headers.get("authorization") || "";
      const expectedApiKey = `Apikey ${sepayApiKey}`;
      const expectedBearer = `Bearer ${sepayApiKey}`;
      if (
        authHeader &&
        authHeader !== expectedApiKey &&
        authHeader !== expectedBearer &&
        !authHeader.includes(sepayApiKey)
      ) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // SePay Webhook payload format:
    // {
    //   "id": 92704,
    //   "gateway": "VPBank",
    //   "transactionDate": "2026-10-27 11:00:00",
    //   "accountNumber": "10011918888",
    //   "code": null,
    //   "content": "NAPXU 4D44529E",
    //   "transferType": "in",
    //   "transferAmount": 50000,
    //   "accumulated": 1050000,
    //   "subAccount": null,
    //   "referenceCode": "FT262861234",
    //   "description": "NAPXU 4D44529E"
    // }

    const transferType = (body.transferType || "in").toLowerCase();
    if (transferType !== "in" && body.amount_out && Number(body.amount_out) > 0) {
      return NextResponse.json({ message: "Bỏ qua giao dịch tiền ra (transferType != in)" }, { status: 200 });
    }

    const amount = Number(body.transferAmount || body.amount_in || body.amount || 0);
    if (amount <= 0) {
      return NextResponse.json({ message: "Số tiền không hợp lệ" }, { status: 400 });
    }

    const rawContent = (body.content || body.transaction_content || body.description || "").trim().toUpperCase();
    const transactionRef = String(body.referenceCode || body.reference_number || body.id || `SEPAY_${Date.now()}`);

    // 1. Kiểm tra xem mã giao dịch đã từng xử lý chưa (Idempotency)
    const { data: existingTx } = await supabaseAdmin
      .from("coin_transactions")
      .select("id")
      .eq("order_code", transactionRef)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ success: true, message: "Giao dịch đã được ghi nhận trước đó" }, { status: 200 });
    }

    // 2. Tìm mã định danh người dùng trong nội dung chuyển khoản
    let targetUser = null;

    // Pattern 1: NAPXU <MÃ> hoặc NAP XU <MÃ>
    const match = rawContent.match(/(?:NAP\s*XU|NAPXU)\s*([A-Z0-9-]+)/i);
    let identifier = match ? match[1].trim() : "";

    // Nếu không khớp regex NAPXU, tìm chuỗi 8 ký tự hex bất kỳ trong nội dung chuyển khoản
    if (!identifier) {
      const hexMatch = rawContent.match(/\b([A-F0-9]{8})\b/i);
      if (hexMatch) {
        identifier = hexMatch[1].trim();
      }
    }

    if (identifier) {
      const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      if (isFullUuid) {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("id, coins_balance, email, display_name")
          .eq("id", identifier)
          .maybeSingle();
        targetUser = data;
      } else if (/^[0-9a-f]{8}$/i.test(identifier)) {
        const lower = identifier.toLowerCase();
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("id, coins_balance, email, display_name")
          .gte("id", `${lower}-0000-0000-0000-000000000000`)
          .lt("id", `${lower}-ffff-ffff-ffff-ffffffffffff`)
          .limit(1);
        if (data && data.length > 0) {
          targetUser = data[0];
        }
      }

      // Thử tìm theo email nếu chưa thấy
      if (!targetUser) {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("id, coins_balance, email, display_name")
          .ilike("email", `%${identifier}%`)
          .limit(1);
        if (data && data.length > 0) {
          targetUser = data[0];
        }
      }
    }

    // 3. Nếu không tìm được user, thông báo đến Telegram để Admin kiểm tra tay
    if (!targetUser) {
      console.warn("SePay Webhook: Không tìm thấy user với nội dung:", rawContent);
      await sendTelegramAlert(
        `⚠️ <b>[DocTruyen.vip] NHẬN TIỀN CHƯA RÕ USER (SEPAY)</b>\n` +
        `💰 <b>Số tiền:</b> ${amount.toLocaleString("vi-VN")} VNĐ\n` +
        `📝 <b>Nội dung CK:</b> <code>${rawContent}</code>\n` +
        `🆔 <b>Mã SePay:</b> <code>${transactionRef}</code>\n` +
        `👉 <i>Vui lòng vào Supabase đối chiếu và cộng xu thủ công cho độc giả.</i>`
      );
      return NextResponse.json({ success: true, message: "Không tìm thấy user, đã cảnh báo Telegram" }, { status: 200 });
    }

    // 4. Tính toán số xu và cộng vào tài khoản
    const coinsToAdd = calculateCoins(amount);
    const newBalance = (targetUser.coins_balance || 0) + coinsToAdd;

    // Ghi log giao dịch
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: targetUser.id,
      amount_vnd: amount,
      coins_added: coinsToAdd,
      order_code: transactionRef,
      status: "completed",
    });

    // Cập nhật số dư xu
    await supabaseAdmin
      .from("profiles")
      .update({ coins_balance: newBalance })
      .eq("id", targetUser.id);

    // 5. Bắn thông báo Telegram tự động cho Admin
    const formattedAmount = amount.toLocaleString("vi-VN") + " VNĐ";
    await sendTelegramAlert(
      `🎉 <b>[DocTruyen.vip] SEPAY TỰ ĐỘNG CỘNG XU THÀNH CÔNG!</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Thành viên:</b> ${targetUser.display_name || "Độc giả"} (<code>${targetUser.email || targetUser.id.slice(0, 8)}</code>)\n` +
      `💰 <b>Số tiền nạp:</b> <b>${formattedAmount}</b>\n` +
      `🪙 <b>Xu cộng:</b> <b>+${coinsToAdd} Xu</b> (Số dư mới: <b>${newBalance} Xu</b>)\n` +
      `🏦 <b>Ngân hàng:</b> ${body.gateway || "VPBank 10011918888"}\n` +
      `📝 <b>Nội dung CK:</b> <code>${rawContent}</code>\n` +
      `⚡ <i>Tài khoản đã được cộng xu tự động trong 2 giây!</i>`
    );

    return NextResponse.json({
      success: true,
      message: `Đã tự động cộng ${coinsToAdd} xu cho tài khoản`,
      coins_added: coinsToAdd,
      new_balance: newBalance,
    });
  } catch (error: any) {
    console.error("SePay Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function sendTelegramAlert(htmlText: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8612893214";

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram alert:", err);
  }
}
