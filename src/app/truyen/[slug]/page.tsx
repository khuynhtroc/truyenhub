import { Metadata } from "next";
import { cache } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/mock-data";
import { formatNumber, normalizeMediaUrl } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

const SLUG_REDIRECTS: Record<string, string> = {
  "bac-si-quai-di": "bac-si-quai-di-ban-moi",
  "doraemon": "doraemon-truyen-ngan",
  "jindo-con-loc-san-co": "jindo-1-duong-dan-den-khung-thanh",
  "o-long-vien": "o-long-vien-bo-kinh-dien",
  "co-be-tinh-nghich-asari": "co-be-tinh-nghich",
};
import { 
  Eye, 
  Heart, 
  BookOpen, 
  Bookmark, 
  Coins, 
  Share2, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2
} from "lucide-react";
import { CommentSection } from "@/components/comment/CommentSection";
import { ChapterTableOfContents } from "@/components/story/ChapterTableOfContents";
import { StoryInteractiveHero } from "@/components/story/StoryInteractiveHero";
import { StoryReadCtaButton } from "@/components/story/StoryReadCtaButton";
import { SafeImage } from "@/components/common/SafeImage";
import { StoryViewTracker } from "@/components/common/StoryViewTracker";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Story, Chapter, StoryVersion } from "@/types";
import { getSeriesGroupForSlug } from "@/lib/series-versions";

export const revalidate = 120;

