import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const DEFAULT_UPDATE_BOT_TOKEN = "8692623601:AAEcTsr8Fag7dv9u_rK8oDXUoTVq0qfRtAM";
export const DEFAULT_UPDATE_CHAT_ID = "-5504700831";
export const SITE_URL = "https://doctruyen.vip";

export interface BroadcastConfig {
  botToken: string;
  chatId: string;
}

/**
 * Lấy cấu hình Bot phát sóng từ Database hoặc biến môi trường
 */
export async function getBroadcastConfig(): Promise<BroadcastConfig> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site_config")
      .maybeSingle();

    const tgSettings = data?.value?.socialIntegrations?.telegram;
    const botToken =
      tgSettings?.botToken ||
      process.env.TELEGRAM_UPDATE_BOT_TOKEN ||
      DEFAULT_UPDATE_BOT_TOKEN;
    const chatId =
      tgSettings?.channelId ||
      process.env.TELEGRAM_UPDATE_CHAT_ID ||
      DEFAULT_UPDATE_CHAT_ID;

    return { botToken, chatId };
  } catch {
    return {
      botToken: process.env.TELEGRAM_UPDATE_BOT_TOKEN || DEFAULT_UPDATE_BOT_TOKEN,
      chatId: process.env.TELEGRAM_UPDATE_CHAT_ID || DEFAULT_UPDATE_CHAT_ID,
    };
  }
}

/**
 * Gửi tin nhắn qua Telegram Bot API
 */
export async function sendTelegramMessage(
  text: string,
  config?: Partial<BroadcastConfig>
) {
  const finalConfig = config?.botToken && config?.chatId
    ? (config as BroadcastConfig)
    : await getBroadcastConfig();

  const url = `https://api.telegram.org/bot${finalConfig.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: finalConfig.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  return res.json();
}

/**
 * Gửi tin nhắn kèm ảnh bìa qua Telegram Bot API
 */
export async function sendTelegramPhoto(
  photoUrl: string,
  caption: string,
  config?: Partial<BroadcastConfig>
) {
  const finalConfig = config?.botToken && config?.chatId
    ? (config as BroadcastConfig)
    : await getBroadcastConfig();

  const url = `https://api.telegram.org/bot${finalConfig.botToken}/sendPhoto`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: finalConfig.chatId,
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    // Fallback sang gửi tin nhắn text nếu ảnh lỗi định dạng
    return sendTelegramMessage(caption, finalConfig);
  }
  return data;
}

/**
 * 1. Phát sóng thông báo Truyện Mới
 */
