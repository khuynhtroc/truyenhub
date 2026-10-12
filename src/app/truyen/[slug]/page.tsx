import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  ArrowRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = MOCK_STORIES.find((s) => s.slug === slug);

  if (!story) {
    notFound();
  }

  const chapters = MOCK_CHAPTERS[slug] || [
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-8">
        {/* Story Hero Header */}
        <section className="relative rounded-3xl overflow-hidden bg-card border border-border/50 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 shadow-sm">
          {/* Blurred backdrop image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl pointer-events-none"
            style={{ backgroundImage: `url(${story.cover_url})` }}
          />

          {/* Cover */}
          <div className="relative w-40 sm:w-52 aspect-[3/4] mx-auto sm:mx-0 rounded-2xl overflow-hidden shadow-xl border border-white/20 shrink-0">
            <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
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
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Tác giả: <b className="text-foreground">{story.author_name}</b> · Tình trạng:{" "}
                <span className="text-emerald-500 font-bold">
                  {story.status === "completed" ? "Đã hoàn thành" : "Đang phát hành"}
                </span>
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

              {/* KPIs */}
              <div className="flex items-center gap-6 justify-center sm:justify-start text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  {formatNumber(story.total_views)} Lượt xem
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  {formatNumber(story.total_likes)} Thích
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  {chapters.length} Chương
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start pt-2">
              <Link
                href={`/truyen/${story.slug}/1`}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                <span>Đọc từ đầu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/50 flex items-center gap-2 transition-all">
                <Bookmark className="w-4 h-4 text-rose-500" />
                <span>Tủ truyện</span>
              </button>
              <button className="py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/50 flex items-center gap-2 transition-all">
                <Heart className="w-4 h-4" />
                <span>Thả tim</span>
              </button>
            </div>
          </div>
        </section>

        {/* Story Description */}
        <section className="rounded-2xl bg-card border border-border/50 p-6 flex flex-col gap-3">
          <h2 className="text-base font-extrabold text-foreground">Giới thiệu truyện</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {story.description}
          </p>
        </section>

        {/* Chapter List */}
        <section className="rounded-2xl bg-card border border-border/50 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-500" />
              Danh sách chương ({chapters.length})
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">Cập nhật mới nhất</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/truyen/${story.slug}/${ch.chapter_number}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:border-rose-500/40 hover:bg-muted/40 transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-xs font-bold text-muted-foreground group-hover:text-rose-500 transition-colors">
                    C.{ch.chapter_number}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold truncate text-foreground">
                    {ch.title}
                  </span>
                </div>

                {ch.is_locked ? (
                  <span className="shrink-0 flex items-center gap-1 text-[11px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    {ch.price_coins} Xu
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Free
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
