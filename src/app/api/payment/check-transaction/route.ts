import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function calculateCoins(amount: number): number {
  if (amount >= 500000) return Math.floor((amount / 100) * 1.5);
  if (amount >= 200000) return Math.floor((amount / 100) * 1.4);
  if (amount >= 100000) return Math.floor((amount / 100) * 1.3);
  if (amount >= 50000) return Math.floor((amount / 100) * 1.2);
  if (amount >= 20000) return Math.floor((amount / 100) * 1.1);
  return Math.floor(amount / 100);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Thiếu userId" }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const token = process.env.SEPAY_API_KEY || "DQ26QEL4BX1QURGLRIKGTAACZNCFJPSBAII7L96DWYFCBREO5GE3WKQYEDGYUURP";

    // 1. Lấy thông tin user hiện tại
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, coins_balance")
      .eq("id", userId)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ success: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    const shortId = userId.slice(0, 8).toUpperCase();

    // 2. Kiểm tra xem trong DB đã có giao dịch nạp thành công gần nhất (trong vòng 2 giờ qua) chưa
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recentCompletedTx } = await supabaseAdmin
      .from("coin_transactions")
      .select("id, amount_vnd, coins_added, order_code, status, created_at")
      .eq("user_id", userProfile.id)
      .eq("status", "completed")
      .gt("amount_vnd", 0)
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Gọi SePay API lấy 20 giao dịch gần nhất để đồng bộ chủ động
    let newlyCredited = false;
    let addedCoins = 0;
    let finalBalance = userProfile.coins_balance || 0;
    let matchedExistingTx: any = null;

    try {
      const sepayRes = await fetch("https://my.sepay.vn/userapi/transactions/list?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (sepayRes.ok) {
        const sepayData = await sepayRes.json();
        const transactions = sepayData.transactions || [];

        for (const tx of transactions) {
          const amountIn = Number(tx.amount_in || 0);
          if (amountIn <= 0) continue;

          const content = String(tx.transaction_content || "").toUpperCase();
          const refNumber = String(tx.reference_number || tx.id);

          // Kiểm tra xem nội dung CK có chứa shortId hoặc email không
          const matchCode =
            content.includes(shortId) ||
            (userProfile.email && content.includes(userProfile.email.toUpperCase()));

          if (!matchCode) continue;

          // Kiểm tra xem giao dịch đã từng xử lý trong coin_transactions chưa
          const { data: existing } = await supabaseAdmin
            .from("coin_transactions")
            .select("id, amount_vnd, coins_added, order_code, status, created_at")
            .eq("order_code", refNumber)
            .maybeSingle();

          if (existing) {
            matchedExistingTx = existing;
            continue;
          }

          // Chưa cộng -> Tiến hành cộng ngay lập tức!
          const coins = calculateCoins(amountIn);
          finalBalance += coins;
          addedCoins += coins;
          newlyCredited = true;

          await supabaseAdmin.from("coin_transactions").insert({
            user_id: userProfile.id,
            amount_vnd: amountIn,
            coins_added: coins,
            order_code: refNumber,
            status: "completed",
          });

          await supabaseAdmin
            .from("profiles")
            .update({ coins_balance: finalBalance })
            .eq("id", userProfile.id);

          // Báo Telegram
          sendTelegramAlert(
            `🎉 <b>[DocTruyen.vip] SEPAY AUTO-SYNC CỘNG TIỀN THÀNH CÔNG!</b>\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 <b>Thành viên:</b> ${userProfile.display_name || "Độc giả"} (<code>${userProfile.email || shortId}</code>)\n` +
            `💰 <b>Số tiền nạp:</b> ${amountIn.toLocaleString("vi-VN")} VNĐ\n` +
            `🪙 <b>Xu cộng:</b> <b>+${coins} Xu</b> (Số dư mới: <b>${finalBalance} Xu</b>)\n` +
            `📝 <b>Nội dung CK:</b> <code>${content}</code>\n` +
            `⚡ <i>Tự động đối soát qua SePay API thành công!</i>`
          );
        }
      }
    } catch (syncErr) {
      console.warn("SePay fetch sync warning:", syncErr);
    }

    // 4. Phản hồi kết quả chính xác cho người dùng
    if (newlyCredited) {
      return NextResponse.json({
        success: true,
        credited: true,
        message: `Chúc mừng! Bạn đã được tự động cộng +${addedCoins} Xu vào tài khoản.`,
        coins_added: addedCoins,
        coins_balance: finalBalance,
      });
    }

    // Nếu giao dịch đã được webhook hoặc hệ thống ghi nhận từ trước
    const alreadyDoneTx = matchedExistingTx || recentCompletedTx;
    if (alreadyDoneTx) {
      const creditedAmount = alreadyDoneTx.amount_vnd || 10000;
      const creditedCoins = alreadyDoneTx.coins_added || calculateCoins(creditedAmount);
      return NextResponse.json({
        success: true,
        credited: true,
        alreadyCredited: true,
        message: `✓ Giao dịch ${creditedAmount.toLocaleString("vi-VN")} VNĐ (+${creditedCoins} Xu) đã được nạp thành công vào tài khoản của bạn!`,
        coins_added: creditedCoins,
        coins_balance: userProfile.coins_balance || finalBalance,
      });
    }

    return NextResponse.json({
      success: true,
      credited: false,
      message: "Chưa ghi nhận biến động số dư mới từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng đợi 5–10 giây rồi nhấn kiểm tra lại.",
      coins_balance: userProfile.coins_balance || 0,
    });
  } catch (error: any) {
    console.error("Check transaction error:", error);
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
    console.error("Telegram alert error:", err);
  }
}
