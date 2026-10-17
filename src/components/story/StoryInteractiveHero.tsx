"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Story, Chapter } from "@/types";
import { formatNumber } from "@/lib/utils";
import { 
  Eye, 
  Heart, 
  BookOpen, 
  Bookmark, 
  Share2, 
  ListOrdered, 
  Sparkles, 
  ArrowRight, 
  Check 
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { toggleStoryBookmark, getLocalBookmarks } from "@/lib/sync/syncService";
import { recordMissionActivity } from "@/lib/missions";

interface StoryInteractiveHeroProps {
  story: Story;
  chapters: Chapter[];
}

export function StoryInteractiveHero({ story, chapters }: StoryInteractiveHeroProps) {
  const [totalLikes, setTotalLikes] = useState<number>(story.total_likes || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const firstChapterNumber = chapters[0]?.chapter_number || 1;
  const latestChapterNumber = chapters[chapters.length - 1]?.chapter_number || 1;

  // Sync bookmark and like status
  useEffect(() => {
    try {
      const savedBookmarks = getLocalBookmarks();
      setIsBookmarked(savedBookmarks.some((item: any) => item.slug === story.slug || item.id === story.id));

      const savedLikes = JSON.parse(localStorage.getItem("doctruyen_likes") || localStorage.getItem("truyenhub_likes") || "[]");
      const hasLiked = savedLikes.includes(story.slug);
      setIsLiked(hasLiked);
    } catch (_) {}
  }, [story.slug, story.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Handle Like
  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? totalLikes + 1 : Math.max(0, totalLikes - 1);

    // Optimistic UI update
    setIsLiked(nextLiked);
    setTotalLikes(nextCount);

    try {
      const savedLikes = JSON.parse(localStorage.getItem("truyenhub_likes") || "[]");
      if (nextLiked) {
        if (!savedLikes.includes(story.slug)) {
          savedLikes.push(story.slug);
        }
      } else {
        const idx = savedLikes.indexOf(story.slug);
        if (idx >= 0) savedLikes.splice(idx, 1);
        showToast("Đã bỏ thích truyện");
      }
      localStorage.setItem("truyenhub_likes", JSON.stringify(savedLikes));

      // Persist to Supabase via API
      const res = await fetch("/api/stories/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          action: nextLiked ? "like" : "unlike",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.total_likes === "number") {
          setTotalLikes(data.total_likes);
        }
      }

      // Check mission reward on like
      if (nextLiked) {
        const missionRes = await recordMissionActivity("like_story", { story_id: story.id, story_title: story.title });
        if (missionRes?.success && missionRes.coins_reward) {
          showToast(`❤️ Đã thả tim! Nhận được +${missionRes.coins_reward} Xu thưởng nhiệm vụ! 🎉`);
        } else {
          showToast("Cảm ơn bạn đã thả tim cho truyện! ❤️");
        }
      }
    } catch (err) {
      console.error("Error liking story:", err);
    }
  };

  // Handle Bookmark with cloud sync
  const handleToggleBookmark = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const newState = await toggleStoryBookmark(story, user?.id);
      setIsBookmarked(newState);

      if (newState) {
        const missionRes = await recordMissionActivity("bookmark", { story_id: story.id, story_title: story.title });
        if (missionRes?.success && missionRes.coins_reward) {
          showToast(`📚 Đã lưu vào Tủ truyện! Nhận được +${missionRes.coins_reward} Xu thưởng! 🎉`);
        } else {
          showToast("Đã lưu vào Tủ truyện (Đồng bộ đa thiết bị)! 📚");
        }
      } else {
        showToast("Đã xóa khỏi Tủ truyện");
      }
    } catch (_) {}
  };

  // Handle Share
  const handleShare = async () => {
    const url = window.location.href;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${story.title} - DocTruyen.vip`,
          text: `Đọc truyện ${story.title} chuẩn HD trên DocTruyen.vip!`,
          url: url,
        });
        shared = true;
      } catch (_) {}
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(url);
        shared = true;
      } catch (_) {
        showToast("Không thể sao chép liên kết");
      }
    }

    if (shared) {
      const missionRes = await recordMissionActivity("share", { story_id: story.id, story_title: story.title });
      if (missionRes?.success && missionRes.coins_reward) {
        showToast(`🎉 Chia sẻ thành công! Bạn nhận được +${missionRes.coins_reward} Xu!`);
      } else {
        showToast("Đã sao chép liên kết truyện vào bộ nhớ tạm! 📋");
      }
    }
  };

  // Handle Scroll to TOC
  const handleScrollToToc = () => {
    const el = document.getElementById("chapter-toc");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Live KPIs */}
      <div className="flex items-center gap-5 sm:gap-6 justify-center sm:justify-start text-xs font-bold text-muted-foreground my-2">
        <span className="flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-muted-foreground" />
          {formatNumber(story.total_views)} Lượt xem
        </span>

        {/* Dynamic Like Count synced with Thả Tim */}
        <span className="flex items-center gap-1.5 transition-all">
          <Heart className={`w-4 h-4 transition-colors ${isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-rose-500"}`} />
          <b className={`font-black ${isLiked ? "text-rose-500" : "text-muted-foreground"}`}>
            {formatNumber(totalLikes)}
          </b>{" "}
          Thích
        </span>

        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          {chapters.length} Chương
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-center sm:justify-start pt-2">
        {/* Đọc từ đầu */}
        <Link
          href={`/truyen/${story.slug}/${firstChapterNumber}`}
          className="py-3 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Đọc từ đầu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Đọc mới nhất */}
        {chapters.length > 1 && (
          <Link
            href={`/truyen/${story.slug}/${latestChapterNumber}`}
            className="py-3 px-4 rounded-xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs border border-border/60 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>Tập mới nhất</span>
            <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full">
              C.{latestChapterNumber}
            </span>
          </Link>
        )}

        {/* Tủ truyện (Bookmark) */}
        <button
          onClick={handleToggleBookmark}
          className={`py-3 px-4 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all active:scale-95 ${
            isBookmarked
              ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
              : "bg-muted/80 hover:bg-muted text-foreground border-border/60"
          }`}
          title={isBookmarked ? "Nhấn để xóa khỏi Tủ truyện" : "Lưu vào Tủ truyện của bạn"}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-white text-white" : "text-rose-500"}`} />
          <span>{isBookmarked ? "Đã lưu tủ sách" : "Tủ truyện"}</span>
        </button>

        {/* Thả tim (Like) - Syncs with counter above! */}
        <button
          onClick={handleToggleLike}
          className={`py-3 px-4 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all active:scale-95 ${
            isLiked
              ? "bg-rose-500/15 text-rose-500 border-rose-500/40 shadow-sm"
              : "bg-muted/80 hover:bg-muted text-foreground border-border/60"
          }`}
          title={isLiked ? "Nhấn để bỏ thích" : "Thả tim yêu thích tác phẩm này"}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500 animate-pulse" : "text-foreground"}`} />
          <span>{isLiked ? "Đã thích" : "Thả tim"}</span>
        </button>

        {/* Chia sẻ */}
        <button
          onClick={handleShare}
          className="py-3 px-3.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs border border-border/60 flex items-center gap-1.5 transition-all active:scale-95"
          title="Chia sẻ truyện này"
        >
          <Share2 className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>

        {/* Mục lục */}
        <button
          onClick={handleScrollToToc}
          className="py-3 px-3.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs border border-border/60 flex items-center gap-1.5 transition-all active:scale-95"
          title="Cuộn tới danh sách chương"
        >
          <ListOrdered className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Mục lục</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="px-4 py-3 rounded-2xl bg-neutral-900/95 dark:bg-card/95 text-white dark:text-foreground border border-neutral-800 dark:border-border shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
