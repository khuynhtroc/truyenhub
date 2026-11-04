import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StoryCard } from "@/components/story/StoryCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { StoryRail } from "@/components/home/StoryRail";
import { MOCK_STORIES } from "@/lib/mock-data";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Story } from "@/types";
import { 
  Sparkles, 
  Flame, 
  BookOpen, 
  Crown, 
  ChevronRight, 
  Zap, 
  TrendingUp, 
  Compass, 
  Layers, 
  CheckCircle2, 
  Clock,
  Trophy
} from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

const QUICK_FILTERS = [
  { label: "Tất cả", href: "/", type: undefined, icon: Sparkles },
  { label: "Bảng Xếp Hạng", href: "/bang-xep-hang", type: "rankings", icon: Trophy },
  { label: "Truyện Tranh", href: "/?type=comic", type: "comic", icon: Zap },
  { label: "Truyện Chữ", href: "/?type=novel", type: "novel", icon: BookOpen },
  { label: "Sách & Tư Duy", href: "/kham-pha?genre=S%C3%A1ch", type: "sach", icon: Compass },
  { label: "Đã Hoàn Thành", href: "/kham-pha?status=completed", type: "completed", icon: CheckCircle2 },
  { label: "Đang Cập Nhật", href: "/kham-pha?status=ongoing", type: "ongoing", icon: Clock },
];


export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; genre?: string }>;
}) {
  const { type, genre } = await searchParams;

  let allStories: Story[] = MOCK_STORIES;
  let topReaders: any[] = [];
  try {
    const supabase = getPublicSupabase();
    const [storiesRes, readersRes] = await Promise.all([
      supabase
        .from("stories")
        .select("id, title, slug, type, description, cover_url, author_name, status, genres, total_views, total_likes, total_chapters, updated_at")
        .order("total_views", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url, coins_balance")
        .order("coins_balance", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(3),
    ]);

    if (storiesRes.data && storiesRes.data.length > 0) {
      allStories = storiesRes.data as unknown as Story[];
    }
    if (readersRes.data) {
      topReaders = readersRes.data;
    }
  } catch (error) {
    console.error("Failed to load data from Supabase:", error);
  }

  // Filtered stories based on query
  let filteredStories = allStories;
  if (type) {
    filteredStories = filteredStories.filter((s) => s.type === type);
  }
  if (genre) {
    filteredStories = filteredStories.filter((s) => s.genres?.includes(genre));
  }

  // Segmentations for Rails & Hero
  const comics = allStories.filter((s) => s.type === "comic");
  const novels = allStories.filter((s) => s.type === "novel");

  // Hero Spotlight picks: High-engagement stories with valid covers, ordered strictly by real total_views
  const featuredStories = [...allStories]
    .filter((s) => s.cover_url && !s.cover_url.includes("novel-default"))
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 5);

  // Trending rail
  const trendingStories = [...allStories]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 12);

  // Comics rail
  const topComics = comics.slice(0, 12);

  // Novels rail
  const topNovels = novels.slice(0, 12);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12 w-full">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 w-full py-3 sm:py-6 flex flex-col gap-6 sm:gap-8 overflow-x-clip min-w-0">
        {/* Quick Horizontal Filter Chips (App-Style) */}
        <div className="w-full min-w-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x -mx-3 px-3 sm:mx-0 sm:px-0">
          {QUICK_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = (!type && f.type === undefined) || type === f.type;
            return (
              <Link
                key={f.label}
                href={f.href}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                    : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Hero Cinematic Carousel */}
        {!type && featuredStories.length > 0 && (
          <HeroCarousel stories={featuredStories} />
        )}

        {/* Horizontal Story Rail 1: Trending Đề Cử */}
        {!type && (
          <StoryRail
            title="Đề Cử Thịnh Hành"
            icon={<Flame className="w-5 h-5 text-rose-500 fill-rose-500" />}
            href="/kham-pha?sort=views"
            stories={trendingStories}
          />
        )}

        {/* Horizontal Story Rail 2: Truyện Tranh 4K */}
        {(!type || type === "comic") && (
          <StoryRail
            title="Truyện Tranh 4K Nổi Bật"
            icon={<Zap className="w-5 h-5 text-amber-500 fill-amber-500" />}
            href="/?type=comic"
            stories={topComics}
          />
        )}

        {/* Horizontal Story Rail 3: Tiểu Thuyết & Sách Hay */}
        {(!type || type === "novel") && (
          <StoryRail
            title="Tiểu Thuyết & Sách Hay Chọn Lọc"
            icon={<BookOpen className="w-5 h-5 text-indigo-500" />}
            href="/?type=novel"
            stories={topNovels}
          />
        )}

        {/* Dense Grid Section: Mới Cập Nhật (3 Columns on Mobile) */}
        <section className="flex flex-col gap-3 w-full pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground tracking-tight">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {type === "comic"
                ? "Tất Cả Truyện Tranh"
                : type === "novel"
                ? "Tất Cả Truyện Chữ & Sách"
                : "Mới Cập Nhật"}
            </h2>
            <Link
              href="/kham-pha"
              className="text-xs font-bold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-0.5"
            >
              Xem tất cả ({filteredStories.length})
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3-column dense grid on mobile, 4-6 on tablet/desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {filteredStories.slice(0, 24).map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {/* Load more CTA button */}
          {filteredStories.length > 24 && (
            <div className="flex justify-center pt-4">
              <Link
                href="/kham-pha"
                className="px-6 py-2.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-bold transition-all border border-border/50 active:scale-95 flex items-center gap-2"
              >
                Khám Phá Thêm Kho Truyện ({filteredStories.length}+ tác phẩm)
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Readers Real Point Leaderboard */}
        <section className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-sm mt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-foreground">
              <Trophy className="w-5 h-5 text-amber-500" />
              Bảng Xếp Hạng Điểm Thưởng Độc Giả
            </h3>
            <Link
              href="/bang-xep-hang?tab=vip"
              className="text-xs font-black text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <span>Xem Toàn Bộ Bảng Xếp Hạng</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topReaders.length > 0 ? (
              topReaders.map((reader, idx) => {
                const rank = idx + 1;
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const points = Number(reader.coins_balance || 0);

                let rankBadge = "#" + rank;
                let bgClass = "bg-muted/60 border border-border/50";
                let textRankColor = "text-muted-foreground";
                let avatarRing = "";

                if (isGold) {
                  bgClass = "bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/5 border border-amber-500/30";
                  textRankColor = "text-amber-500 font-black";
                  avatarRing = "ring-2 ring-amber-500/40";
                } else if (isSilver) {
                  bgClass = "bg-slate-500/10 border border-slate-400/20";
                  textRankColor = "text-slate-400 font-black";
                }

                const displayName = reader.display_name?.trim() || (reader.email ? reader.email.split("@")[0] : "Độc Giả");

                return (
                  <div key={reader.id || idx} className={`flex items-center gap-3 p-3 rounded-xl ${bgClass}`}>
                    <span className={`text-lg ${textRankColor}`}>{rankBadge}</span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-black text-white text-sm shadow-md overflow-hidden shrink-0 ${avatarRing}`}>
                      {reader.avatar_url ? (
                        <img src={reader.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{displayName[0]?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 truncate">
                      <span className="font-bold text-sm truncate text-foreground">{displayName}</span>
                      <span className="text-[11px] text-amber-500 font-extrabold">
                        {points.toLocaleString("vi-VN")} Point
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center text-xs text-muted-foreground py-2">
                Đang cập nhật bảng xếp hạng...
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
