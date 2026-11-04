import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8500909239:AAETeet771ZCAgi3qC7A8MMPJuz999CNNLM';
const AUTHORIZED_CHAT_ID = 8612893214;
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

/**
 * Lấy Gemini API Key từ Supabase Settings hoặc .env
 */
async function resolveGeminiApiKey(): Promise<string> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from('settings').select('value').eq('key', 'ai_settings').maybeSingle();
    if (data?.value?.gemini_api_key && typeof data.value.gemini_api_key === 'string' && data.value.gemini_api_key.trim()) {
      return data.value.gemini_api_key.trim();
    }
  } catch (err) {
    console.warn('[Telegram Webhook] Failed to fetch ai_settings from db:', err);
  }
  return process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || '';
}

/**
 * Gọi Google Generative Language API với danh sách model hợp lệ
 */
async function askGemini(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = await resolveGeminiApiKey();
  if (!apiKey) {
    return (
      '⚠️ <b>Chưa thiết lập Gemini API Key.</b>\n' +
      'Sếp hãy lấy API key miễn phí tại Google AI Studio (<a href="https://aistudio.google.com/app/apikey">aistudio.google.com</a>) và gửi cho em theo cú pháp:\n' +
      '<code>/setkey AIzaSy...</code> để kích hoạt AI đàm thoại nhé ạ!'
    );
  }

  // Danh sách các model chính thức từ Google (thử lần lượt từ nhanh nhất)
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

      if (data?.error) {
        if (data.error.code === 400 && data.error.message?.includes('API key not valid')) {
          return (
            '⚠️ <b>Gemini API Key hiện tại không hợp lệ hoặc đã bị Google thu hồi.</b>\n\n' +
            'Sếp vui lòng tạo API key mới tại: <a href="https://aistudio.google.com/app/apikey">Google AI Studio</a> rồi gửi lại cho em bằng lệnh:\n' +
            '<code>/setkey &lt;Khóa_API_Mới&gt;</code> ạ!'
          );
        }
        console.warn(`[askGemini] Model ${model} returned error:`, data.error.message);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (e: any) {
      console.error(`[askGemini] Exception on model ${model}:`, e.message);
    }
  }

  return (
    'Dạ thưa Sếp, hệ thống Gemini AI hiện đang quá tải hoặc gặp sự cố kết nối tới Google. ' +
    'Sếp có thể thử lại sau ít phút hoặc dùng các lệnh nhanh như <code>/stats</code>, <code>/top</code>, <code>/bxh</code>, <code>/social</code> ạ!'
  );
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const supabase = createAdminSupabaseClient();

    // 1. Xử lý Callback Query (Duyệt nạp tiền 1 chạm từ nút bấm hoặc menu)
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

      // Quick menu buttons
      if (data === 'cmd_stats') {
        const stats = await getSystemStats();
        await sendTgMessage(chatId, stats);
        await tgCall('answerCallbackQuery', { callback_query_id: cb.id });
        return NextResponse.json({ ok: true });
      }

      if (data === 'cmd_top') {
        const topStories = await getTopStories();
        await sendTgMessage(chatId, topStories);
        await tgCall('answerCallbackQuery', { callback_query_id: cb.id });
        return NextResponse.json({ ok: true });
      }

      if (data === 'cmd_bxh') {
        const leaderboard = await getTopReadersLeaderboard();
        await sendTgMessage(chatId, leaderboard);
        await tgCall('answerCallbackQuery', { callback_query_id: cb.id });
        return NextResponse.json({ ok: true });
      }

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

        // Cập nhật trạng thái giao dịch
        await supabase
          .from('transactions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', txId);

        // Cộng point (coins_balance) vào profile người dùng
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins_balance')
          .eq('id', tx.user_id)
          .single();

        const currentPoints = profile?.coins_balance || 0;
        await supabase
          .from('profiles')
          .update({ coins_balance: currentPoints + (tx.coins || 0) })
          .eq('id', tx.user_id);

        await tgCall('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `✓ Đã duyệt thành công +${tx.coins} Point cho độc giả!`,
          show_alert: true,
        });

        await tgCall('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text:
            (cb.message?.text || '') +
            `\n\n✅ <b>ĐÃ DUYỆT BỞI SẾP</b> (+${tx.coins} Point vào lúc ${new Date().toLocaleTimeString('vi-VN')})`,
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

    // 2. Xử lý tin nhắn văn bản từ Sếp
    const message = update.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    // Kiểm tra bảo mật Chat ID
    if (chatId !== AUTHORIZED_CHAT_ID) {
      await sendTgMessage(
        chatId,
        '🔒 <b>DocTruyen.VIP Security:</b> Trợ lý nội bộ chỉ phản hồi tin nhắn từ Sếp (Admin)!'
      );
      return NextResponse.json({ ok: true });
    }

    // Command: /setkey <API_KEY>
    if (text.startsWith('/setkey') || text.startsWith('/apikey') || text.startsWith('/key')) {
      const parts = text.split(/\s+/);
      const newKey = parts[1]?.trim();

      if (!newKey) {
        const currentKey = await resolveGeminiApiKey();
        const masked = currentKey ? `${currentKey.substring(0, 8)}...${currentKey.slice(-4)}` : 'Chưa thiết lập';
        await sendTgMessage(
          chatId,
          `🔑 <b>CẤU HÌNH GEMINI API KEY</b>\n\n` +
          `• Key hiện tại: <code>${masked}</code>\n\n` +
          `Để thay đổi hoặc cập nhật Key mới, Sếp vui lòng gửi theo cú pháp:\n` +
          `<code>/setkey AIzaSy...</code>\n\n` +
          `👉 Tạo Key miễn phí tại: <a href="https://aistudio.google.com/app/apikey">Google AI Studio</a>`
        );
        return NextResponse.json({ ok: true });
      }

      // Test key trước khi lưu
      try {
        const testRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${newKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Trả lời ngắn gọn: OK' }] }],
            }),
          }
        );
        const testData = await testRes.json();
        if (testData?.error) {
          await sendTgMessage(
            chatId,
            `❌ <b>Khóa API không hợp lệ:</b> ${testData.error.message || 'Lỗi kiểm tra Google AI'}\n` +
            `Vui lòng kiểm tra lại mã API key từ Google AI Studio!`
          );
          return NextResponse.json({ ok: true });
        }
      } catch (err: any) {
        console.warn('[SetKey] Test call failed:', err.message);
      }

      // Lưu vào Supabase settings
      const { data: currentSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ai_settings')
        .maybeSingle();

      const updatedVal = { ...(currentSetting?.value || {}), gemini_api_key: newKey, updated_at: new Date().toISOString() };

      await supabase.from('settings').upsert({ key: 'ai_settings', value: updatedVal });

      await sendTgMessage(
        chatId,
        `✅ <b>ĐÃ KÍCH HOẠT THÀNH CÔNG GEMINI API KEY MỚI!</b>\n\n` +
        `• Khóa mới: <code>${newKey.substring(0, 10)}...${newKey.slice(-4)}</code>\n` +
        `• Trạng thái AI: 🟢 <b>Hoạt động 100%</b>\n\n` +
        `Từ bây giờ Sếp có thể chat trò chuyện tự nhiên với em bất cứ lúc nào ạ!`
      );
      return NextResponse.json({ ok: true });
    }

    // Các lệnh trợ giúp /help, /start
    if (text === '/start' || text === '/help') {
      const helpText = [
        `🤖 <b>TRỢ LÝ QUẢN TRỊ ĐỌC TRUYỆN VIP (ONLINE 24/7)</b>`,
        `<i>Hệ thống chạy trên Cloudflare Edge, luôn sẵn sàng phục vụ Sếp kể cả khi tắt PC!</i>\n`,
        `📌 <b>CÁC LỆNH ĐIỀU HÀNH NHANH:</b>`,
        `• <code>/bxh</code> : Bảng điểm Point độc giả thực tế`,
        `• <code>/stats</code> : Thống kê tổng số truyện, chương, độc giả`,
        `• <code>/top</code> : Top 10 truyện hot nhiều lượt đọc nhất`,
        `• <code>/social</code> : Tiến độ lập lịch đăng Fanpage Facebook`,
        `• <code>/pending</code> : Kiểm tra các đơn nạp chờ duyệt`,
        `• <code>/setkey &lt;key&gt;</code> : Cài đặt / Cập nhật Gemini API Key\n`,
        `💬 <b>Đàm thoại AI:</b> Sếp có thể nhắn bất kỳ câu hỏi, yêu cầu hoặc nhắc nhở nào, em sẽ tự động phản hồi ngay lập tức ạ!`,
      ].join('\n');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🏆 Bảng Điểm Độc Giả', callback_data: 'cmd_bxh' },
            { text: '📊 Thống Kê Tổng Quan', callback_data: 'cmd_stats' },
          ],
          [
            { text: '🔥 Top Truyện Hot', callback_data: 'cmd_top' },
            { text: '🌐 Mở DocTruyen.VIP', url: SITE_URL },
          ],
        ],
      };

      await sendTgMessage(chatId, helpText, keyboard);
      return NextResponse.json({ ok: true });
    }

    // 3. TỰ ĐỘNG NHẬN DIỆN Ý ĐỊNH (INTENT RECOGNITION) THÔNG MINH
    // Phục vụ Sếp ngay tức thì kể cả khi API AI gặp sự cố mạng

    // Intent A: Bảng Xếp Hạng / Điểm Point / Độc Giả
    if (
      text === '/bxh' ||
      text === 'cmd_bxh' ||
      lowerText.includes('bảng xếp hạng') ||
      lowerText.includes('bxh') ||
      (lowerText.includes('điểm') && lowerText.includes('độc giả')) ||
      (lowerText.includes('point') && lowerText.includes('độc giả')) ||
      lowerText.includes('độc giả point') ||
      lowerText.includes('phú hào')
    ) {
      const bxhMsg = await getTopReadersLeaderboard();
      await sendTgMessage(chatId, bxhMsg);
      return NextResponse.json({ ok: true });
    }

    // Intent B: Thống kê / Báo cáo / Doanh số
    if (
      text === '/stats' ||
      text === 'cmd_stats' ||
      lowerText.includes('thống kê') ||
      lowerText.includes('báo cáo') ||
      lowerText.includes('doanh thu') ||
      lowerText.includes('tổng số')
    ) {
      const statsMsg = await getSystemStats();
      await sendTgMessage(chatId, statsMsg);
      return NextResponse.json({ ok: true });
    }

    // Intent C: Top Truyện / Truyện Hot
    if (
      text === '/top' ||
      text === 'cmd_top' ||
      lowerText.includes('top truyện') ||
      lowerText.includes('truyện hot') ||
      lowerText.includes('xem nhiều')
    ) {
      const topMsg = await getTopStories();
      await sendTgMessage(chatId, topMsg);
      return NextResponse.json({ ok: true });
    }

    // Intent D: Lập lịch Facebook / Social AutoShare
    if (
      text === '/social' ||
      lowerText.includes('facebook') ||
      lowerText.includes('fanpage') ||
      lowerText.includes('lập lịch') ||
      lowerText.includes('lên lịch') ||
      lowerText.includes('đăng bài')
    ) {
      const socialMsg = await getSocialBackfillStatus();
      await sendTgMessage(chatId, socialMsg);
      return NextResponse.json({ ok: true });
    }

    // Intent E: Đơn chờ duyệt / Giao dịch
    if (
      text === '/pending' ||
      lowerText.includes('chờ duyệt') ||
      lowerText.includes('pending') ||
      lowerText.includes('đơn nạp')
    ) {
      const pendingMsg = await getPendingTransactions();
      await sendTgMessage(chatId, pendingMsg);
      return NextResponse.json({ ok: true });
    }

    // 4. ĐÀM THOẠI TỰ NHIÊN VỚI GEMINI AI
    const systemPrompt = `Bạn là Trợ lý AI Cấp Cao riêng của Sếp tại nền tảng ĐọcTruyện.VIP (https://www.doctruyen.vip).
Xưng hô: Em - gọi người dùng là Sếp.
Giọng điệu: Tinh tế, chu đáo, nhiệt tình, am hiểu sâu sắc về hệ thống website đọc truyện tranh & truyện chữ online, Cloudflare Workers, Next.js, Supabase và chiến lược SEO.
HỆ THỐNG HIỆN TẠI:
- Đã mở khóa 100% tất cả các chương truyện tranh và truyện chữ hoàn toàn miễn phí.
- Đã thay thế nạp xu bằng trang Donate Admin (/donate) với mã VietQR VPBank (STK: 10011918888, Chủ TK: mimiclothing).
- Độc giả tích lũy Point thông qua tương tác (like, comment, chia sẻ, điểm danh). Đăng ký mới nhận ngay 1.000 Point.
- Bảng xếp hạng trên site hiển thị 100% số điểm Point thực tế và Google Avatar của độc giả từ CSDL Supabase.
Phản hồi ngắn gọn, thông minh, đúng trọng tâm, sử dụng định dạng HTML Telegram hợp lệ (<b>, <i>, <code>, <a>).`;

    const aiReply = await askGemini(text, systemPrompt);
    await sendTgMessage(chatId, aiReply);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * Lấy Bảng Điểm Độc Giả Point Thực Tế từ Supabase
 */
