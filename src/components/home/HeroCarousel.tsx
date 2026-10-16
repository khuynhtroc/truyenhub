"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Story } from "@/types";
import { normalizeMediaUrl, formatNumber } from "@/lib/utils";
import { Sparkles, BookOpen, Flame, Heart, Eye, ArrowRight } from "lucide-react";

interface HeroCarouselProps {
  stories: Story[];
}

export function HeroCarousel({ stories }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (!stories || stories.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [stories]);

  if (!stories || stories.length === 0) return null;

  const current = stories[currentIndex];
  const coverUrl = normalizeMediaUrl(current.cover_url);
  const isComic = current.type === "comic";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl">
      {/* Background Ambience Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="w-full h-full object-cover blur-2xl scale-125 opacity-25 filter"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[260px] sm:min-h-[300px]">
        {/* Story Info */}
        <div className="flex flex-col gap-2.5 max-w-xl text-left">
          {/* Top Pill / Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-3 h-3 fill-rose-500" />
              Đề Cử Thịnh Hành
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isComic ? "bg-amber-500 text-white" : "bg-indigo-600 text-white"
              }`}
            >
              {isComic ? "Truyện Tranh" : "Truyện Chữ"}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-3xl font-black text-white leading-tight line-clamp-2">
            {current.title}
          </h1>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
            {current.description ||
              "Khám phá thế giới cốt truyện lôi cuốn, hình ảnh sắc nét chuẩn 4K và nội dung cập nhật mới mỗi ngày tại DocTruyen.vip."}
          </p>

          {/* Stats & Actions */}
          <div className="flex items-center gap-4 pt-2">
            <Link
              href={`/truyen/${current.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Đọc Ngay
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-3 text-xs text-neutral-400 font-semibold">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                {formatNumber(current.total_likes || 420)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(current.total_views || 7800)}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Cover Card */}
        <Link
          href={`/truyen/${current.slug}`}
          className="relative w-36 sm:w-44 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group active:scale-95 transition-transform"
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={current.title}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-neutral-900 to-indigo-950 flex items-center justify-center p-3 text-center">
              <span className="font-bold text-xs text-white">{current.title}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </Link>
      </div>

      {/* Pagination Dots */}
      {stories.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
          {stories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Chuyển tới truyện ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-rose-500" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
