"use client";

import { useState } from "react";
import Link from "next/link";
import { Story } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Eye, Heart, BookOpen, Image as ImageIcon, Sparkles, RefreshCw } from "lucide-react";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const [imgError, setImgError] = useState(false);
  const isComic = story.type === "comic";

  return (
    <Link
      href={`/truyen/${story.slug}`}
      className="group flex flex-col gap-2 rounded-xl overflow-hidden focus:outline-none transition-all"
    >
      {/* Cover image wrap */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted/80 border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-rose-500/40 transition-all">
        {/* Placeholder / Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity pointer-events-none" />

        {!imgError ? (
          <img
            src={story.cover_url}
            alt={story.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          /* Graceful stylized fallback cover */
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-rose-950 p-4 flex flex-col justify-between items-center text-center">
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-rose-400 mt-4">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-xs text-white/90 leading-tight line-clamp-3">
              {story.title}
            </span>
            <span className="text-[10px] text-white/50">{story.author_name}</span>
          </div>
        )}

        {/* Type Badge: Comic vs Novel */}
        <span
          className={`absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase shadow-sm flex items-center gap-1 ${
            isComic ? "bg-amber-500 text-white" : "bg-indigo-600 text-white"
          }`}
        >
          {isComic ? <ImageIcon className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
          {isComic ? "Truyện Tranh" : "Truyện Chữ"}
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