async function getTopReadersLeaderboard(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data: topUsers, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, coins_balance, created_at')
    .order('coins_balance', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

  if (error || !topUsers?.length) {
    return 'Dạ thưa Sếp, hiện chưa thể kết nối danh sách độc giả hoặc chưa có dữ liệu profile!';
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  const rows = topUsers.map((u, i) => {
    let name = u.display_name?.trim();
    if (!name && u.email) {
      const [localPart, domain] = u.email.split('@');
      name = `${localPart.substring(0, 3)}***@${domain || 'gmail.com'}`;
    }
    const points = (u.coins_balance || 0).toLocaleString('vi-VN');
    return `${medals[i] || '⭐'} <b>${name || 'Độc giả VIP'}</b> — <code>${points} Point</code>`;
  });

  return [
    `🏆 <b>BẢNG ĐIỂM ĐỘC GIẢ POINT THỰC TẾ (DOCTRUYEN.VIP):</b>`,
    `<i>Dạ thưa Sếp, toàn bộ hệ thống Bảng Xếp Hạng trên web hiện đã đồng bộ 100% số điểm Point thực tế của độc giả từ CSDL Supabase, gỡ bỏ toàn bộ mock ảo!</i>\n`,
    ...rows,
    `\n👥 Tổng số thành viên đã đăng ký: <b>${totalUsers || topUsers.length}</b> độc giả`,
    `🌐 <b>Xem trực tiếp tại:</b> <a href="${SITE_URL}/bang-xep-hang?tab=vip">${SITE_URL}/bang-xep-hang?tab=vip</a>`,
  ].join('\n');
}

/**
 * Lấy Thống Kê Tổng Quan Hệ Thống
 */
async function getSystemStats(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const [storiesCount, usersCount, pendingTx, chaptersCount] = await Promise.all([
    supabase.from('stories').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('chapters').select('id', { count: 'exact', head: true }),
  ]);

  return [
    `📊 <b>BÁO CÁO TỔNG QUAN DOCTRUYEN.VIP:</b>\n`,
    `• Tổng số tác phẩm: <b>${storiesCount.count || 0}</b> truyện`,
    `• Tổng số chương truyện: <b>${(chaptersCount.count || 0).toLocaleString()}</b> chương (Mở khóa 100% Free)`,
    `• Tổng số thành viên độc giả: <b>${usersCount.count || 0}</b> người`,
    `• Đơn nạp/donate chờ duyệt: <b>${pendingTx.count || 0}</b> đơn`,
    `• Trạng thái máy chủ: 🟢 <b>100% Serverless Edge (Cloudflare Workers)</b>`,
    `• Thời gian máy chủ: <code>${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</code>`,
    `\n👉 Trang Quản Trị: <a href="${SITE_URL}/admin">${SITE_URL}/admin</a>`,
  ].join('\n');
}

/**
 * Lấy Top 10 Truyện Hot Nhất
 */
async function getTopStories(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data: topStories } = await supabase
    .from('stories')
    .select('title, slug, views_count, story_type')
    .order('views_count', { ascending: false })
    .limit(10);

  if (!topStories?.length) {
    return 'Chưa có dữ liệu xếp hạng truyện!';
  }

  return [
    `🔥 <b>TOP 10 TRUYỆN ĐƯỢC ĐỌC NHIỀU NHẤT:</b>\n`,
    ...topStories.map(
      (s, idx) =>
        `${idx + 1}. <a href="${SITE_URL}/truyen/${s.slug}"><b>${s.title}</b></a> (${s.story_type === 'comic' ? 'Tranh' : 'Chữ'}) — 👁 <b>${s.views_count?.toLocaleString() || 0}</b> lượt đọc`
    ),
    `\n👉 Xem toàn bộ tại: <a href="${SITE_URL}/bang-xep-hang">${SITE_URL}/bang-xep-hang</a>`,
  ].join('\n');
}

/**
 * Lấy Trạng Thái Lập Lịch Facebook Fanpage
 */
async function getSocialBackfillStatus(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from('settings').select('value').eq('key', 'social_settings').maybeSingle();

  const social = data?.value;
  const backfill = social?.facebook_backfill;

  if (!backfill) {
    return 'Dạ thưa Sếp, hàng đợi lập lịch Facebook hiện chưa được khởi tạo trong Cài Đặt.';
  }

  const nextPost = backfill.next_post_at ? new Date(backfill.next_post_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Không có';
  const lastPost = backfill.last_posted_at ? new Date(backfill.last_posted_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có';

  return [
    `📢 <b>TIẾN ĐỘ PHÁT SÓNG FACEBOOK FANPAGE:</b>\n`,
    `• Trạng thái hàng đợi: <b>${backfill.status === 'scheduled' ? '🟢 Đang hoạt động (Scheduled)' : '⏸️ Tạm ngưng'}</b>`,
    `• Tiến độ bài viết: <b>${backfill.cursor || 0} / ${backfill.post_ids?.length || 0}</b> truyện`,
    `• Bài vừa đăng gần nhất: <b>${backfill.last_post_title || 'N/A'}</b> (${lastPost})`,
    `• Bài tiếp theo dự kiến: <code>${nextPost}</code>`,
    `• Tần suất lập lịch: <b>Mỗi ${backfill.interval_minutes || 240} phút / bài</b>`,
    `• Fanpage ID kết nối: <code>${social?.facebook_page_id || 'Chưa điền'}</code>`,
  ].join('\n');
}

/**
 * Lấy Danh Sách Giao Dịch Chờ Duyệt
 */
async function getPendingTransactions(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data: pending } = await supabase
    .from('transactions')
    .select('id, user_id, amount, coins, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!pending?.length) {
    return '✅ Dạ thưa Sếp, hiện tại không có đơn nạp/donate nào đang chờ duyệt ạ!';
  }

  return [
    `📋 <b>DANH SÁCH ĐƠN NẠP/DONATE ĐANG CHỜ DUYỆT:</b>\n`,
    ...pending.map(
      (tx, i) =>
        `${i + 1}. Đơn #<code>${tx.id.slice(0, 8)}</code>: <b>${(tx.amount || 0).toLocaleString()} VNĐ</b> (+${tx.coins} Point) — Tạo lúc: ${new Date(tx.created_at).toLocaleTimeString('vi-VN')}`
    ),
    `\n👉 Sếp có thể bấm Duyệt nhanh trực tiếp khi có thông báo đơn mới gửi về bot!`,
  ].join('\n');
}

export async function GET() {
  const key = await resolveGeminiApiKey();
  const hasKey = Boolean(key);

  return NextResponse.json({
    status: 'online',
    bot: 'doctruyenvip_seo_bot',
    platform: 'Cloudflare OpenNext Edge',
    gemini_configured: hasKey,
    time: new Date().toISOString(),
  });
}
