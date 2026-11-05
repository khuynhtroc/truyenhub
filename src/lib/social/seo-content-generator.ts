import type { Post } from '@/lib/types';

export type ContentCategoryKey =
  | 'comic'
  | 'tien_hiep'
  | 'ngon_tinh'
  | 'trinh_tham'
  | 'do_thi'
  | 'kinh_dien'
  | 'blog'
  | 'default';

interface CategoryConfig {
  key: ContentCategoryKey;
  icon: string;
  badge: string;
  leadInTemplates: string[];
  pocketTips: string[];
  hashtags: string[];
}

const CATEGORY_CONFIGS: Record<ContentCategoryKey, CategoryConfig> = {
  comic: {
    key: 'comic',
    icon: '💥',
    badge: 'SIÊU PHẨM TRUYỆN TRANH & WEBTOON',
    leadInTemplates: [
      'Từng khung tranh sống động, cốt truyện cuốn hút đến nghẹt thở đang chờ bạn khám phá!',
      'Siêu phẩm truyện tranh với nét vẽ mãn nhãn và những cú bẻ lái cực gắt khiến cộng đồng đứng ngồi không yên:',
      'Nếu bạn đang tìm kiếm một bộ Manga / Webtoon giải trí đỉnh cao với nhịp truyện dồn dập thì đây chính là chân ái:',
    ],
    pocketTips: [
      'Chuyển sang chế độ Cuộn Dọc (Webtoon Mode) trên DocTruyen.VIP để lướt tranh mượt mà Full HD không độ trễ và tích lũy 15p đọc nhận ngay Rương Point!',
      'Nhấn nút "Lưu Tủ Truyện" và bật thông báo trên DocTruyen.VIP để không bỏ lỡ bất kỳ chap mới sắc nét nào ngay khi vừa ra lò!',
    ],
    hashtags: ['#TruyenTranh', '#Manga', '#Manhwa', '#Webtoon', '#DocTruyenTranh', '#AnimeManga'],
  },
  tien_hiep: {
    key: 'tien_hiep',
    icon: '⚔️',
    badge: 'TUYỆT PHẨM TIÊN HIỆP & HUYỀN HUYỄN',
    leadInTemplates: [
      'Bước vào đại thế giới tu chân kỳ ảo, nơi kẻ mạnh nghịch thiên cải mệnh, đạp phá cửu thiên thập địa:',
      'Hành trình tu luyện nhiệt huyết, những bí cảnh thượng cổ và những trận đại chiến kinh thiên động địa chính thức mở ra:',
      'Một tuyệt tác Tiên Hiệp - Kiếm Hiệp sở hữu hệ thống cảnh giới đồ sộ và cốt truyện lớp lang không thể rời mắt:',
    ],
    pocketTips: [
      'Đọc truyện trên DocTruyen.VIP đủ mốc 15 phút & 30 phút để nhận Linh Thạch (Point) đột phá Cảnh Giới từ Tập Sự lên Đại Thừa ngay trên bảng xếp hạng!',
      'Sử dụng tính năng Đề Cử (Vote Point) và đánh dấu chương tự động trên DocTruyen.VIP để cày trọn bộ đại trường thiên không lo mất dấu!',
    ],
    hashtags: ['#TienHiep', '#HuyenHuyen', '#KiemHiep', '#TuTien', '#TruyenChuHay', '#TieuThuyetTienHiep'],
  },
  ngon_tinh: {
    key: 'ngon_tinh',
    icon: '🌸',
    badge: 'SIÊU PHẨM NGÔN TÌNH & LÃNG MẠN',
    leadInTemplates: [
      'Chuyện tình ngọt ngào nhưng cũng đầy cung bậc cảm xúc, chạm đến từng góc sâu nhất trong trái tim người đọc:',
      'Một siêu phẩm ngôn tình khiến hàng vạn độc giả thổn thức bởi chiều sâu tâm lý và những khoảnh khắc khắc cốt ghi tâm:',
      'Giữa muôn vàn biến cố của số phận, liệu định mệnh có đưa hai trái tim tìm về bên nhau? Cùng đắm chìm vào tác phẩm:',
    ],
    pocketTips: [
      'Bật chế độ Nền Tối (Dark Mode) hoặc giấy Sepia ấm áp trên DocTruyen.VIP để bảo vệ mắt khi cày truyện đêm khuya và nhận thưởng Point chuyên cần!',
      'Đừng quên thả Tim, Bình luận cảm nhận của bạn dưới mỗi chương truyện tại DocTruyen.VIP để nhận thêm điểm Point tương tác mỗi ngày!',
    ],
    hashtags: ['#NgonTinh', '#TruyenNgonTinh', '#TieuThuyetTinhCam', '#NgonTinhHay', '#SungNgoc', '#TruyenChuOnline'],
  },
  trinh_tham: {
    key: 'trinh_tham',
    icon: '🕵️',
    badge: 'HỒ SƠ TRINH THÁM & BÍ ẨN KỊCH TÍNH',
    leadInTemplates: [
      'Những manh mối ẩn giấu trong bóng tối, những màn suy luận sắc bén và cú twist lật ngược mọi dự đoán ở phút chót:',
      'Thử thách khả năng suy luận của bạn với siêu phẩm trinh thám - tâm lý tội phạm gay cấn đến từng dòng chữ:',
      'Đằng sau bức màn bí ẩn là sự thật rùng mình nào đang chờ được phơi bày? Hãy chuẩn bị tinh thần trước khi lật mở trang đầu tiên:',
    ],
    pocketTips: [
      'Tùy chỉnh cỡ chữ và phông chữ đọc sách chuyên dụng trên DocTruyen.VIP để tập trung soi từng chi tiết phá án và thảo luận cùng các thám tử tại mục Bình luận!',
      'Lưu ngay vào Tủ Sách Cá Nhân trên DocTruyen.VIP để đọc liền mạch không quảng cáo và tích điểm Point đổi danh hiệu độc giả VIP!',
    ],
    hashtags: ['#TrinhTham', '#TieuThuyetTrinhTham', '#KinhDi', '#TamLyToiPham', '#TruyenTrinhTham', '#PhaAn'],
  },
  do_thi: {
    key: 'do_thi',
    icon: '🏙️',
    badge: 'CỰC PHẨM ĐÔ THỊ & TRỌNG SINH',
    leadInTemplates: [
      'Những màn đấu trí thương trường đỉnh cao, trọng sinh làm lại cuộc đời và vươn lên đỉnh vinh quang giữa lòng đô thị:',
      'Nhịp truyện nhanh, sảng văn cuốn hút cùng những tình tiết thực tế đầy kịch tính khiến độc giả đọc một mạch quên lối về:',
      'Khi cơ hội thứ hai mở ra cùng tầm nhìn vượt thời đại, nhân vật chính sẽ xoay chuyển cục diện ra sao?',
    ],
    pocketTips: [
      'Đăng nhập DocTruyen.VIP để hệ thống tự động đồng bộ tiến độ đọc giữa Điện thoại và Máy tính, kèm thưởng ngay Rương Point khi đọc mỗi ngày!',
      'Hãy dùng điểm Point tích lũy từ việc đọc truyện và bình luận để Đề Cử cho tác phẩm vươn lên Top Bảng Xếp Hạng tuần này!',
    ],
    hashtags: ['#DoThi', '#TrongSinh', '#HeThong', '#XuyenKhong', '#TruyenDoThi', '#TruyenChu'],
  },
  kinh_dien: {
    key: 'kinh_dien',
    icon: '📚',
    badge: 'TUYỆT TÁC VĂN HỌC & TIỂU THUYẾT KINH ĐIỂN',
    leadInTemplates: [
      'Một kiệt tác văn học vượt thời gian với giá trị nhân sinh sâu sắc, xứng đáng có mặt trong tủ sách của mọi tâm hồn yêu chữ:',
      'Khám phá chiều sâu tư tưởng và nghệ thuật kể chuyện bậc thầy qua tác phẩm kinh điển đã chinh phục hàng triệu độc giả toàn cầu:',
      'Từng trang viết là một lát cắt cuộc sống đầy triết lý, để lại dư âm lắng đọng thật lâu sau khi gấp sách lại:',
    ],
    pocketTips: [
      'Trải nghiệm giao diện đọc sách tinh hoa E-Reader trên DocTruyen.VIP: tùy chỉnh lề trang, khoảng cách dòng và nhận thưởng Point tri thức mỗi 15 phút đọc!',
      'Chia sẻ cảm nhận tâm đắc của bạn ở phần Bình luận dưới tác phẩm để giao lưu cùng cộng đồng yêu văn học và nhận điểm Point thưởng!',
    ],
    hashtags: ['#VanHocKinhDien', '#TieuThuyet', '#SachHayNenDoc', '#VanHocNuocNgoai', '#VanHocVietNam', '#DocSachOnline'],
  },
  blog: {
    key: 'blog',
    icon: '🎬',
    badge: 'TIÊU ĐIỂM REVIEW & TIN TỨC TRUYỆN',
    leadInTemplates: [
      'Bản tin phân tích & góc nhìn chuyên sâu từ Ban Biên Tập DocTruyen.VIP về tâm điểm đang gây sốt cộng đồng mọt truyện:',
      'Giải mã sức hút, điểm nhấn cốt truyện và những đánh giá khách quan nhất giúp bạn chọn được bộ truyện ưng ý hôm nay:',
    ],
    pocketTips: [
      'Truy cập chuyên mục Khám Phá & Bảng Xếp Hạng trên DocTruyen.VIP để cập nhật danh sách các siêu phẩm đang dẫn đầu lượt đọc và đề cử tuần này!',
    ],
    hashtags: ['#ReviewTruyen', '#TinTucManga', '#GocBinhLuan', '#TopTruyenHay', '#CongDongDocTruyen', '#BlogTruyen'],
  },
  default: {
    key: 'default',
    icon: '🔥',
    badge: 'TÂM ĐIỂM ĐỌC TRUYỆN ĐỀ CỬ HÔM NAY',
    leadInTemplates: [
      'Siêu phẩm đang làm mưa làm gió trên bảng xếp hạng với cốt truyện lôi cuốn ngay từ những chương đầu tiên:',
      'Đừng bỏ lỡ bộ truyện cực phẩm đang được cộng đồng độc giả săn đón và đề cử nhiệt tình nhất tuần qua:',
    ],
    pocketTips: [
      'Đọc truyện miễn phí 100% trên DocTruyen.VIP, tích lũy thời gian đọc 15p - 30p mỗi ngày để mở Rương Point và thăng cấp Cảnh Giới độc giả!',
    ],
    hashtags: ['#TruyenHay', '#DocTruyen', '#TruyenChu', '#TieuThuyetHay', '#TruyenMoiCapNhat', '#TopTruyen'],
  },
};