const getStoryBySlug = cache(async (slug: string) => {
  try {
    const supabase = getPublicSupabase();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as unknown as Story) || null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let story = await getStoryBySlug(slug);

  if (!story) {
    story = MOCK_STORIES.find((s) => s.slug === slug) || null;
  }

  if (!story) {
    return {
      title: "Truyện Không Tồn Tại",
    };
  }

  const typeLabel = story.type === "comic" ? "Truyện Tranh" : "Truyện Chữ";
  const title = `Đọc truyện ${story.title} Full HD`;
  const fullTitle = `${title} | DocTruyen.vip`;
  const cleanDesc = (story.description || "").replace(/<[^>]*>/g, "").trim();
  const description = cleanDesc
    ? `${cleanDesc.slice(0, 150)}... Hãy cùng đọc truyện ${story.title} với DocTruyen.VIP nhé!`
    : `Đọc ${typeLabel.toLowerCase()} ${story.title} online miễn phí chất lượng cao tại DocTruyen.vip. Hãy cùng đọc truyện ${story.title} với DocTruyen.VIP nhé!`;

  const coverUrl = story.cover_url
    ? normalizeMediaUrl(story.cover_url)
    : "https://media.doctruyen.vip/covers/doraemon-cover.webp";

  return {
    title,
    description,
    keywords: [
      story.title,
      `đọc truyện ${story.title}`,
      `${story.title} full`,
      `${story.title} doctruyen`,
      story.author_name || "",
      typeLabel,
      ...(story.genres || []),
    ].filter(Boolean),
    alternates: {
      canonical: `https://doctruyen.vip/truyen/${slug}`,
    },
    openGraph: {
      type: "article",
      locale: "vi_VN",
      url: `https://doctruyen.vip/truyen/${slug}`,
      siteName: "DocTruyen.vip",
      title: fullTitle,
      description,
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 1200,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [coverUrl],
    },
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (SLUG_REDIRECTS[slug]) {
    redirect(`/truyen/${SLUG_REDIRECTS[slug]}`);
  }

  let story: Story | null = null;
  let chapters: Chapter[] = [];

  try {
    const dbStory = await getStoryBySlug(slug);

    if (dbStory) {
      story = dbStory;
      const supabase = getPublicSupabase();
      const { data: dbChapters } = await supabase
        .from("chapters")
        .select("id, story_id, chapter_number, title, is_locked, price_coins, created_at")
        .eq("story_id", story.id)
        .order("chapter_number", { ascending: true });
      if (dbChapters) {
        chapters = dbChapters as unknown as Chapter[];
      }
    }
  } catch (error) {
    console.error("Failed to load story from Supabase:", error);
  }

  if (!story) {
    story = MOCK_STORIES.find((s) => s.slug === slug) || null;
    if (story) {
      chapters = MOCK_CHAPTERS[slug] || [];
    }
  }

  if (!story) {
    notFound();
  }

  // Load sibling versions for multi-edition series
  let versions: StoryVersion[] = [];
  const seriesGroup = getSeriesGroupForSlug(story.slug);

  if (seriesGroup) {
    try {
      const supabase = getPublicSupabase();
      const siblingSlugs = seriesGroup.versions.map((v) => v.slug);
      const { data: siblings } = await supabase
        .from("stories")
        .select("id, title, slug, total_chapters, type")
        .in("slug", siblingSlugs);

      if (siblings && siblings.length > 1) {
        versions = siblings
          .map((s) => {
            const matchMeta = seriesGroup.versions.find((v) => v.slug === s.slug);
            return {
              id: s.id,
              title: s.title,
              slug: s.slug,
              version_name: matchMeta?.version_name || s.title,
              total_chapters: s.total_chapters,
              type: s.type,
            };
          })
          .sort((a, b) => {
            const idxA = seriesGroup.versions.findIndex((v) => v.slug === a.slug);
            const idxB = seriesGroup.versions.findIndex((v) => v.slug === b.slug);
            return idxA - idxB;
          });
      }
    } catch (e) {
      console.error("Failed to load sibling versions:", e);
    }
  }

  if (chapters.length === 0) {
    chapters = [
      {
        id: "sample-1",
        story_id: story.id,
        chapter_number: 1,
        title: "Chương 1: Khởi đầu",
        is_locked: false,
        price_coins: 0,
        created_at: story.created_at,
      },
    {
      id: "sample-2",
      story_id: story.id,
      chapter_number: 2,
      title: "Chương 2: Biến cố bất ngờ",
      is_locked: false,
      price_coins: 0,
      created_at: story.created_at,
    },
    {
      id: "sample-3",
      story_id: story.id,
      chapter_number: 3,
      title: "Chương 3: Trận chiến quyết định (VIP)",
      is_locked: true,
      price_coins: 5,
      created_at: story.created_at,
    },
  ];
  }

  const firstChapterNumber = chapters[0]?.chapter_number || 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-8">
        {/* Real View Tracker */}
        <StoryViewTracker slug={story.slug} storyId={story.id} />

        {/* Story Hero Header */}
        <section className="relative rounded-3xl overflow-hidden bg-card border border-border/50 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 shadow-sm">
          {/* Blurred backdrop image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl pointer-events-none"
            style={{ backgroundImage: `url(${story.cover_url})` }}
          />

          {/* Cover */}
          <div className="relative w-40 sm:w-52 aspect-[3/4] mx-auto sm:mx-0 rounded-2xl overflow-hidden shadow-xl border border-white/20 shrink-0">
            <SafeImage
              src={story.cover_url}
              alt={story.title}
              fallbackTitle={story.title}
              fallbackAuthor={story.author_name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase">
              {story.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"}
            </span>
          </div>

          {/* Info */}
          <div className="relative z-10 flex flex-col justify-between gap-4 flex-1 text-center sm:text-left">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2 leading-tight">
                {story.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span>Tác giả: <b className="text-foreground">{story.author_name}</b></span>
                <span>·</span>
                <span>Tình trạng:</span>
                {story.status === "ongoing" || story.genres?.includes("Đang Cập Nhật") ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Đang xử lý / Cập nhật
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã hoàn thành (Full)
                  </span>
                )}
              </p>

              {/* Genre badges */}
              <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start mb-4">
                {story.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Quick Multi-Version Switcher in Hero */}
              {versions.length > 1 && (
                <div className="mb-4 p-2.5 rounded-xl bg-muted/60 border border-border/60 flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Phiên bản:
                  </span>
                  {versions.map((v) => {
                    const isCur = v.slug === story.slug;
                    return (
                      <Link
                        key={v.slug}
                        href={`/truyen/${v.slug}`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isCur
                            ? "bg-rose-500 text-white shadow-xs font-black"
                            : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                        }`}
                      >
                        {v.version_name || v.title}
                      </Link>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Interactive KPIs & Action buttons */}
            <StoryInteractiveHero story={story} chapters={chapters} />
          </div>
        </section>

        {/* Story Description */}
        <section className="rounded-2xl bg-card border border-border/50 p-6 sm:p-7 flex flex-col gap-4 shadow-xs">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            Giới thiệu tác phẩm
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
            {story.description ? (
              <p>
                {story.description
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .replace(/(\n\s*)?(👉\s*)?Hãy cùng đọc[\s\S]*?DocTruyen\.VIP.*$/gi, "")
                  .trim()}
              </p>
            ) : (
              <p>Đang cập nhật nội dung tóm tắt cho tác phẩm {story.title}...</p>
            )}

            {/* Hook Call-to-action Block */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/25 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-foreground leading-snug">
                    Hãy cùng đọc truyện <span className="text-rose-500 font-extrabold">{story.title}</span> với <span className="text-amber-500 font-extrabold">DocTruyen.VIP</span> nhé! ✨
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chúc bạn có những phút giây đọc truyện thật vui vẻ và thư giãn. Đừng quên thả tim, bình luận và chia sẻ với bạn bè để nhận Xu thưởng miễn phí!
                  </p>
                </div>
              </div>

              <StoryReadCtaButton
                storySlug={story.slug}
                storyTitle={story.title}
                firstChapterNumber={firstChapterNumber}
              />
            </div>
          </div>
        </section>

        {/* Notice for Ongoing / In-progress processing stories */}
        {(story.status === "ongoing" || story.genres?.includes("Đang Cập Nhật")) && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-xs sm:text-sm text-foreground leading-relaxed">
              <span className="font-extrabold text-amber-600 dark:text-amber-400">⚡ Tiến độ xử lý & cập nhật:</span>{" "}
              Tác phẩm này đang trong quá trình bóc tách và đồng bộ các tập/chương mới lên hệ thống. Hiện tại đã có{" "}
              <b className="text-rose-500 font-black">{chapters.length} chương</b> đã sẵn sàng để đọc ngay! Các chương tiếp theo đang được cập nhật tự động.
            </div>
          </div>
        )}

        {/* Interactive Chapter Table of Contents */}
        <div id="chapter-toc" className="scroll-mt-20">
          <ChapterTableOfContents
            storySlug={story.slug}
            storyTitle={story.title}
            chapters={chapters}
            versions={versions}
            currentVersionSlug={story.slug}
            seriesGroupName={seriesGroup?.groupName}
          />
        </div>

        {/* Comment & Discussion Section (Dual TruyenHub & Facebook) */}
        <CommentSection storyId={story.id} storyTitle={story.title} />
      </main>

      <BottomNav />
    </div>
  );
}
