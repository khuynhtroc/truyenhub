import Link from "next/link";
import { Story } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Eye, Heart, BookOpen, Image as ImageIcon } from "lucide-react";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const isComic = story.type === "comic";

  return (
    <Link
      href={`/truyen/${story.slug}`}
      className="group flex flex-col gap-2 rounded-xl overflow-hidden focus:outline-none transition-all"
    >
      {/* Cover image wrap */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted/60 border border-border/40 shadow-sm group-hover:shadow-md group-hover:border-rose-500/40 transition-all">
        {/* Placeholder / Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity" />
        
        <img
          src={story.cover_url}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Type Badge: Comic vs Novel */}
        <span
          className={`absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase shadow-sm flex items-center gap-1 ${
            isComic
              ? "bg-amber-500 text-white"
              : "bg-indigo-600 text-white"
          }`}
        >
          {isComic ? <ImageIcon className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
          {isComic ? "Truyện Tranh" : "Truyện Chữ"}
        </span>

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