/**
 * Strips HTML tags, decodes basic entities, and normalizes whitespace
 */
export function cleanHtmlText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a Vietnamese phrase into a clean PascalCase / non-accented hashtag (#TenTruyen)
 */
export function toSeoHashtag(text: string, maxWords = 5): string {
  if (!text) return '';
  const words = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);

  if (words.length === 0) return '';
  const pascal = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return pascal.length >= 2 ? `#${pascal}` : '';
}

/**
 * Extracts, normalizes, and strictly deduplicates Vietnamese phone numbers from text
 */
export function extractAndDeduplicatePhones(text: string): string[] {
  if (!text) return [];
  const phoneRegex = /(?:\+84|0)(?:[\s.\-_]*\d){8,10}\b/g;
  const matches = text.match(phoneRegex) || [];
  const seenDigits = new Set<string>();
  const formattedList: string[] = [];

  for (const raw of matches) {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length >= 10) {
      digits = '0' + digits.slice(2);
    }
    if (digits.length < 9 || digits.length > 11) continue;
    // Ignore obvious non-phone numbers (e.g., all zeros)
    if (/^0+$/.test(digits)) continue;

    if (!seenDigits.has(digits)) {
      seenDigits.add(digits);
      // Format cleanly: 0xxx.xxx.xxx or 0xxx.xxx.xxxx
      if (digits.length === 10) {
        formattedList.push(`${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`);
      } else if (digits.length === 11) {
        formattedList.push(`${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`);
      } else {
        formattedList.push(digits);
      }
    }
  }

  return formattedList;
}

