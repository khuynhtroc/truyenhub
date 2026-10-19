"use client";

import Link from "next/link";
import { Story } from "@/types";
import { formatNumber, normalizeMediaUrl, SITE_CONFIG } from "@/lib/utils";
import { ChevronRight, Heart, Eye, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface StoryRailProps {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  stories: Story[];
}

export function StoryRail({ title, href, icon, stories }: StoryRailProps) {
  if (!stories || stories.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 w-full max-w-full overflow-hidden min-w-0">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground tracking-tight">
          {icon}
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-xs font-bold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-0.5"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Snap Rail */}
      <div className="w-full min-w-0 flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0">
        {stories.map((story) => (
          <RailCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

function RailCard({ story }: { story: Story }) {
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
      className="snap-start shrink-0 w-[116px] sm:w-[136px] md:w-[152px] group flex flex-col gap-1.5 focus:outline-none active:scale-95 transition-transform"
    >
      {/* Cover Image Wrap */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-sm group-hover:border-rose-500/50 transition-all">
        {/* Subtle shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 pointer-events-none" />

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
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-rose-950 p-2.5 flex flex-col justify-between items-center text-center">
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-rose-400 mt-2">
              <Sparkles className="w-3 h-3" />
            </span>
            <span className="font-bold text-[11px] text-white/90 line-clamp-3 leading-snug">
              {story.title}
            </span>
            <span className="text-[9px] text-white/50 truncate w-full">{story.author_name}</span>
          </div>
        )}

        {/* Short Badge: Tranh vs Chữ */}
        <span
          className={`absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
            isComic ? "bg-amber-500/90 text-white" : "bg-indigo-600/90 text-white"
          }`}
        >
          {isComic ? "Tranh" : "Chữ"}
        </span>

        {/* Chapter count */}
        {story.total_chapters > 0 && (
          <span className="absolute bottom-2 right-2 z-20 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 backdrop-blur-md text-white/90">
            C.{story.total_chapters}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-rose-500 transition-colors">
          {story.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-0.5">
          <span className="flex items-center gap-0.5 text-rose-500">
            <Heart className="w-2.5 h-2.5 fill-rose-500" />
            {formatNumber(story.total_likes || 120)}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            {formatNumber(story.total_views || 1500)}
          </span>
        </div>
      </div>
    </Link>
  );
}