export async function broadcastNewStory(story: {
  title: string;
  slug: string;
  author_name?: string;
  genres?: string[] | string;
  description?: string;
  cover_url?: string;
}) {
  const genreList = Array.isArray(story.genres)
    ? story.genres.map((g) => `#${g.trim().replace(/\s+/g, "_")}`).join(" ")
    : story.genres || "#truyen_moi";

  const cleanDesc = (story.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const storyUrl = `${SITE_URL}/truyen/${story.slug}`;

  const caption = [
    `📚 <b>[DocTruyen.vip] RA MẮT TRUYỆN MỚI CỰC HAY!</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `📖 <b>Tác phẩm:</b> <b>${story.title}</b>`,
    `✍️ <b>Tác giả:</b> ${story.author_name || "Đang cập nhật"}`,
    `🏷 <b>Thể loại:</b> ${genreList}`,
    cleanDesc ? `📝 <b>Tóm tắt:</b> <i>"${cleanDesc}..."</i>` : "",
    `━━━━━━━━━━━━━━━━━━`,
    `⚡ <b>Đọc ngay 15 chương miễn phí tại:</b>`,
    `👉 <a href="${storyUrl}">${storyUrl}</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  if (story.cover_url && story.cover_url.startsWith("http")) {
    return sendTelegramPhoto(story.cover_url, caption);
  }
  return sendTelegramMessage(caption);
}

/**
 * 2. Phát sóng thông báo Chương Mới
 */
export async function broadcastNewChapter(params: {
  storyTitle: string;
  storySlug: string;
  chapterNumber: number;
  chapterTitle?: string;
  isLocked?: boolean;
}) {
  const chapterUrl = `${SITE_URL}/truyen/${params.storySlug}/${params.chapterNumber}`;
  const statusBadge = params.isLocked ? "🔒 VIP (Có phí)" : "🎁 Đọc Miễn Phí";

  const text = [
    `⚡ <b>[DocTruyen.vip] CHƯƠNG MỚI VỪA CẬP NHẬT!</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `📖 <b>Truyện:</b> <b>${params.storyTitle}</b>`,
    `📑 <b>Chương:</b> Chương ${params.chapterNumber} ${params.chapterTitle ? `- ${params.chapterTitle}` : ""}`,
    `🪙 <b>Trạng thái:</b> ${statusBadge}`,
    `━━━━━━━━━━━━━━━━━━`,
    `👉 <b>Bấm vào đọc ngay:</b>`,
    `⚡ <a href="${chapterUrl}">${chapterUrl}</a>`,
  ].join("\n");

  return sendTelegramMessage(text);
}

/**
 * 3. Phát sóng Bảng Xếp Hạng Top Truyện Hot
 */
export async function broadcastRankings(limit = 5) {
  const supabase = createAdminSupabaseClient();
  const { data: topStories } = await supabase
    .from("stories")
    .select("title, slug, author_name, total_views, total_chapters")
    .order("total_views", { ascending: false })
    .limit(limit);

  if (!topStories || topStories.length === 0) return { ok: false, error: "No stories found" };

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const lines = [
    `🏆 <b>[DocTruyen.vip] BẢNG XẾP HẠNG TRUYỆN ĐỌC NHIỀU NHẤT</b>`,
    `🔥 <i>Cập nhật trực tiếp từ hệ thống độc giả hôm nay</i>`,
    `━━━━━━━━━━━━━━━━━━`,
  ];

  topStories.forEach((s, idx) => {
    const medal = medals[idx] || `[${idx + 1}]`;
    const views = (s.total_views || 0).toLocaleString("vi-VN");
    const link = `${SITE_URL}/truyen/${s.slug}`;
    lines.push(
      `${medal} <b>${s.title}</b> (${s.total_chapters || 0} ch)\n` +
      `   👁 <b>${views}</b> lượt xem | 👉 <a href="${link}">Đọc ngay</a>`
    );
  });

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`🌐 <b>Xem trọn bộ BXH tại:</b> <a href="${SITE_URL}/bang-xep-hang">${SITE_URL}/bang-xep-hang</a>`);

  return sendTelegramMessage(lines.join("\n"));
}

/**
 * 4. Phát sóng Khuyến Mãi, Sự Kiện & Tặng Xu
 */
export async function broadcastPromotions() {
  const text = [
    `🎉 <b>[DocTruyen.vip] SỰ KIỆN TẶNG XU & ƯU ĐÃI THÀNH VIÊN</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `💎 <b>Cơ hội nhận xu miễn phí mỗi ngày:</b>`,
    `✨ <b>1. Điểm danh hàng ngày:</b> Nhận ngay <b>+5 đến 10 Xu</b> miễn phí vào tài khoản`,
    `🚀 <b>2. Nhiệm vụ chia sẻ:</b> Chia sẻ truyện lên Facebook/Zalo/Telegram nhận <b>+100 Xu</b>`,
    `💬 <b>3. Bình luận tích cực:</b> Tương tác thảo luận nhận thêm Xu mở chương`,
    `━━━━━━━━━━━━━━━━━━`,
    `👑 <b>GÓI HỘI VIÊN VIP - ĐỌC KHÔNG GIỚI HẠN:</b>`,
    `• Mở khóa toàn bộ kho truyện VIP & truyện tranh bản đẹp`,
    `• Mở khóa 15 giọng đọc AI độc quyền không quảng cáo`,
    `• Ưu đãi nạp xu VietQR / SePay tự động trong 2 giây thưởng thêm tới <b>+50% Xu</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `👉 <b>Nhận xu miễn phí ngay hôm nay:</b>`,
    `⚡ <a href="${SITE_URL}/tai-khoan#diem-danh">${SITE_URL}/tai-khoan#diem-danh</a>`,
  ].join("\n");

  return sendTelegramMessage(text);
}
