"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Chapter, StoryVersion } from "@/types";
import { 
  BookOpen, 
  Search, 
  ArrowUpDown, 
  Lock, 
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle2,
  Layers
} from "lucide-react";

interface ChapterTableOfContentsProps {
  storySlug: string;
  storyTitle: string;
  chapters: Chapter[];
  versions?: StoryVersion[];
  currentVersionSlug?: string;
  seriesGroupName?: string;
}

const CHUNK_SIZE = 50;

export function ChapterTableOfContents({
  storySlug,
  storyTitle,
  chapters,
  versions = [],
  currentVersionSlug,
  seriesGroupName,
}: ChapterTableOfContentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRange, setSelectedRange] = useState<number>(0); // 0 = chunk 0 (1-50)

  // Sắp xếp
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const diff = a.chapter_number - b.chapter_number;
      return sortAsc ? diff : -diff;
    });
  }, [chapters, sortAsc]);

  // Tìm kiếm
  const filteredChapters = useMemo(() => {
    if (!searchTerm.trim()) return sortedChapters;
    const term = searchTerm.toLowerCase().trim();
    return sortedChapters.filter(
      (c) =>
        c.chapter_number.toString().includes(term) ||
        c.title.toLowerCase().includes(term)
    );
  }, [sortedChapters, searchTerm]);

  // Tính số lượng dải chương (ranges) nếu không tìm kiếm
  const ranges = useMemo(() => {
    if (chapters.length <= CHUNK_SIZE) return [];
    const count = Math.ceil(chapters.length / CHUNK_SIZE);
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      start: i * CHUNK_SIZE + 1,
      end: Math.min((i + 1) * CHUNK_SIZE, chapters.length),
    }));
  }, [chapters.length]);

  // Phân trang theo dải đã chọn (chỉ áp dụng khi không gõ tìm kiếm)
  const displayedChapters = useMemo(() => {
    if (searchTerm.trim() || ranges.length === 0) {
      return filteredChapters;
    }
    const currentRange = ranges[selectedRange];
    if (!currentRange) return filteredChapters;

    return filteredChapters.filter(
      (c) =>
        c.chapter_number >= currentRange.start &&
        c.chapter_number <= currentRange.end
    );
  }, [filteredChapters, searchTerm, ranges, selectedRange]);

  const firstChapter = chapters[0];
  const lastChapter = chapters[chapters.length - 1];

  return (
    <section className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              Mục Lục Các Chương
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {chapters.length} chương
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Danh sách đầy đủ các tập / chương đã phát hành
            </p>
          </div>
        </div>

        {/* Quick Read Buttons */}
        <div className="flex items-center gap-2">
          {firstChapter && (
            <Link
              href={`/truyen/${storySlug}/${firstChapter.chapter_number}`}
              className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all border border-border/60 hover:border-rose-500/30 flex items-center gap-1.5"
            >
              <span>Đọc từ đầu (C.{firstChapter.chapter_number})</span>
            </Link>
          )}
          {lastChapter && chapters.length > 1 && (
            <Link
              href={`/truyen/${storySlug}/${lastChapter.chapter_number}`}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all border border-rose-500/20 flex items-center gap-1.5"
            >
              <span>Mới nhất (C.{lastChapter.chapter_number})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Version Selector for Multi-Edition Stories */}
      {versions && versions.length > 1 && (
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tùy chọn phiên bản đọc ({versions.length} phiên bản)
            </span>
            {seriesGroupName && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-muted-foreground">
                Thuộc: <b className="text-foreground">{seriesGroupName}</b>
              </span>
            )}
          </div>

          <div className="w-full min-w-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {versions.map((ver) => {
              const isCurrent = ver.slug === (currentVersionSlug || storySlug);
              return (
                <Link
                  key={ver.slug}
                  href={`/truyen/${ver.slug}#chapter-toc`}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 ${
                    isCurrent
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/30"
                      : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70 hover:border-border"
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${isCurrent ? "text-white" : "text-amber-500"}`} />
                  <span>{ver.version_name || ver.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isCurrent ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {ver.total_chapters} Tập
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo số tập hoặc tên chương..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border/60 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 py-2 rounded-xl bg-background hover:bg-muted text-foreground text-xs font-semibold border border-border/60 flex items-center gap-1.5 transition-colors"
            title="Đảo chiều sắp xếp danh sách"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{sortAsc ? "Thứ tự: Cũ nhất trước" : "Thứ tự: Mới nhất trước"}</span>
          </button>
        </div>
      </div>

      {/* Range Tabs (if chapters > CHUNK_SIZE and not searching) */}
      {!searchTerm && ranges.length > 1 && (
        <div className="w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">
            Dải chương:
          </span>
          {ranges.map((r) => (
            <button
              key={r.index}
              onClick={() => setSelectedRange(r.index)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedRange === r.index
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              {r.start} - {r.end}
            </button>
          ))}
        </div>
      )}

      {/* Chapters Grid */}
      {displayedChapters.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-xs font-medium">
          Không tìm thấy chương nào phù hợp với từ khóa &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {displayedChapters.map((ch) => (
            <Link
              key={ch.id || `ch-${ch.chapter_number}`}
              href={`/truyen/${storySlug}/${ch.chapter_number}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-rose-500/50 hover:bg-muted/50 transition-all group bg-background/50"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="text-xs font-black text-muted-foreground group-hover:text-rose-500 transition-colors shrink-0">
                  C.{ch.chapter_number}
                </span>
                <span className="text-xs sm:text-sm font-semibold truncate text-foreground group-hover:text-foreground">
                  {ch.title}
                </span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {ch.is_locked ? (
                  <span className="flex items-center gap-1 text-[11px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    {ch.price_coins} Xu
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Free
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Hiển thị {displayedChapters.length} / {chapters.length} chương
        </span>
        <span>
          Cập nhật định kỳ từ DocTruyen.vip
        </span>
      </div>
    </section>
  );
}
