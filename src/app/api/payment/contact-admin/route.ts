import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      userName,
      userPhone,
      amount,
      transferCode,
      bankName,
      message,
    } = body;

    const trimmedMsg = (message || "").trim();
    if (!trimmedMsg) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập nội dung cần hỗ trợ hoặc phản ánh." },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    let targetUserId = userId;
    let targetEmail = userEmail ? String(userEmail).trim() : "";
    let targetName = userName || "";

    // Tra cứu profile nếu có userId hoặc email
    let userProfile: any = null;
    if (targetUserId) {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, coins_balance")
        .eq("id", targetUserId)
        .maybeSingle();
      userProfile = data;
    } else if (targetEmail) {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, coins_balance")
        .ilike("email", targetEmail)
        .maybeSingle();
      userProfile = data;
      if (data) {
        targetUserId = data.id;
      }
    }

    if (userProfile) {
      targetEmail = userProfile.email || targetEmail;
      targetName = userProfile.display_name || targetName;
    }

    if (!targetEmail && !targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng cung cấp Email tài khoản của bạn để Admin đối chiếu và phản hồi.",
        },
        { status: 400 }
      );
    }

    // Soạn tin nhắn Telegram
    const nowStr = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const formattedAmount =
      amount && Number(amount) > 0 ? Number(amount).toLocaleString("vi-VN") + " VNĐ" : "Chưa rõ";

    const msgLines = [
      `🆘 <b>[DocTruyen.vip] YÊU CẦU HỖ TRỢ / CHƯA NHẬN ĐƯỢC XU</b>`,
      `⏱ <i>Thời gian gửi: ${nowStr}</i>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Thành viên:</b> ${targetName || "Độc giả"} (<code>${targetEmail || "Không rõ email"}</code>)`,
    ];

    if (targetUserId) {
      msgLines.push(`🆔 <b>User ID:</b> <code>${targetUserId}</code>`);
    }

    if (userProfile?.coins_balance !== undefined) {
      msgLines.push(`🪙 <b>Số dư hiện tại:</b> <b>${userProfile.coins_balance} Xu</b>`);
    }

    if (userPhone) {
      msgLines.push(`📞 <b>SĐT / Zalo:</b> <code>${userPhone}</code>`);
    }

    if (amount) {
      msgLines.push(`💰 <b>Số tiền nạp:</b> <b>${formattedAmount}</b>`);
    }

    if (transferCode) {
      msgLines.push(`📝 <b>Nội dung CK:</b> <code>${transferCode}</code>`);
    }

    if (bankName) {
      msgLines.push(`🏦 <b>App Ngân hàng:</b> ${bankName}`);
    }

    msgLines.push(`━━━━━━━━━━━━━━━━━━`);
    msgLines.push(`💬 <b>Lời nhắn của thành viên:</b>`);
    msgLines.push(`<i>"${trimmedMsg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"</i>`);
    msgLines.push(`━━━━━━━━━━━━━━━━━━`);
    if (targetEmail) {
      msgLines.push(`👉 <b>Phản hồi nhanh qua Email:</b> <a href="mailto:${targetEmail}">${targetEmail}</a>`);
    }

    const tgText = msgLines.join("\n");
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN || "8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8612893214";

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: tgText,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        console.error("Lỗi gửi Telegram contact-admin:", data);
      }
    } catch (tgErr) {
      console.error("Lỗi mạng gửi Telegram:", tgErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "Tin nhắn hỗ trợ đã được chuyển tiếp đến bot Telegram của Admin! Admin sẽ kiểm tra và giải quyết cho bạn trong thời gian sớm nhất.",
    });
  } catch (error: any) {
    console.error("contact-admin error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
