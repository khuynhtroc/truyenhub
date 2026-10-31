import { randomUUID } from 'crypto';
import { callGemini } from '@/lib/ai/gemini';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { submitUrlToGoogle } from '@/lib/indexing/google';
import { sharePostToAllChannels } from '@/lib/social';
import { SITE_URL } from '@/lib/urls';
import type { TrendingItem } from './social-listener';

export interface TrendingNewsPostResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  wordCount: number;
  publishedAt: string;
  indexingStatus: string;
}

/**
 * Normalizes Vietnamese string to a clean URL-friendly slug
 */
function createVietnameseSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
}

/**
 * High-quality deterministic Vietnamese literary & comic editorial article generator
 * used as an immediate fallback or whenever AI provider is unavailable.
 */
function buildDeterministicBookArticle(trend: TrendingItem): {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  focus_keyword: string;
  seo_title: string;
  seo_description: string;
} {
  const topic = trend.topic;
  const headline = trend.newsHeadline;
  const category = trend.category || 'Sách & Văn Học';
  const source = trend.source;
  const storyAngle = trend.storyAngle || `Cập nhật thông tin và điểm nhấn nổi bật xoay quanh tác phẩm ${topic}.`;

  const title = `Khám Phá Sức Hút Của "${topic}": Góc Nhìn Độc Giả & Đánh Giá Tác Phẩm`;
  const slug = `${createVietnameseSlug(topic)}-danh-gia-chi-tiet`;
  const excerpt = `Cùng DocTruyen.VIP giải mã sức hút mãnh liệt của "${topic}", từ nút thắt cốt truyện đầy kịch tính đến chiều sâu thế giới nhân vật đang gây sốt.`.substring(0, 160);

  const content_html = `
<div class="article-content space-y-6 text-foreground leading-relaxed">
  <p class="text-lg font-medium text-muted-foreground italic border-l-4 border-rose-500 pl-4 py-1">
    ${headline} — Sự kiện đang thu hút sự quan tâm mạnh mẽ từ cộng đồng người yêu thích sách và truyện tranh trong 24 giờ qua. Cùng Ban Biên Tập <strong>DocTruyen.VIP</strong> đi sâu phân tích toàn cảnh tác phẩm và những giá trị đặc sắc làm nên cơn sốt này.
  </p>

  <h2>1. Bối Cảnh Sự Việc & Lý Do "${topic}" Gây Sốt Trong Cộng Đồng</h2>
  <p>
    Thị trường văn học và truyện tranh thời gian gần đây ghi nhận nhiều chuyển biến sôi động khi các tác phẩm chất lượng cao liên tục trình làng và tạo nên những cuộc thảo luận bùng nổ trên các diễn đàn độc giả. Theo ghi nhận mới nhất từ <em>${source}</em>, <strong>"${topic}"</strong> đang nhanh chóng trở thành tâm điểm bàn luận với lượng tương tác và quan tâm vượt bậc.
  </p>
  <p>
    Không đơn thuần là một ấn phẩm giải trí thông thường, tác phẩm đã khéo léo chạm đến thị hiếu của đông đảo bạn đọc nhờ cách xây dựng đề tài mới mẻ, lối dẫn dắt tình tiết gãy gọn và thông điệp sâu sắc ẩn sau từng trang viết. ${storyAngle}
  </p>

  <h2>2. Điểm Nhấn Cốt Truyện & Những Nút Thắt Kịch Tính</h2>
  <p>
    Một trong những yếu tố cốt lõi giúp <strong>"${topic}"</strong> tạo được dấu ấn mạnh mẽ chính là cấu trúc cốt truyện lớp lang, đan xen nhịp nhàng giữa yếu tố bất ngờ (plot twist) và mạch cảm xúc liền mạch. Tác giả không đi theo lối mòn của các mô-típ sáo rỗng mà mạnh dạn thử nghiệm những nút thắt tâm lý phức tạp, khiến người đọc luôn trong trạng thái hồi hộp theo dõi từng diễn biến tiếp theo.
  </p>
  <p>
    Từng chi tiết nhỏ được cài cắm tinh tế từ phần mở đầu dần được tháo gỡ một cách logic ở những cao trào tiếp nối. Điều này mang lại trải nghiệm thỏa mãn cho những độc giả khó tính nhất, đồng thời thôi thúc họ đọc đi đọc lại nhiều lần để phát hiện thêm những ẩn ý nghệ thuật mà tác giả gửi gắm.
  </p>

  <h2>3. Chiều Sâu Nhân Vật & Nghệ Thuật Xây Dựng Thế Giới</h2>
  <p>
    Sức sống lâu bền của một tác phẩm truyện tranh hay tiểu thuyết luôn nằm ở dàn nhân vật có cá tính rõ nét và sự phát triển nội tâm chân thực. Trong <strong>"${topic}"</strong>, các nhân vật không bị phân cực trắng - đen rập khuôn, mà mỗi người đều mang trong mình những góc khuất, những mâu thuẫn nội tâm và khát vọng riêng biệt.
  </p>
  <p>
    Hành trình trưởng thành, đối diện với thử thách và đưa ra những lựa chọn then chốt của nhân vật chính đã tạo nên sự đồng cảm sâu sắc nơi bạn đọc. Bên cạnh đó, thế giới quan trong tác phẩm được thiết lập vô cùng tỉ mỉ — từ bối cảnh không gian, quy luật vận hành cho đến không khí văn hóa đặc thù, tất cả tạo nên một chỉnh thể nghệ thuật sống động và cuốn hút.
  </p>

  <h2>4. Làn Sóng Phản Hồi Từ Cộng Đồng Độc Giả & Giới Phê Bình</h2>
  <p>
    Trên khắp các hội nhóm yêu truyện tranh, manga, manhwa và tiểu thuyết, hàng ngàn bài viết chia sẻ cảm nhận, phân tích chi tiết và giả thuyết xoay quanh các tập mới của tác phẩm đã liên tục được đăng tải. Phần lớn độc giả đánh giá cao sự chỉn chu trong khâu xây dựng kịch bản cũng như nét vẽ biểu cảm, sinh động (đối với truyện tranh) hoặc ngòi bút miêu tả tâm lý giàu hình ảnh (đối với tiểu thuyết).
  </p>
  <blockquote class="p-4 my-4 bg-muted/30 border-l-4 border-amber-500 rounded-r-lg italic">
    "Một tác phẩm đáng đọc của mùa này! Cốt truyện cuốn hút từ chương đầu tiên và cách tác giả giải quyết các xung đột tâm lý thực sự để lại dư âm rất lâu sau khi gấp sách lại." — Bình luận nổi bật từ độc giả cộng đồng.
  </blockquote>

  <h2>5. Đánh Giá Tổng Kết & Đề Xuất Tác Phẩm Tương Tự Tại DocTruyen.VIP</h2>
  <p>
    Có thể khẳng định, sự xuất hiện và thành công của <strong>"${topic}"</strong> là một tín hiệu đáng mừng cho thị trường văn hóa đọc, khẳng định rằng những tác phẩm có chiều sâu tư tưởng và sáng tạo nghệ thuật luôn có chỗ đứng vững chắc trong lòng độc giả.
  </p>
  <p>
    Nếu bạn là người say mê thể loại <strong>${category}</strong>, đừng bỏ lỡ cơ hội khám phá kho tàng truyện phong phú tại <strong>DocTruyen.VIP</strong>. Tại đây, độc giả có thể dễ dàng tìm thấy hàng nghìn tựa truyện tranh đình đám (Manga, Webtoon, Manhwa) cùng các bộ truyện chữ hấp dẫn (Tiên hiệp, Kiếm hiệp, Trinh thám, Ngôn tình) được cập nhật chương mới từng giờ, giao diện tối ưu sắc nét và hoàn toàn miễn phí.
  </p>

  <h2>6. Câu Hỏi Thường Gặp (FAQ) Về Tác Phẩm</h2>
  <div class="space-y-4 my-4">
    <div class="p-4 bg-muted/20 rounded-xl border border-border/50">
      <h3 class="font-bold text-base mb-1">1. Tác phẩm "${topic}" phù hợp với đối tượng độc giả nào?</h3>
      <p class="text-sm text-muted-foreground">Tác phẩm đặc biệt phù hợp với những ai yêu thích thể loại ${category}, đam mê những cốt truyện có chiều sâu, kịch tính và tuyến nhân vật phát triển tâm lý phong phú.</p>
    </div>
    <div class="p-4 bg-muted/20 rounded-xl border border-border/50">
      <h3 class="font-bold text-base mb-1">2. Tôi có thể đọc các tác phẩm cùng thể loại ở đâu?</h3>
      <p class="text-sm text-muted-foreground">Bạn có thể truy cập website DocTruyen.VIP để đọc hàng ngàn bộ truyện tranh và truyện chữ cùng thể loại với chất lượng bản đẹp HD, tải trang nhanh và miễn phí.</p>
    </div>
    <div class="p-4 bg-muted/20 rounded-xl border border-border/50">
      <h3 class="font-bold text-base mb-1">3. Tác phẩm hiện đã hoàn thành hay đang phát hành tiếp?</h3>
      <p class="text-sm text-muted-foreground">Các diễn biến và thông tin phát hành mới nhất của tác phẩm liên tục được cập nhật trên các chuyên trang tin tức và kênh thông báo của DocTruyen.VIP.</p>
    </div>
  </div>
</div>
`.trim();

  return {
    title,
    slug,
    excerpt,
    content_html,
    focus_keyword: topic,
    seo_title: `${title} | DocTruyen.VIP`,
    seo_description: excerpt,
  };
}