/**
 * Extracts and cleans physical address if present in article content
 */
export function extractCleanAddress(post: Post, bodyText: string): string | null {
  const directAddr = (post.address || post.location || '').trim();
  if (directAddr && directAddr.length > 5) {
    return cleanHtmlText(directAddr).replace(/^[:\-–•\s]+/, '');
  }

  const addrMatch = bodyText.match(/(?:Địa chỉ|Toạ lạc tại|Địa điểm tổ chức)\s*[:\-–]\s*([^\n.;|]{10,120})/i);
  if (addrMatch && addrMatch[1]) {
    return addrMatch[1].trim().replace(/[,.]+$/, '');
  }

  return null;
}

/**
 * Automatically detects the content category from story type, genres, and title/content
 */
export function detectStoryCategory(post: Post): ContentCategoryKey {
  if (post.type === 'blog' || post.category === 'blog') {
    return 'blog';
  }
  if (post.type === 'comic') {
    return 'comic';
  }

  const genresStr = Array.isArray(post.genres)
    ? post.genres.join(' ').toLowerCase()
    : String(post.category_name || post.category || '').toLowerCase();
  const titleAndDesc = `${post.title || ''} ${post.excerpt || ''} ${post.description || ''}`.toLowerCase();
  const combined = `${genresStr} ${titleAndDesc}`;

  if (/(manga|manhwa|manhua|webtoon|truyện tranh|comic)/.test(combined)) {
    return 'comic';
  }
  if (/(tiên hiệp|kiếm hiệp|huyền huyễn|tu tiên|dị giới|võ hiệp|linh dị tu chân)/.test(combined)) {
    return 'tien_hiep';
  }
  if (/(trinh thám|hình sự|tâm lý tội phạm|bí ẩn|kinh dị|mật mã|thám tử|phá án)/.test(combined)) {
    return 'trinh_tham';
  }
  if (/(ngôn tình|sủng|ngược|cổ đại|hiện đại|lãng mạn|nữ phụ|tổng tài|hào môn)/.test(combined)) {
    return 'ngon_tinh';
  }
  if (/(đô thị|trọng sinh|hệ thống|xuyên không|mạt thế|võng du|thương trường)/.test(combined)) {
    return 'do_thi';
  }
  if (/(văn học|kinh điển|tiểu thuyết|danh tác|tác phẩm|nhà giả kim|tâm hồn|triết lý|lịch sử|hồi ký|tản văn)/.test(combined)) {
    return 'kinh_dien';
  }

  return 'default';
}

