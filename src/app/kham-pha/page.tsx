"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { StoryCard } from "@/components/story/StoryCard";
import { MOCK_STORIES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { Story } from "@/types";
import { Compass, Filter, Search, RotateCcw, Sparkles } from "lucide-react";

export default function ExplorePage() {
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("views");
  const [keyword, setKeyword] = useState<string>("");

  useEffect(() => {
    async function loadStories() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("stories")
          .select("*")
          .order("total_views", { ascending: false });
        if (data && data.length > 0) {
          setStories(data as unknown as Story[]);
        }
      } catch (err) {
        console.error("Failed to load stories from Supabase:", err);
      }
    }
    loadStories();
  }, []);

  // Collect all unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => s.genres?.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [stories]);

  // Filter & sort
  const filteredStories = useMemo(() => {
    let list = [...stories];

    if (selectedType !== "all") {
      list = list.filter((s) => s.type === selectedType);
    }

    if (selectedGenre !== "all") {
      list = list.filter((s) => s.genres?.includes(selectedGenre));
    }

    if (selectedStatus !== "all") {
      list = list.filter((s) => s.status === selectedStatus);
    }

    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author_name.toLowerCase().includes(q) ||
          s.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "views") return b.total_views - a.total_views;
      if (sortBy === "likes") return b.total_likes - a.total_likes;
      if (sortBy === "chapters") return b.total_chapters - a.total_chapters;
      if (sortBy === "newest") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      return 0;
    });

    return list;
  }, [selectedType, selectedGenre, selectedStatus, sortBy, keyword]);

  const handleReset = () => {
    setSelectedType("all");
    setSelectedGenre("all");
    setSelectedStatus("all");
    setSortBy("views");
    setKeyword("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24 md:pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-rose-500 animate-spin-slow" />
              Khám Phá Kho Truyện
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tìm kiếm và chọn lọc hàng ngàn bộ truyện tranh & tiểu thuyết hấp dẫn nhất.
            </p>
          </div>

          {/* Search bar inside page */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Lọc nhanh tên truyện, tác giả..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm"
            />
          </div>
        </div>

        {/* Filters Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-rose-500" />
              Bộ lọc nâng cao
            </span>
            {(selectedType !== "all" || selectedGenre !== "all" || selectedStatus !== "all" || keyword) && (
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Định dạng:</span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "comic", label: "⚡ Truyện Tranh" },
              { id: "novel", label: "📖 Truyện Chữ" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedType === t.id
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Tình trạng:</span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "ongoing", label: "Đang tiến hành" },
              { id: "completed", label: "Đã hoàn thành" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === s.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sort Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Sắp xếp:</span>
            {[
              { id: "views", label: "🔥 Lượt xem nhiều" },
              { id: "likes", label: "❤️ Yêu thích nhất" },
              { id: "newest", label: "⚡ Mới cập nhật" },
              { id: "chapters", label: "📚 Nhiều chương nhất" },
            ].map((sort) => (
              <button
                key={sort.id}
                onClick={() => setSortBy(sort.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sortBy === sort.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>

          {/* Genre Filter */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Thể loại:</span>
            <button
              onClick={() => setSelectedGenre("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGenre === "all"
                  ? "bg-foreground text-background font-bold shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              Tất cả
            </button>
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedGenre === g
                    ? "bg-foreground text-background font-bold shadow-sm"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Result Stats */}
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
          <span>Tìm thấy {filteredStories.length} bộ truyện</span>
          <span>Hiển thị trang 1/1</span>
        </div>

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-2xl border border-dashed border-border p-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Không tìm thấy truyện nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Hãy thử bỏ chọn bớt bộ lọc hoặc gõ từ khóa tìm kiếm khác xem sao nhé!
            </p>
            <button
              onClick={handleReset}
              className="mt-2 py-2 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              Xem tất cả truyện
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
