import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txId = searchParams.get("tx_id");
  const sig = searchParams.get("sig");
  const action = searchParams.get("action"); // 'reject' or undefined

  if (!txId || !sig) {
    return new NextResponse(
      renderHtml("Lỗi Xác Thực", "Thiếu tham số giao dịch hoặc chữ ký bảo mật.", false),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch transaction
  const { data: tx, error: fetchErr } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("id", txId)
    .single();

  if (fetchErr || !tx) {
    return new NextResponse(
      renderHtml("Không Tìm Thấy Giao Dịch", "Mã giao dịch này không tồn tại trong hệ thống.", false),
      {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // 2. Validate HMAC signature
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.TELEGRAM_BOT_TOKEN ||
    "truyenvip_payment_secret_2026";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${tx.id}:${tx.user_id}:${tx.coins_added}`)
    .digest("hex");

  if (sig !== expectedSig) {
    return new NextResponse(
      renderHtml("Chữ Ký Không Hợp Lệ", "Chữ ký bảo mật không chính xác. Yêu cầu đã bị chặn.", false),
      {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN || "8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM";
  const chatId = process.env.TELEGRAM_CHAT_ID || "8612893214";

  // 3. Handle Already Completed
  if (tx.status === "completed") {
    return new NextResponse(
      renderHtml(
        "Giao Dịch Đã Được Duyệt",
        `Giao dịch này đã được duyệt cộng <b>+${tx.coins_added} Xu</b> trước đó rồi.<br/>Không thực hiện lại để tránh cộng trùng lặp xu cho thành viên.`,
        true
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 4. Handle Already Cancelled
  if (tx.status === "cancelled") {
    return new NextResponse(
      renderHtml(
        "Giao Dịch Đã Bị Huỷ",
        "Giao dịch này trước đó đã được đánh dấu là từ chối hoặc đã huỷ.",
        false
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 5. Handle Reject Action
  if (action === "reject") {
    await supabase.from("coin_transactions").update({ status: "cancelled" }).eq("id", tx.id);

    try {
      const rejectMsg = [
        `❌ <b>[ĐÃ TỪ CHỐI] YÊU CẦU NẠP XU ĐÃ BỊ HUỶ</b>`,
        `━━━━━━━━━━━━━━━━━━`,
        `💰 Số tiền: ${Number(tx.amount_vnd).toLocaleString("vi-VN")} VNĐ (${tx.coins_added} Xu)`,
        `🆔 Transaction ID: <code>${tx.id}</code>`,
        `👤 User ID: <code>${tx.user_id}</code>`,
        `⏱ <i>Thời gian xử lý: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</i>`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: rejectMsg, parse_mode: "HTML" }),
      });
    } catch (e) {
      console.error(e);
    }

    return new NextResponse(
      renderHtml(
        "Đã Từ Chối Giao Dịch",
        `Đã huỷ yêu cầu nạp ${Number(tx.amount_vnd).toLocaleString("vi-VN")} VNĐ (${tx.coins_added} Xu) của thành viên.`,
        false
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 6. Handle Approval Action: Credit Coins
  const { data: userProfile, error: uErr } = await supabase
    .from("profiles")
    .select("id, email, display_name, coins_balance")
    .eq("id", tx.user_id)
    .single();

  if (uErr || !userProfile) {
    return new NextResponse(
      renderHtml("Lỗi Người Dùng", "Không tìm thấy thông tin profile của thành viên tương ứng.", false),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const oldBalance = userProfile.coins_balance || 0;
  const newBalance = oldBalance + tx.coins_added;

  // Cập nhật số dư xu trong profiles
  await supabase
    .from("profiles")
    .update({
      coins_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userProfile.id);

  // Đổi trạng thái giao dịch sang 'completed'
  await supabase
    .from("coin_transactions")
    .update({
      status: "completed",
    })
    .eq("id", tx.id);

  // Báo lại kết quả duyệt thành công vào Telegram bot truyenvip
  try {
    const successTg = [
      `🎉 <b>[DUYỆT THÀNH CÔNG] ĐÃ CỘNG XU CHO THÀNH VIÊN!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Thành viên:</b> ${userProfile.display_name || "Độc giả"} (<code>${userProfile.email}</code>)`,
      `🪙 <b>Xu cộng thêm:</b> <b>+${tx.coins_added} Xu</b>`,
      `💰 <b>Số tiền:</b> ${Number(tx.amount_vnd).toLocaleString("vi-VN")} VNĐ`,
      `💳 <b>Số dư mới:</b> <b>${newBalance} Xu</b> (trước đó: ${oldBalance} Xu)`,
      `⏱ <i>Thời gian duyệt: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</i>`,
    ].join("\n");

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: successTg, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("Lỗi gửi xác nhận TG:", err);
  }

  return new NextResponse(
    renderHtml(
      "Duyệt Nạp Xu Thành Công!",
      `Đã cộng <b>+${tx.coins_added} Xu</b> cho tài khoản <b>${userProfile.email}</b>.<br/><br/>` +
        `Số dư cũ: <b>${oldBalance} Xu</b> &rarr; Số dư mới: <b style="color: #10b981; font-size: 1.3rem;">${newBalance} Xu</b>.<br/><br/>` +
        `<span style="color: #a7f3d0;">✓ Thông báo duyệt thành công đã được gửi về bot Telegram <b>truyenvip</b>.</span>`,
      true
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function renderHtml(title: string, message: string, isSuccess: boolean) {
  const bg = isSuccess ? "#059669" : "#dc2626";
  const icon = isSuccess ? "✓" : "!";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - DocTruyen.vip Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #151e2e; border: 1px solid #1e293b; border-radius: 28px; padding: 36px 28px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
    .badge { width: 68px; height: 68px; border-radius: 50%; background: ${bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; margin: 0 auto 20px; box-shadow: 0 0 30px ${bg}66; }
    h1 { font-size: 22px; font-weight: 900; margin: 0 0 14px; letter-spacing: -0.02em; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 28px; }
    a.btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #f43f5e, #e11d48); color: white; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 8px 16px -4px rgba(225,29,72,0.4); transition: transform 0.2s, opacity 0.2s; }
    a.btn:hover { opacity: 0.95; transform: scale(1.02); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://doctruyen.vip" class="btn">Về Trang Chủ ĐọcTruyện.VIP</a>
  </div>
</body>
</html>`;
}