/**
 * Deterministic hash index selector so each story consistently gets a natural template variant
 */
function pickVariant<T>(items: T[], seedStr: string): T {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

/**
 * Builds the 5-part SEO & GEO optimized Facebook Fanpage status for DocTruyen.VIP:
 * 1. Hook Headline: Tiêu đề nổi bật kèm icon theo danh mục
 * 2. Đoạn dẫn nhập & Giá trị trải nghiệm (Storytelling Hook)
 * 3. Tự động phát hiện và định dạng rõ ràng (Tác giả, Thể loại, Quy mô, Địa chỉ chuẩn & Hotline 24/7 khử trùng lặp)
 * 4. Mẹo bỏ túi & Kêu gọi hành động (CTA)
 * 5. Cụm 8 – 12 Hashtags chuẩn SEO Facebook
 */
export function buildOptimizedFacebookStatus(post: Post, postUrl: string): string {
  const rawTitle = cleanHtmlText(post.title || 'Tuyệt Phẩm Truyện Đề Cử Tại DocTruyen.VIP')
    .replace(/^bản sao của\s+/i, '')
    .trim();

  const catKey = detectStoryCategory(post);
  const config = CATEGORY_CONFIGS[catKey];

  // =========================================================================
  // 1. HOOK HEADLINE: Tiêu đề nổi bật kèm icon theo danh mục
  // =========================================================================
  const hookHeadline = `${config.icon} [${config.badge}] • ${rawTitle.toUpperCase()}`;

  // =========================================================================
  // 2. ĐOẠN DẪN NHẬP & GIÁ TRỊ TRẢI NGHIỆM (Storytelling Hook)
  // =========================================================================
  const leadIn = pickVariant(config.leadInTemplates, rawTitle);
  const rawBody = cleanHtmlText(
    post.seo_description || post.excerpt || post.description || post.content_html || post.content || ''
  );

  // Clean out boilerplate prefixes if present
  let cleanExcerpt = rawBody
    .replace(/^(tóm tắt|giới thiệu|nội dung|mô tả)\s*[:\-–]\s*/i, '')
    .trim();

  if (!cleanExcerpt || cleanExcerpt.length < 30) {
    cleanExcerpt = `Khám phá ngay "${rawTitle}" — tác phẩm sở hữu mạch truyện lôi cuốn, chiều sâu nhân vật ấn tượng và những nút thắt bất ngờ khiến người đọc không thể rời mắt từ chương đầu tiên.`;
  } else if (cleanExcerpt.length > 340) {
    const sliced = cleanExcerpt.slice(0, 340);
    const lastSpace = sliced.lastIndexOf(' ');
    cleanExcerpt = `${(lastSpace > 200 ? sliced.slice(0, lastSpace) : sliced).replace(/[,.!?;:\s]+$/, '')}...`;
  }

  const storytellingBlock = `✨ ${leadIn}\n\n📖 "${cleanExcerpt}"`;

  // =========================================================================
  // 3. TỰ ĐỘNG PHÁT HIỆN VÀ ĐỊNH DẠNG RÕ RÀNG (Structured Info & Clean Address/Phone)
  // =========================================================================
  const detailsLines: string[] = [];

  // Author
  const authorName = cleanHtmlText(post.author_name || post.author || '');
  if (authorName && authorName.toLowerCase() !== 'unknown' && authorName.toLowerCase() !== 'đang cập nhật') {
    detailsLines.push(`✍️ Tác giả: ${authorName}`);
  } else if (catKey !== 'blog') {
    detailsLines.push(`✍️ Tác giả: Tuyển tập Chọn Lọc DocTruyen.VIP`);
  }

  // Genres / Category
  const genresList: string[] = Array.isArray(post.genres)
    ? post.genres.map((g: string) => cleanHtmlText(g)).filter(Boolean)
    : post.category_name
    ? [cleanHtmlText(post.category_name)]
    : [];

  if (genresList.length > 0) {
    detailsLines.push(`🏷️ Thể loại: ${genresList.slice(0, 5).join(', ')}`);
  } else {
    const defaultGenreLabel =
      catKey === 'comic'
        ? 'Truyện Tranh, Manga / Webtoon'
        : catKey === 'blog'
        ? 'Review & Điểm Tin Văn Học'
        : 'Tiểu Thuyết, Truyện Chữ Đặc Sắc';
    detailsLines.push(`🏷️ Thể loại: ${defaultGenreLabel}`);
  }

  // Scale / Chapters / Status
  const totalChapters = Number(post.total_chapters || 0);
  const statusLabel =
    post.status === 'completed'
      ? 'Trọn bộ Full'
      : post.type === 'blog'
      ? 'Bài phân tích chuyên sâu'
      : 'Bản dịch chuẩn • Cập nhật liên tục';

  if (totalChapters > 0) {
    detailsLines.push(`📚 Quy mô: ${totalChapters} chương (${statusLabel})`);
  } else if (post.type !== 'blog') {
    detailsLines.push(`📚 Trạng thái: ${statusLabel} (Chất lượng Full HD)`);
  }

  // Address detection & cleaning
  const fullSourceText = `${rawBody} ${cleanHtmlText(post.content_html || post.content || '')}`;
  const detectedAddress = extractCleanAddress(post, fullSourceText);
  if (detectedAddress) {
    detailsLines.push(`📍 Địa chỉ: ${detectedAddress}`);
  } else {
    detailsLines.push(`📍 Địa chỉ đọc trực tuyến: Hệ sinh thái DocTruyen.VIP (Hỗ trợ đa nền tảng Web & Mobile 24/7)`);
  }

  // Hotline detection & automatic deduplication
  const rawPhoneSource = `${post.phone || ''} ${post.hotline || ''} ${fullSourceText}`;
  const uniquePhones = extractAndDeduplicatePhones(rawPhoneSource);
  if (uniquePhones.length > 0) {
    detailsLines.push(`📞 Hotline tư vấn & đặt dịch vụ 24/7: ${uniquePhones.join(' - ')}`);
  } else {
    detailsLines.push(`📞 Hỗ trợ độc giả & Bản quyền 24/7: Trực tuyến tại Fanpage & Cộng đồng Telegram @doctruyenvip_update_bot`);
  }

  const structuredDetailsBlock = detailsLines.join('\n');

  // =========================================================================
  // 4. MẸO BỎ TÚI & KÊU GỌI HÀNH ĐỘNG (CTA)
  // =========================================================================
  const pocketTip = pickVariant(config.pocketTips, rawTitle);
  const ctaBlock = [
    `💡 Mẹo bỏ túi cho độc giả: ${pocketTip}`,
    ``,
    `👉 Đọc ngay bản đẹp sắc nét Full HD hoàn toàn miễn phí tại:`,
    `🔗 ${postUrl}`,
  ].join('\n');

  // =========================================================================
  // 5. CỤM 8 – 12 HASHTAGS CHUẨN SEO FACEBOOK
  // =========================================================================
  const hashtagSet = new Set<string>();
  const addTag = (tag: string) => {
    const cleaned = tag.trim();
    if (cleaned && cleaned.startsWith('#') && cleaned.length > 2) {
      hashtagSet.add(cleaned);
    }
  };

  // Core Brand & GEO SEO Hashtags
  addTag('#DocTruyenVIP');
  addTag('#DocTruyenOnline');

  // Dynamic Title Hashtag
  const titleTag = toSeoHashtag(rawTitle, 4);
  if (titleTag) addTag(titleTag);

  // Dynamic Author Hashtag
  if (authorName && authorName.length <= 28 && !/đang cập nhật|unknown|ban biên tập/i.test(authorName)) {
    const authorTag = toSeoHashtag(authorName, 4);
    if (authorTag) addTag(authorTag);
  }

  // Dynamic Genre Hashtags from story
  for (const g of genresList.slice(0, 3)) {
    const gTag = toSeoHashtag(g, 3);
    if (gTag) addTag(gTag);
  }

  // Category-specific SEO Hashtags
  for (const cTag of config.hashtags) {
    if (hashtagSet.size >= 11) break;
    addTag(cTag);
  }

  // Fallback high-volume Vietnamese reading hashtags to guarantee 8 - 12 hashtags
  const fallbackSeoTags = [
    '#TruyenHayMoiNgay',
    '#DocTruyenMienPhi',
    '#MotTruyenVietNam',
    '#KhoTruyenFull',
    '#ReviewTruyenHay',
    '#WebtoonVietNam',
    '#TieuThuyetOnline',
    '#SachHayMoiNgay',
  ];
  for (const fbTag of fallbackSeoTags) {
    if (hashtagSet.size >= 10) break;
    addTag(fbTag);
  }

  const finalHashtags = Array.from(hashtagSet).slice(0, 12).join(' ');

  return [
    hookHeadline,
    storytellingBlock,
    structuredDetailsBlock,
    ctaBlock,
    finalHashtags,
  ].join('\n\n');
}
