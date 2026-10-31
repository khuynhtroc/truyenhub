import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const BOT_TOKEN = '8692623601:AAEcTsr8Fag7dv9u_rK8oDXUoTVq0qfRtAM';
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
    console.error(`Telegram update bot API error (${method}):`, err);
    return { ok: false, error: err.message };
  }
}

async function sendMsg(chatId: number | string, text: string, replyToMessageId?: number) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_to_message_id: replyToMessageId || undefined,
    disable_web_page_preview: false,
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const msg = update.message;
    if (!msg || !msg.text) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const text = msg.text.trim();

    const supabase = createAdminSupabaseClient();

    if (text.startsWith('/start') || text.startsWith('/help')) {
      const help = [
        `✨ <b>CHÀO MỪNG BẠN ĐẾN VỚI ĐỌC TRUYỆN VIP!</b>`,
        `<i>Kênh phát sóng cập nhật truyện chữ, truyện tranh và ưu đãi độc quyền 24/7.</i>\n`,
        `📚 <b>LỆNH HỖ TRỢ ĐỘC GIẢ:</b>`,
        `• <code>/top</code> : Bảng xếp hạng 10 truyện hot nhất`,
        `• <code>/truyenmoi</code> : 5 truyện vừa mới cập nhật`,
        `• <code>/tim &lt;tên truyện&gt;</code> : Tra cứu link đọc nhanh (VD: <code>/tim Conan</code>)`,
        `• <code>/khuyenmai</code> : Thông tin tặng xu nạp VIP\n`,
        `🔗 <b>Đọc trực tiếp tại:</b> <a href="${SITE_URL}">${SITE_URL}</a>`,
      ].join('\n');

      await sendMsg(chatId, help, msgId);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/top')) {
      const { data: top } = await supabase
        .from('stories')
        .select('title, slug, views_count, story_type')
        .order('views_count', { ascending: false })
        .limit(10);

      if (!top?.length) {
        await sendMsg(chatId, 'Hiện chưa có dữ liệu bảng xếp hạng!', msgId);
        return NextResponse.json({ ok: true });
      }

      const topMsg = [
        `🏆 <b>BẢNG XẾP HẠNG TRUYỆN ĐƯỢC YÊU THÍCH NHẤT:</b>\n`,
        ...top.map((s, i) => `${i + 1}. <a href="${SITE_URL}/truyen/${s.slug}"><b>${s.title}</b></a> (${s.story_type === 'comic' ? 'Tranh' : 'Chữ'}) — 👁 ${s.views_count?.toLocaleString() || 0} lượt xem`),
        `\n👉 Truy cập <a href="${SITE_URL}/bang-xep-hang">Bảng Xếp Hạng Đầy Đủ</a>`,
      ].join('\n');

      await sendMsg(chatId, topMsg, msgId);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/truyenmoi')) {
      const { data: latest } = await supabase
        .from('stories')
        .select('title, slug, updated_at, total_chapters')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!latest?.length) {
        await sendMsg(chatId, 'Chưa có truyện mới cập nhật!', msgId);
        return NextResponse.json({ ok: true });
      }

      const newMsg = [
        `🆕 <b>TRUYỆN MỚI CẬP NHẬT GẦN ĐÂY:</b>\n`,
        ...latest.map((s, i) => `${i + 1}. <a href="${SITE_URL}/truyen/${s.slug}"><b>${s.title}</b></a> (${s.total_chapters || 0} chương)`),
        `\n👉 Đọc ngay tại <a href="${SITE_URL}">${SITE_URL}</a>`,
      ].join('\n');

      await sendMsg(chatId, newMsg, msgId);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/khuyenmai')) {
      const promoMsg = [
        `🎁 <b>CHƯƠNG TRÌNH KHUYẾN MÃI ĐẶC BIỆT THÁNG NÀY:</b>`,
        `• Tặng ngay <b>+20% số xu</b> khi nạp qua chuyển khoản VietQR tự động.`,
        `• Độc giả VIP không giới hạn chương khóa, đọc truyện mượt mà không quảng cáo.`,
        `• Hỗ trợ thanh toán nhanh chóng qua VPBank (mimiclothing) hoặc PayPal quốc tế.\n`,
        `👉 <b>Nạp xu ngay:</b> <a href="${SITE_URL}/nap-xu">${SITE_URL}/nap-xu</a>`,
      ].join('\n');

      await sendMsg(chatId, promoMsg, msgId);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/tim')) {
      const query = text.replace('/tim', '').trim();
      if (!query) {
        await sendMsg(chatId, 'Bạn vui lòng nhập tên truyện cần tìm. Ví dụ: <code>/tim Doraemon</code>', msgId);
        return NextResponse.json({ ok: true });
      }

      const { data: results } = await supabase
        .from('stories')
        .select('title, slug, author, story_type')
        .ilike('title', `%${query}%`)
        .limit(5);

      if (!results?.length) {
        await sendMsg(chatId, `🔍 Không tìm thấy truyện nào khớp với từ khóa "<b>${query}</b>". Hãy thử từ khóa ngắn hơn nhé!`, msgId);
        return NextResponse.json({ ok: true });
      }

      const searchMsg = [
        `🔍 <b>KẾT QUẢ TÌM KIẾM CHO "${query}":</b>\n`,
        ...results.map((s, i) => `${i + 1}. <a href="${SITE_URL}/truyen/${s.slug}"><b>${s.title}</b></a> — <i>${s.author || 'Đang cập nhật'}</i>`),
      ].join('\n');

      await sendMsg(chatId, searchMsg, msgId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Update bot webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: '@doctruyenvip_update_bot',
    platform: 'Cloudflare OpenNext Edge',
    time: new Date().toISOString(),
  });
}
