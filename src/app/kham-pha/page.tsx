"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { StoryCard } from "@/components/story/StoryCard";
import { MOCK_STORIES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { Story } from "@/types";
import { 
  Compass, 
  Filter, 
  Search, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  Globe2, 
  BookMarked, 
  GraduationCap, 
  Briefcase, 
  Flame, 
  Clock, 
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const QUICK_PRESETS = [
  { id: "all", label: "Tất cả", type: "all", genre: "all", status: "all", icon: Compass },
  { id: "comic", label: "⚡ Truyện Tranh", type: "comic", genre: "all", status: "all", icon: Sparkles },
  { id: "novel", label: "📖 Truyện Chữ", type: "novel", genre: "all", status: "all", icon: BookOpen },
  { id: "sach", label: "💡 Sách & Kỹ Năng", type: "all", genre: "Sách", status: "all", icon: BrainCircuit },
  { id: "tieu-thuyet", label: "🎭 Tiểu Thuyết", type: "all", genre: "Tiểu Thuyết", status: "all", icon: BookMarked },
  { id: "tieng-anh", label: "🌍 Sách Tiếng Anh", type: "all", genre: "Tiếng Anh", status: "all", icon: Globe2 },
  { id: "tam-ly", label: "🧠 Tâm Lý Học", type: "all", genre: "Tâm Lý Học", status: "all", icon: GraduationCap },
  { id: "kinh-te", label: "💼 Kinh Tế - Quản Trị", type: "all", genre: "Kinh Tế - Quản Trị", status: "all", icon: Briefcase },
  { id: "trinh-tham", label: "🔎 Trinh Thám & Kinh Dị", type: "all", genre: "Trinh Thám", status: "all", icon: BookMarked },
  { id: "tuoi-hoc-tro", label: "🎒 Tuổi Học Trò", type: "all", genre: "Tuổi Học Trò", status: "all", icon: Flame },
  { id: "ongoing", label: "⚡ Đang Cập Nhật", type: "all", genre: "all", status: "ongoing", icon: Clock },
  { id: "completed", label: "✅ Hoàn Thành (Full)", type: "all", genre: "all", status: "completed", icon: CheckCircle2 },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial params
  const paramType = searchParams.get("type") || "all";
  const paramGenre = searchParams.get("genre") || "all";
  const paramStatus = searchParams.get("status") || "all";
  const paramQuery = searchParams.get("q") || searchParams.get("search") || "";

  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [selectedType, setSelectedType] = useState<string>(paramType);
  const [selectedGenre, setSelectedGenre] = useState<string>(paramGenre);
  const [selectedStatus, setSelectedStatus] = useState<string>(paramStatus);
  const [sortBy, setSortBy] = useState<string>("views");
  const [keyword, setKeyword] = useState<string>(paramQuery);
  const [loading, setLoading] = useState<boolean>(true);

  const presetsRef = useRef<HTMLDivElement>(null);
  const [canScrollPresetsLeft, setCanScrollPresetsLeft] = useState(false);
  const [canScrollPresetsRight, setCanScrollPresetsRight] = useState(true);

  const checkPresetsScroll = () => {
    const el = presetsRef.current;
    if (!el) return;
    setCanScrollPresetsLeft(el.scrollLeft > 10);
    setCanScrollPresetsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = presetsRef.current;
    if (!el) return;
    checkPresetsScroll();

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
        checkPresetsScroll();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", checkPresetsScroll);
    window.addEventListener("resize", checkPresetsScroll);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", checkPresetsScroll);
      window.removeEventListener("resize", checkPresetsScroll);
    };
  }, []);

  const scrollPresets = (direction: "left" | "right") => {
    const el = presetsRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
    setTimeout(checkPresetsScroll, 300);
  };

  // Sync state if searchParams change externally (e.g. navigation)
  useEffect(() => {
    setSelectedType(searchParams.get("type") || "all");
    setSelectedGenre(searchParams.get("genre") || "all");
    setSelectedStatus(searchParams.get("status") || "all");
    setKeyword(searchParams.get("q") || searchParams.get("search") || "");
  }, [searchParams]);

  // Load live stories from Supabase
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
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, []);

  // Update URL search parameters without full page reload
  const updateUrl = (type: string, genre: string, status: string, q: string) => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (genre !== "all") params.set("genre", genre);
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    const queryString = params.toString();
    const newPath = queryString ? `/kham-pha?${queryString}` : `/kham-pha`;
    window.history.replaceState(null, "", newPath);
  };

  // Collect all unique genres from database
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => s.genres?.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [stories]);

  // Filter & sort
  const filteredStories = useMemo(() => {
    let list = [...stories];

    // Filter by type
    if (selectedType !== "all") {
      list = list.filter((s) => s.type === selectedType);
    }

    // Filter by genre with smart category groupings
    if (selectedGenre !== "all") {
      const gLower = selectedGenre.toLowerCase();
      if (gLower === "sách") {
        list = list.filter((s) =>
          Array.isArray(s.genres) && s.genres.some((g) =>
            ["sách", "kỹ năng", "tâm lý học", "kinh tế - quản trị", "phát triển bản thân", "harvard business review"].includes((g || "").toLowerCase())
          )
        );
      } else if (gLower === "tiểu thuyết") {
        list = list.filter((s) =>
          Array.isArray(s.genres) && s.genres.some((g) =>
            ["tiểu thuyết", "văn học", "kinh dị", "trinh thám", "kỳ ảo", "tuổi học trò", "văn học việt nam", "văn học nhật bản"].includes((g || "").toLowerCase())
          )
        );
      } else if (gLower === "tiếng anh") {
        list = list.filter((s) =>
          Array.isArray(s.genres) && s.genres.some((g) => (g || "").toLowerCase().includes("tiếng anh") || (g || "").toLowerCase().includes("english"))
        );
      } else {
        list = list.filter((s) => Array.isArray(s.genres) && s.genres.some((g) => (g || "").toLowerCase().includes(gLower)));
      }
    }

    // Filter by status
    if (selectedStatus !== "all") {
      if (selectedStatus === "ongoing") {
        list = list.filter((s) => s.status === "ongoing" || s.genres?.includes("Đang Cập Nhật"));
      } else if (selectedStatus === "completed") {
        list = list.filter((s) => s.status === "completed" && !s.genres?.includes("Đang Cập Nhật"));
      }
    }

    // Filter by keyword (100% null-safe)
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      list = list.filter((s) => {
        const titleMatch = (s.title || "").toLowerCase().includes(q);
        const authorMatch = (s.author_name || "").toLowerCase().includes(q);
        const slugMatch = (s.slug || "").toLowerCase().includes(q);
        const genreMatch = Array.isArray(s.genres) && s.genres.some((g) => (g || "").toLowerCase().includes(q));
        const descMatch = (s.description || "").toLowerCase().includes(q);
        return titleMatch || authorMatch || slugMatch || genreMatch || descMatch;
      });
    }

    // Sort
    list.sort((a, b) => {
      const viewsA = a.total_views || 0;
      const viewsB = b.total_views || 0;
      const likesA = a.total_likes || 0;
      const likesB = b.total_likes || 0;
      const chapsA = a.total_chapters || 0;
      const chapsB = b.total_chapters || 0;

      if (sortBy === "views") return viewsB - viewsA;
      if (sortBy === "likes") return likesB - likesA;
      if (sortBy === "chapters") return chapsB - chapsA;
      if (sortBy === "newest") {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [stories, selectedType, selectedGenre, selectedStatus, sortBy, keyword]);

  const handleReset = () => {
    setSelectedType("all");
    setSelectedGenre("all");
    setSelectedStatus("all");
    setSortBy("views");
    setKeyword("");
    updateUrl("all", "all", "all", "");
  };

  const handlePresetClick = (preset: typeof QUICK_PRESETS[0]) => {
    setSelectedType(preset.type);
    setSelectedGenre(preset.genre);
    setSelectedStatus(preset.status);
    updateUrl(preset.type, preset.genre, preset.status, keyword);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-rose-500 animate-spin-slow" />
            Khám Phá Kho Truyện
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Chọn lọc và tìm kiếm hơn 880+ bộ truyện tranh, truyện chữ, sách kỹ năng & tiểu thuyết.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              updateUrl(selectedType, selectedGenre, selectedStatus, e.target.value);
            }}
            placeholder="Tìm theo tên truyện, tác giả, thể loại..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm"
          />
        </div>
      </div>

      {/* Quick Category Presets Chips with smooth mouse-wheel & button controls */}
      <div className="relative flex items-center group -mx-4 px-4 sm:mx-0 sm:px-0">
        {canScrollPresetsLeft && (
          <button
            onClick={() => scrollPresets("left")}
            aria-label="Cuộn sang trái"
            className="absolute left-1 sm:-left-3 z-20 p-1.5 rounded-full bg-background/95 hover:bg-background border border-border shadow-lg text-foreground transition-all flex items-center justify-center hover:scale-110"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div 
          ref={presetsRef}
          className="w-full flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth px-1"
        >
          {QUICK_PRESETS.map((p) => {
            const Icon = p.icon;
            const isActive =
              (p.id === "all" && selectedType === "all" && selectedGenre === "all" && selectedStatus === "all") ||
              (p.type !== "all" && selectedType === p.type && selectedGenre === "all" && selectedStatus === "all") ||
              (p.genre !== "all" && selectedGenre === p.genre) ||
              (p.status !== "all" && selectedStatus === p.status);

            return (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {canScrollPresetsRight && (
          <button
            onClick={() => scrollPresets("right")}
            aria-label="Cuộn sang phải"
            className="absolute right-1 sm:-right-3 z-20 p-1.5 rounded-full bg-background/95 hover:bg-background border border-border shadow-lg text-foreground transition-all flex items-center justify-center hover:scale-110"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
            Bộ lọc chi tiết
          </span>
          {(selectedType !== "all" || selectedGenre !== "all" || selectedStatus !== "all" || keyword) && (
            <button
              onClick={handleReset}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Định dạng */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Định dạng:</span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "comic", label: "⚡ Truyện Tranh" },
            { id: "novel", label: "📖 Truyện Chữ" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedType(t.id);
                updateUrl(t.id, selectedGenre, selectedStatus, keyword);
              }}
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

        {/* Tình trạng */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Tình trạng:</span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "ongoing", label: "⚡ Đang xử lý / Cập nhật" },
            { id: "completed", label: "✅ Hoàn thành (Full)" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedStatus(s.id);
                updateUrl(selectedType, selectedGenre, s.id, keyword);
              }}
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

        {/* Sắp xếp */}
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

        {/* Thể loại */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
          <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">Thể loại:</span>
          <button
            onClick={() => {
              setSelectedGenre("all");
              updateUrl(selectedType, "all", selectedStatus, keyword);
            }}
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
              onClick={() => {
                setSelectedGenre(g);
                updateUrl(selectedType, g, selectedStatus, keyword);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedGenre.toLowerCase() === g.toLowerCase()
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
        <span>
          Tìm thấy <b className="text-rose-500 font-black">{filteredStories.length}</b> bộ truyện phù hợp
        </span>
        {loading && <span className="text-amber-500">Đang đồng bộ từ hệ thống...</span>}
      </div>

      {/* Story Grid */}
      {filteredStories.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-2xl border border-border/50">
          <BookOpen className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-sm font-bold text-foreground">Không tìm thấy truyện nào phù hợp</p>
          <p className="text-xs text-muted-foreground">Thử đổi từ khóa hoặc đặt lại bộ lọc nâng cao</p>
          <button
            onClick={handleReset}
            className="mt-2 py-2 px-4 rounded-xl bg-rose-500 text-white font-bold text-xs"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24 md:pb-12">
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-rose-500" />
            <span>Đang tải kho truyện...</span>
          </div>
        }
      >
        <ExploreContent />
      </Suspense>
      <Footer />
      <BottomNav />
    </div>
  );
}
