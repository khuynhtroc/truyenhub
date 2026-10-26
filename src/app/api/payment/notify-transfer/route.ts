import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      userName,
      amount,
      coins,
      transferCode,
      bankName,
      userNote,
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: "Số tiền không hợp lệ" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    let targetUserId = userId;
    let targetEmail = userEmail;
    let targetName = userName;

    // Nếu chưa có targetUserId nhưng có email, tra cứu profile theo email
    if (!targetUserId && targetEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .ilike("email", String(targetEmail).trim())
        .maybeSingle();

      if (profile) {
        targetUserId = profile.id;
        targetEmail = profile.email;
        targetName = profile.display_name || targetName;
      }
    }

    // Nếu vẫn chưa có targetUserId, báo lỗi yêu cầu đăng nhập/nhập email
    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy tài khoản thành viên. Vui lòng đăng nhập hoặc nhập đúng Email bạn đã đăng ký tài khoản để Admin cộng xu.",
        },
        { status: 400 }
      );
    }

    // Lấy thông tin user chính xác từ profiles
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, email, display_name, coins_balance")
      .eq("id", targetUserId)
      .maybeSingle();

    if (currentProfile) {
      targetEmail = currentProfile.email || targetEmail;
      targetName = currentProfile.display_name || targetName;
    }

    const coinsToAdd = Number(coins) > 0 ? Number(coins) : Math.floor(numAmount / 100);
    const cleanedCode = (transferCode || "NAPXU").trim();
    const shortUid = targetUserId ? String(targetUserId).slice(0, 8).toUpperCase() : "MEMBER";
    const orderCode = `TRANSFER_${shortUid}_${Date.now()}`;

    // 1. Tạo bản ghi trạng thái 'pending' vào bảng coin_transactions
    const { data: tx, error: txError } = await supabase
      .from("coin_transactions")
      .insert({
        user_id: targetUserId,
        amount_vnd: numAmount,
        coins_added: coinsToAdd,
        order_code: orderCode,
        status: "pending",
      })
      .select()
      .single();

    if (txError || !tx) {
      console.error("Lỗi insert coin_transactions:", txError);
      return NextResponse.json(
        { success: false, error: "Không thể tạo bản ghi giao dịch chờ duyệt." },
        { status: 500 }
      );
    }

    // 2. Tạo chữ ký HMAC an toàn cho link duyệt 1-click
    const secret =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "truyenvip_payment_secret_2026";
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${tx.id}:${targetUserId}:${coinsToAdd}`)
      .digest("hex");

    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "doctruyen.vip";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const approveUrl = `${baseUrl}/api/admin/approve-deposit?tx_id=${tx.id}&sig=${sig}`;
    const rejectUrl = `${baseUrl}/api/admin/approve-deposit?action=reject&tx_id=${tx.id}&sig=${sig}`;

    // 3. Soạn tin nhắn gửi tới Telegram bot truyenvip
    const nowStr = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const formattedAmount = numAmount.toLocaleString("vi-VN") + " VNĐ";

    const msgLines = [
      `🔔 <b>[DocTruyen.vip] XÁC NHẬN CHUYỂN KHOẢN NẠP XU</b>`,
      `⏱ <i>Thời gian: ${nowStr}</i>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Thành viên:</b> ${targetName || "Độc giả"} (<code>${targetEmail || "Không rõ email"}</code>)`,
      `🆔 <b>User ID:</b> <code>${targetUserId}</code>`,
      `💰 <b>Số tiền nạp:</b> <b>${formattedAmount}</b>`,
      `🪙 <b>Xu quy đổi:</b> <b>+${coinsToAdd} Xu</b> (Số dư hiện tại: ${currentProfile?.coins_balance ?? 0} Xu)`,
      `📝 <b>Nội dung CK:</b> <code>${cleanedCode}</code>`,
      `🏦 <b>App Ngân hàng:</b> ${bankName || "VPBank / Chuyển khoản nhanh"}`,
    ];

    if (userNote) {
      msgLines.push(`💬 <b>Mã GD / Lời nhắn:</b> <code>${userNote}</code>`);
    }

    msgLines.push(`━━━━━━━━━━━━━━━━━━`);
    msgLines.push(`👉 <b>Admin đối chiếu App VPBank và duyệt 1-Click:</b>`);
    msgLines.push(`⚡ <a href="${approveUrl}"><b>[ BẤM ĐỂ DUYỆT CỘNG ${coinsToAdd} XU NGAY ]</b></a>`);
    msgLines.push(`❌ <a href="${rejectUrl}">[ Từ chối / Huỷ yêu cầu ]</a>`);

    const tgText = msgLines.join("\n");
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN || "8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8612893214";

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: tgText,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) {
        console.error("Lỗi Telegram API:", tgData);
      }
    } catch (tgErr) {
      console.error("Lỗi gửi Telegram notify:", tgErr);
    }

    return NextResponse.json({
      success: true,
      message: "Đã gửi thông báo xác nhận chuyển khoản đến Admin qua Telegram thành công!",
      tx_id: tx.id,
      coins: coinsToAdd,
    });
  } catch (error: any) {
    console.error("notify-transfer error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
