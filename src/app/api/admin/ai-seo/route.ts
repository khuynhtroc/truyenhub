import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, type, author_name, genres, description } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề truyện là bắt buộc để AI phân tích SEO" },
        { status: 400 }
      );
    }

    const typeLabel = type === "comic" ? "Truyện Tranh" : type === "book" ? "Sách Ebook" : "Truyện Chữ";
    const author = author_name || "Nhiều Tác Giả";
    const genreList = Array.isArray(genres) ? genres.join(", ") : genres || "Đặc sắc, Hấp dẫn";

    // AI Algorithmic SEO Intelligence Engine
    const cleanTitle = title.trim();
    
    // 1. Optimized SEO Title (Under 60 chars, Google High CTR)
    const seoTitle = `Đọc ${typeLabel} ${cleanTitle} Full Bản Đẹp | DocTruyen.vip`.slice(0, 65);

    // 2. Optimized Meta Description (150 - 160 chars with CTA)
    let seoDescription = `Đọc online ${typeLabel} ${cleanTitle} của tác giả ${author} trọn bộ full mới nhất. Thể loại ${genreList}. Trải nghiệm đọc mượt mà, không quảng cáo tại DocTruyen.vip.`;
    if (seoDescription.length > 160) {
      seoDescription = seoDescription.slice(0, 157) + "...";
    }

    // 3. Excerpt (Teaser 1 câu)
    const excerpt = description
      ? description.replace(/<[^>]*>?/gm, "").slice(0, 120).trim() + "..."
      : `Khám phá tác phẩm ${cleanTitle} hấp dẫn của ${author} trọn bộ tại DocTruyen.vip.`;

    // 4. Focus Keyword
    const focusKeyword = `Đọc ${cleanTitle}`;

    // 5. Keyword list (LSI + Search Intent)
    const keywords = [
      `đọc ${cleanTitle}`,
      `${cleanTitle} full`,
      `${cleanTitle} bản đẹp`,
      `${cleanTitle} chap mới`,
      `${cleanTitle} tác giả ${author}`,
      `đọc ${typeLabel.toLowerCase()} ${cleanTitle}`,
      `${cleanTitle} doctruyen`,
      `${cleanTitle} trọn bộ`,
    ];

    // 6. Tags
    const tags = Array.from(
      new Set([
        cleanTitle,
        typeLabel,
        author,
        ...(Array.isArray(genres) ? genres : String(genreList).split(",").map((g) => g.trim())),
        "Bản Full",
        "HD Đẹp",
      ])
    ).filter(Boolean);

    // 7. Structured FAQs for Google Rich Snippets
    const suggestedFaqs = [
      {
        question: `Tác phẩm ${cleanTitle} thuộc thể loại gì và do ai sáng tác?`,
        answer: `${cleanTitle} là tác phẩm ${typeLabel.toLowerCase()} hấp dẫn của tác giả ${author}, thuộc các thể loại: ${genreList}.`,
      },
      {
        question: `Đọc trọn bộ ${cleanTitle} ở đâu miễn phí chất lượng cao?`,
        answer: `Bạn có thể đọc trọn bộ ${cleanTitle} bản đẹp chuẩn HD, tốc độ cao không gián đoạn tại website DocTruyen.vip.`,
      },
      {
        question: `${cleanTitle} có bản đọc trên điện thoại (iOS, Android) không?`,
        answer: `Có, DocTruyen.vip hỗ trợ đọc mượt mà trên mọi thiết bị máy tính, điện thoại Android và iPhone/iPad với chế độ ban đêm và đồng bộ tủ truyện.`,
      },
    ];

    return NextResponse.json({
      success: true,
      seo: {
        seoTitle,
        seoDescription,
        focusKeyword,
        keywords,
        tags,
        excerpt,
        suggestedFaqs,
      },
    });
  } catch (error: any) {
    console.error("AI SEO generator error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tạo SEO AI" },
      { status: 500 }
    );
  }
}
