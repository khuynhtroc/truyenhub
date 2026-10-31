import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM';
const AUTHORIZED_CHAT_ID = 8612893214;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SITE_URL = 'https://www.doctruyen.vip';

async function tgCall(method: string, body: Record<string, any>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`Telegram API error (${method}):`, err);
    return { ok: false, error: err.message };
  }
}

async function sendTgMessage(chatId: number, text: string, replyMarkup?: any) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

async function askGemini(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Dạ thưa Sếp, hệ thống AI tạm thời đang bận xử lý, xin thử lại sau giây lát ạ!';
  } catch (e: any) {
    console.error('Gemini error:', e);
    return 'Dạ thưa Sếp, em gặp lỗi khi kết nối AI: ' + e.message;
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Xử lý Callback Query (Duyệt nạp tiền 1 chạm từ nút bấm)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data || '';
      const chatId = cb.message?.chat?.id;
      const msgId = cb.message?.message_id;

      if (chatId !== AUTHORIZED_CHAT_ID) {
        await tgCall('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: 'Bạn không có quyền thực hiện thao tác này!',
          show_alert: true,
        });
        return NextResponse.json({ ok: true });
      }

      const supabase = createAdminSupabaseClient();

      if (data.startsWith('approve_tx_')) {
        const txId = data.replace('approve_tx_', '');
        const { data: tx, error: txErr } = await supabase
          .from('transactions')
          .select('id, user_id, amount, coins, status')
          .eq('id', txId)
          .single();

        if (txErr || !tx) {
          await tgCall('answerCallbackQuery', {
            callback_query_id: cb.id,
            text: 'Không tìm thấy giao dịch này!',
            show_alert: true,
          });
          return NextResponse.json({ ok: true });
        }

        if (tx.status === 'completed' || tx.status === 'approved') {
          await tgCall('answerCallbackQuery', {
            callback_query_id: cb.id,
            text: 'Giao dịch này đã được duyệt trước đó!',
            show_alert: true,
          });
          return NextResponse.json({ ok: true });
        }

        // Cập nhật trạng thái và cộng xu cho user
        await supabase
          .from('transactions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', txId);

        // Cộng xu vào profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', tx.user_id)
          .single();

        const currentCoins = profile?.coins || 0;
        await supabase
          .from('profiles')
          .update({ coins: currentCoins + tx.coins })
          .eq('id', tx.user_id);

        await tgCall('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `✓ Đã duyệt thành công nạp ${tx.coins} xu cho User!`,
          show_alert: true,
        });

        // Sửa tin nhắn gốc
        await tgCall('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: (cb.message?.text || '') + `\n\n✅ <b>ĐÃ DUYỆT BỞI SẾP</b> (+${tx.coins} xu vào lúc ${new Date().toLocaleTimeString('vi-VN')})`,
          parse_mode: 'HTML',
        });

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('reject_tx_')) {
        const txId = data.replace('reject_tx_', '');
        await supabase
          .from('transactions')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', txId);

        await tgCall('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: 'Đã từ chối giao dịch!',
          show_alert: true,
        });

        await tgCall('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: (cb.message?.text || '') + `\n\n❌ <b>ĐÃ TỪ CHỐI BỞI SẾP</b>`,
          parse_mode: 'HTML',
        });

        return NextResponse.json({ ok: true });
      }

      await tgCall('answerCallbackQuery', { callback_query_id: cb.id });
      return NextResponse.json({ ok: true });
    }

    // 2. Xử lý tin nhắn văn bản
    const message = update.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Kiểm tra bảo mật Chat ID
    if (chatId !== AUTHORIZED_CHAT_ID) {
      await sendTgMessage(
        chatId,
        '🔒 <b>DocTruyen.VIP Security:</b> Trợ lý quản trị nội bộ chỉ phản hồi tin nhắn từ Sếp (Admin)!'
      );
      return NextResponse.json({ ok: true });
    }

    // Các lệnh điều khiển hệ thống
    if (text === '/start' || text === '/help') {
      const helpText = [
        `🤖 <b>TRỢ LÝ QUẢN TRỊ ĐỌC TRUYỆN VIP (WEBHOOK ONLINE 24/7)</b>`,
        `<i>Hệ thống chạy trên Cloudflare Edge, luôn sẵn sàng phục vụ Sếp kể cả khi PC tắt!</i>\n`,
        `📌 <b>CÁC LỆNH NHANH:</b>`,
        `• <code>/stats</code> : Thống kê tổng số truyện, chương, user, doanh thu`,
        `• <code>/top</code> : Top 10 truyện hot nhất sàn`,
        `• <code>/pending</code> : Kiểm tra các đơn nạp tiền đang chờ duyệt`,
        `• <code>/help</code> : Xem bảng hướng dẫn này\n`,
        `💬 Sếp có thể nhắn tin đàm thoại tự nhiên bất kỳ câu hỏi nào về nội dung, kỹ thuật, SEO hoặc yêu cầu sáng tác tóm tắt!`,
      ].join('\n');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Thống Kê Tổng Quan', callback_data: 'cmd_stats' },
            { text: '🔥 Top Truyện Hot', callback_data: 'cmd_top' },
          ],
          [
            { text: '🌐 Mở Website DocTruyen.VIP', url: SITE_URL },
            { text: '⚙️ Trang Quản Trị Admin', url: `${SITE_URL}/admin` },
          ],
        ],
      };

      await sendTgMessage(chatId, helpText, keyboard);
      return NextResponse.json({ ok: true });
    }

    if (text === '/stats' || text === 'cmd_stats') {
      const supabase = createAdminSupabaseClient();
      const [storiesCount, usersCount, pendingTx] = await Promise.all([
        supabase.from('stories').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const statMsg = [
        `📊 <b>BÁO CÁO NHANH DOCTRUYEN.VIP:</b>`,
        `• Tổng số tác phẩm: <b>${storiesCount.count || 0}</b> truyện`,
        `• Tổng số thành viên: <b>${usersCount.count || 0}</b> độc giả`,
        `• Đơn nạp xu chờ duyệt: <b>${pendingTx.count || 0}</b> đơn`,
        `• Trạng thái server: 🟢 <b>100% Online Edge Serverless (Cloudflare)</b>`,
        `• Thời gian máy chủ: <code>${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</code>`,
      ].join('\n');

      await sendTgMessage(chatId, statMsg);
      return NextResponse.json({ ok: true });
    }

    if (text === '/top' || text === 'cmd_top') {
      const supabase = createAdminSupabaseClient();
      const { data: topStories } = await supabase
        .from('stories')
        .select('title, slug, views_count, story_type')
        .order('views_count', { ascending: false })
        .limit(10);

      if (!topStories?.length) {
        await sendTgMessage(chatId, 'Chưa có dữ liệu xếp hạng truyện!');
        return NextResponse.json({ ok: true });
      }

      const topText = [
        `🏆 <b>TOP 10 TRUYỆN ĐƯỢC ĐỌC NHIỀU NHẤT:</b>\n`,
        ...topStories.map((s, idx) => `${idx + 1}. <a href="${SITE_URL}/truyen/${s.slug}"><b>${s.title}</b></a> (${s.story_type === 'comic' ? 'Tranh' : 'Chữ'}) — 👁 ${s.views_count?.toLocaleString() || 0} lượt đọc`),
      ].join('\n');

      await sendTgMessage(chatId, topText);
      return NextResponse.json({ ok: true });
    }

    // Đàm thoại tự nhiên với Gemini AI
    const systemPrompt = `Bạn là Trợ lý AI Cấp Cao riêng của Sếp tại hệ thống ĐọcTruyện.VIP (https://www.doctruyen.vip).
Xưng hô: Em - gọi người dùng là Sếp.
Giọng điệu: Nhiệt tình, chu đáo, tinh tế, nắm vững công nghệ Web (Next.js, Cloudflare, Supabase) và am hiểu sâu sắc về thị trường truyện chữ, truyện tranh, chiến lược SEO và kinh doanh nội dung số.
Phản hồi ngắn gọn, dùng định dạng HTML Telegram hợp lệ (<b>, <i>, <code>, <a>).`;

    const aiReply = await askGemini(text, systemPrompt);
    await sendTgMessage(chatId, aiReply);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: 'doctruyenvip_seo_bot',
    platform: 'Cloudflare OpenNext Edge',
    time: new Date().toISOString(),
  });
}
