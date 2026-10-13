import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { StoryCard } from "@/components/story/StoryCard";
import { SafeImage } from "@/components/common/SafeImage";
import { MOCK_STORIES } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Story } from "@/types";
import { Sparkles, Flame, BookOpen, Crown, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  let allStories: Story[] = MOCK_STORIES;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: dbStories } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });
    if (dbStories && dbStories.length > 0) {
      allStories = dbStories as unknown as Story[];
    }
  } catch (error) {
    console.error("Failed to load stories from Supabase:", error);
  }

  const filteredStories = type
    ? allStories.filter((s) => s.type === type)
    : allStories;

  const comics = allStories.filter((s) => s.type === "comic");
  const novels = allStories.filter((s) => s.type === "novel");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-10">
        {/* Hero Spotlight Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-600/20 border border-border/50 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-3 max-w-xl text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3.5 h-3.5" />
              Nền Tảng Đọc Truyện Đa Phương Thức
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              Đọc Truyện Tranh 4K & Tiểu Thuyết Chữ Không Giới Hạn
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trải nghiệm đọc mượt mà, lưu trữ đám mây Cloudflare R2 siêu tốc, nạp xu tự động trong 3 giây qua VietQR và đồng bộ dữ liệu đa thiết bị.
            </p>
            <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
              <Link
                href="/?type=comic"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all"
              >
                Khám Phá Truyện Tranh
              </Link>
              <Link
                href="/?type=novel"
                className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all border border-border/50"
              >
                Đọc Truyện Chữ
              </Link>
            </div>
          </div>

          {/* Quick highlight cards */}
          <div className="w-full sm:w-72 aspect-[3/4] max-w-[240px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 rotate-1 hover:rotate-0 transition-transform">
            <SafeImage
              src="https://pub-996745da873f42adb3c8b53c9ed97e85.r2.dev/covers/678/1790384608184870996.webp"
              alt="Highlight"
              fallbackTitle="Vạn Cổ Kiếm Tôn"
              fallbackAuthor="Chill"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href="/"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !type
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            Tất cả truyện
          </Link>
          <Link
            href="/?type=comic"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              type === "comic"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            ⚡ Truyện Tranh
          </Link>
          <Link
            href="/?type=novel"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              type === "novel"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            📖 Truyện Chữ
          </Link>
        </div>

        {/* Section: Trending Stories */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Đang Thịnh Hành Nhất
            </h2>
            <span className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-0.5">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        {/* Split Section: Comics vs Novels */}
        {!type && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comics column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Truyện Tranh Mới Nhất
                </h3>
                <Link href="/?type=comic" className="text-xs font-bold text-rose-500">
                  Xem thêm
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {comics.slice(0, 3).map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>

            {/* Novels column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Truyện Chữ Chọn Lọc
                </h3>
                <Link href="/?type=novel" className="text-xs font-bold text-rose-500">
                  Xem thêm
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {novels.slice(0, 3).map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIP Ranking Section (Gamification) */}
        <section className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-foreground">
              <Crown className="w-5 h-5 text-amber-400" />
              Bảng Xếp Hạng Phú Hào Tháng
            </h3>
            <span className="text-xs font-bold text-muted-foreground">Cập nhật theo thời gian thực</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="font-black text-amber-500 text-lg">#1</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-black text-white text-sm shadow-md">
                T
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Trần Thế</span>
                <span className="text-[11px] text-amber-500 font-extrabold">VIP 12 · 71.100 Xu</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/50">
              <span className="font-black text-muted-foreground text-lg">#2</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-black text-white text-sm">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Người Đọc</span>
                <span className="text-[11px] text-muted-foreground font-bold">VIP 8 · 54.400 Xu</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/50">
              <span className="font-black text-amber-700 text-lg">#3</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center font-black text-white text-sm">
                T
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Thùy Linh</span>
                <span className="text-[11px] text-muted-foreground font-bold">VIP 6 · 50.800 Xu</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
