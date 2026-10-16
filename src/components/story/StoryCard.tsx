"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Story } from "@/types";
import { formatNumber, normalizeMediaUrl, SITE_CONFIG } from "@/lib/utils";
import { Eye, Heart, BookOpen, Image as ImageIcon, Sparkles, RefreshCw } from "lucide-react";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const [currentCover, setCurrentCover] = useState(normalizeMediaUrl(story.cover_url));
  const [imgError, setImgError] = useState(!story.cover_url);
  const [hasFallenBack, setHasFallenBack] = useState(false);
  const isComic = story.type === "comic";

  useEffect(() => {
    const norm = normalizeMediaUrl(story.cover_url);
    setCurrentCover(norm);
    setImgError(!norm);
    setHasFallenBack(false);
  }, [story.cover_url]);

  const handleError = () => {
    if (!hasFallenBack && currentCover && currentCover.includes("media.doctruyen.vip")) {
      setHasFallenBack(true);
      setCurrentCover(currentCover.replace("https://media.doctruyen.vip", SITE_CONFIG.fallbackR2Url));
      return;
    }
    setImgError(true);
  };

  return (
    <Link
      href={`/truyen/${story.slug}`}
      className="group flex flex-col gap-1.5 rounded-xl overflow-hidden focus:outline-none active:scale-95 transition-transform"
    >
      {/* Cover image wrap */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-sm group-hover:shadow-md group-hover:border-rose-500/40 transition-all">
        {/* Placeholder / Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity pointer-events-none" />

        {!imgError && currentCover ? (
          <img
            src={currentCover}
            alt={story.title}
            onError={handleError}
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Graceful stylized fallback cover */
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-rose-950 p-3 flex flex-col justify-between items-center text-center">
            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-rose-400 mt-2">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-extrabold text-[11px] text-white/90 leading-snug line-clamp-3">
              {story.title}
            </span>
            <span className="text-[9px] text-white/50 truncate w-full">{story.author_name}</span>
          </div>
        )}

        {/* Type Badge: Tranh vs Chữ */}
        <span
          className={`absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wider uppercase backdrop-blur-md shadow-sm flex items-center gap-0.5 ${
            isComic ? "bg-amber-500/90 text-white" : "bg-indigo-600/90 text-white"
          }`}
        >
          {isComic ? <ImageIcon className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
          <span>{isComic ? "Tranh" : "Chữ"}</span>
        </span>

        {/* Status Badge: Ongoing / Updating vs Completed */}
        {story.status === "ongoing" || story.genres?.includes("Đang Cập Nhật") ? (
          <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase bg-amber-500/90 backdrop-blur-md text-white shadow-sm flex items-center gap-1 border border-amber-400/30">
            <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
            Đang cập nhật
          </span>
        ) : (
          <span className="absolute top-2.5 right-2.5 z-20 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase bg-emerald-600/90 backdrop-blur-md text-white shadow-sm">
            Full
          </span>
        )}

        {/* Latest chapter badge */}
        <span className="absolute bottom-2.5 right-2.5 z-20 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold">
          C.{story.total_chapters}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-rose-500 transition-colors">
          {story.title}
        </h3>

        {/* Genres tag preview */}
        {story.genres && story.genres.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden text-[10px] text-muted-foreground">
            <span className="truncate">
              {story.genres.filter(g => !["Truyện Tranh", "Truyện Chữ", "Manga", "Tiểu thuyết"].includes(g)).slice(0, 2).join(" · ") || story.genres[0]}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-muted-foreground/70" />
            {formatNumber(story.total_views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-500/80" />
            {formatNumber(story.total_likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}
