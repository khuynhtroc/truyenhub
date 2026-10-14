"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Story } from "@/types";
import { 
  ArrowRight, 
  Bookmark, 
  Heart, 
  Share2, 
  ListOrdered, 
  Sparkles,
  Check,
  Copy
} from "lucide-react";

interface StoryActionButtonsProps {
  story: Story;
  firstChapterNumber: number;
  latestChapterNumber: number;
  totalChapters: number;
  onLikeChange?: (newCount: number) => void;
}

export function StoryActionButtons({
  story,
  firstChapterNumber,
  latestChapterNumber,
  totalChapters,
  onLikeChange,
}: StoryActionButtonsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize bookmark & like status from localStorage
  useEffect(() => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("truyenhub_bookmarks") || "[]");
      setIsBookmarked(savedBookmarks.some((item: any) => item.slug === story.slug));

      const savedLikes = JSON.parse(localStorage.getItem("truyenhub_likes") || "[]");
      setIsLiked(savedLikes.includes(story.slug));
    } catch (_) {}
  }, [story.slug]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("truyenhub_bookmarks") || "[]");
      if (isBookmarked) {
        const next = savedBookmarks.filter((item: any) => item.slug !== story.slug);
        localStorage.setItem("truyenhub_bookmarks", JSON.stringify(next));
        setIsBookmarked(false);
        showToast("Đã xóa khỏi Tủ truyện của bạn");
      } else {
        const newItem = {
          id: story.id,
          slug: story.slug,
          title: story.title,
          cover_url: story.cover_url,
          author_name: story.author_name,
          type: story.type,
          total_chapters: totalChapters,
          savedAt: new Date().toISOString(),
          last_chapter: firstChapterNumber,
        };
        const next = [newItem, ...savedBookmarks.filter((item: any) => item.slug !== story.slug)];
        localStorage.setItem("truyenhub_bookmarks", JSON.stringify(next));
        setIsBookmarked(true);
        showToast("Đã thêm vào Tủ truyện thành công! 📚");
      }
    } catch (_) {}
  };

  // Toggle Like
  const handleToggleLike = () => {
    try {
      const savedLikes = JSON.parse(localStorage.getItem("truyenhub_likes") || "[]");
      if (isLiked) {
        const next = savedLikes.filter((s: string) => s !== story.slug);
        localStorage.setItem("truyenhub_likes", JSON.stringify(next));
        setIsLiked(false);
        if (onLikeChange) onLikeChange(Math.max(0, story.total_likes));
        showToast("Đã bỏ thích truyện");
      } else {
        const next = [...savedLikes, story.slug];
        localStorage.setItem("truyenhub_likes", JSON.stringify(next));
        setIsLiked(true);
        if (onLikeChange) onLikeChange(story.total_likes + 1);
        showToast("Cảm ơn bạn đã thả tim cho truyện! ❤️");
      }
    } catch (_) {}
  };

  // Share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${story.title} - DocTruyen.vip`,
          text: `Đọc truyện ${story.title} chất lượng cao trên DocTruyen.vip!`,
          url: url,
        });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép liên kết truyện vào bộ nhớ tạm! 📋");
    } catch (_) {
      showToast("Không thể sao chép liên kết");
    }
  };

  // Jump to TOC
  const handleScrollToToc = () => {
    const el = document.getElementById("chapter-toc");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
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

        {/* Đọc mới nhất (nếu có trên 1 chương) */}
        {totalChapters > 1 && (
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

        {/* Thả tim (Like) */}
        <button
          onClick={handleToggleLike}
          className={`py-3 px-4 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all active:scale-95 ${
            isLiked
              ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
              : "bg-muted/80 hover:bg-muted text-foreground border-border/60"
          }`}
          title={isLiked ? "Nhấn để bỏ thích" : "Thả tim yêu thích"}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
          <span>{isLiked ? "Đã thích" : "Thả tim"}</span>
        </button>

        {/* Chia sẻ (Share) */}
        <button
          onClick={handleShare}
          className="py-3 px-3.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground font-bold text-xs border border-border/60 flex items-center gap-1.5 transition-all active:scale-95"
          title="Chia sẻ truyện này"
        >
          <Share2 className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>

        {/* Xem Mục lục */}
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