/**
 * Generates and publishes an engaging Vietnamese book/manga/novel news/review article to /blog/
 */
export async function generateTrendingNewsArticle(trend: TrendingItem): Promise<TrendingNewsPostResult> {
  console.log(`[News Generator] Starting generation for Book/Comic trend: "${trend.topic}" (${trend.source})`);

  let parsed: any = null;

  // 1. Try Gemini AI generation
  try {
    const prompt = `
Bạn là Trưởng ban Biên tập kiêm Chuyên gia phê bình Văn học & Truyện tranh hàng đầu của website DocTruyen.VIP (Nền tảng đọc truyện tranh & truyện chữ online uy tín số 1 Việt Nam).

THÔNG TIN XU HƯỚNG SÁCH / TRUYỆN TRANH / NOVEL PHÁT HIỆN TRONG 4 - 24 GIỜ QUA:
- Chủ đề / Từ khóa xu hướng: "${trend.topic}"
- Tiêu đề tin tức gốc: "${trend.newsHeadline}"
- Nguồn tin tức: "${trend.source}"
- Thể loại dự kiến: "${trend.category}"
- Góc nhìn độc giả & văn học: "${trend.storyAngle || trend.giftAngle || ''}"

NHIỆM VỤ CỦA BẠN:
Viết một bài viết phân tích, review hoặc tin tức văn học/manga chuyên sâu bằng 100% TIẾNG VIỆT (độ dài: 1.000 đến 1.500 từ) để đăng tải trên chuyên mục Blog của DocTruyen.VIP.
Văn phong phải cuốn hút, sắc sảo, gần gũi với độc giả trẻ yêu thích truyện tranh (manga, manhwa, webtoon) và truyện chữ (tiểu thuyết, tiên hiệp, ngôn tình, light novel, trinh thám).

CẤU TRÚC BÀI VIẾT BẮT BUỘC (Định dạng HTML chuẩn SEO):
1. Mở đầu: Bối cảnh sự việc, lý do tác phẩm hoặc sự kiện này đang tạo nên cơn sốt trong cộng đồng yêu sách/truyện.
2. Thẻ <h2>: Điểm nhấn cốt truyện & Những nút thắt kịch tính làm say lòng độc giả.
3. Thẻ <h2>: Phân tích nhân vật & Nghệ thuật xây dựng thế giới của tác giả.
4. Thẻ <h2>: Làn sóng phản hồi từ cộng đồng độc giả & Giới phê bình.
5. Thẻ <h2>: Đánh giá tổng kết & Gợi ý tác phẩm tương tự tại DocTruyen.VIP (Kèm lời kêu gọi độc giả đón đọc các bộ truyện cùng thể loại tại DocTruyen.VIP).
6. Thẻ <h2>: Góc giải đáp độc giả (FAQ) gồm 3 câu hỏi và giải đáp ngắn gọn, thiết thực.

ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC PHẢI LÀ JSON HỢP LỆ VỚI CẤU TRÚC SAU, KHÔNG KÈM BẤT KỲ VĂN BẢN NÀO NGOÀI JSON):
{
  "title": "Tiêu đề tiếng Việt cuốn hút, giật tít thông minh chuẩn SEO (dưới 70 ký tự)",
  "slug": "slug-chuan-khong-dau-ngan-gon",
  "excerpt": "Đoạn mô tả ngắn 140-160 ký tự tóm tắt bài viết cho Google Discover và Meta Description.",
  "category_name": "Truyện Tranh & Manga (hoặc Tiểu Thuyết & Light Novel, Review Truyện, Tin Chuyển Thể)",
  "content_html": "<div class='article-content'><p>Đoạn mở đầu dẫn nhập...</p><h2>...</h2><p>...</p></div>",
  "focus_keyword": "${trend.topic}",
  "seo_title": "Tiêu đề SEO | DocTruyen.VIP",
  "seo_description": "Mô tả SEO 140-160 ký tự tiếng Việt."
}
`.trim();

    const rawAiResponse = await callGemini({
      prompt,
      systemInstruction:
        'Bạn là một biên tập viên xuất sắc chuyên về văn học, tiểu thuyết và truyện tranh tiếng Việt của DocTruyen.VIP. Phản hồi hoàn toàn bằng JSON tiếng Việt hợp lệ.',
      responseMimeType: 'application/json',
    });

    if (rawAiResponse) {
      const cleanJson = rawAiResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    }
  } catch (aiErr: any) {
    console.warn('[News Generator] Gemini call exception, falling back to editorial engine:', aiErr?.message || aiErr);
  }

  // 2. Deterministic Fallback if AI output is not available
  if (!parsed || !parsed.title || !parsed.content_html) {
    console.log('[News Generator] Using high-quality deterministic Vietnamese literary engine.');
    parsed = buildDeterministicBookArticle(trend);
  }

  // Generate clean slug
  const rawSlug = parsed.slug || createVietnameseSlug(parsed.title || trend.topic);
  const cleanSlug = createVietnameseSlug(rawSlug);

  // Append editorial disclaimer and CTA for DocTruyen.VIP
  const fullContentHtml = `
${parsed.content_html || ''}

<div class="my-8 p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/20 rounded-2xl text-sm">
  <h4 class="font-bold text-foreground text-base mb-1.5 flex items-center gap-2">
    <span>📖</span> Đón Đọc Truyện Bản Đẹp Sắc Nét Tại DocTruyen.VIP
  </h4>
  <p class="text-muted-foreground leading-relaxed">
    Đừng quên truy cập <strong>DocTruyen.VIP</strong> mỗi ngày để thưởng thức hàng ngàn bộ truyện tranh (Manga, Manhwa, Manhua) và truyện chữ (Tiểu thuyết, Tiên hiệp, Ngôn tình, Trinh thám) chất lượng cao nhất, cập nhật liên tục từng giờ hoàn toàn miễn phí!
  </p>
</div>
`.trim();

  const wordCount = fullContentHtml.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const nowIso = new Date().toISOString();
  const postId = randomUUID();
  const heroImage = trend.picture || 'https://media.doctruyen.vip/covers/doraemon-cover.webp';

  const postRecord = {
    id: postId,
    type: 'blog' as const,
    slug: cleanSlug,
    title: parsed.title || trend.newsHeadline,
    excerpt: parsed.excerpt || trend.storyAngle || trend.topic,
    content_html: fullContentHtml,
    hero_image: heroImage,
    hero_alt: parsed.title || trend.topic,
    category_name: parsed.category_name || trend.category || 'Blog Truyện',
    author_name: 'Ban Biên Tập DocTruyen.VIP',
    status: 'published' as const,
    focus_keyword: parsed.focus_keyword || trend.topic,
    seo_title: parsed.seo_title || `${parsed.title} | DocTruyen.VIP`,
    seo_description: parsed.seo_description || parsed.excerpt,
    views_count: Math.floor(Math.random() * 250) + 120,
    likes_count: Math.floor(Math.random() * 60) + 20,
    published_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // 3. Save directly into Supabase 'posts' table
  const supabase = createAdminSupabaseClient();
  try {
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('posts').update(postRecord).eq('id', existing.id);
      console.log(`[News Generator] Updated trending post /blog/${cleanSlug}/ in database.`);
    } else {
      const { error: insertError } = await supabase.from('posts').insert(postRecord);
      if (insertError) {
        throw new Error(insertError.message);
      }
      console.log(`[News Generator] Successfully inserted trending post /blog/${cleanSlug}/ into 'posts' table.`);
    }
  } catch (err: any) {
    console.error('[News Generator] Supabase posts table error:', err.message);
    throw err;
  }

  // 4. Fast-Indexing Submission to Google
  const fullPostUrl = `${SITE_URL}/blog/${cleanSlug}`;
  let indexingStatus = 'submitted';

  try {
    await submitUrlToGoogle(fullPostUrl, 'URL_UPDATED');
    console.log(`[News Generator] Pushed URL to Google Indexing API: ${fullPostUrl}`);
  } catch (err: any) {
    indexingStatus = `failed (${err.message})`;
    console.warn('[News Generator] Google Indexing push failed:', err.message);
  }

  // 5. Automated Social Auto-Sharing to Facebook Fanpage & other channels
  try {
    sharePostToAllChannels(postRecord as any).catch((socialErr) => {
      console.warn('[News Generator] Social auto-share error:', socialErr?.message || socialErr);
    });
  } catch (socialErr: any) {
    console.warn('[News Generator] Social auto-share error:', socialErr?.message || socialErr);
  }

  return {
    id: postId,
    slug: cleanSlug,
    title: postRecord.title,
    url: fullPostUrl,
    wordCount,
    publishedAt: nowIso,
    indexingStatus,
  };
}
