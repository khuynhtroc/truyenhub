"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Chapter, Story } from "@/types";
import { PaywallModal } from "@/components/monetization/PaywallModal";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Home, 
  List, 
  Heart, 
  Flag 
} from "lucide-react";

interface ComicReaderProps {
  story: Story;
  chapter: Chapter;
  allChapters: Chapter[];
}

export function ComicReader({ story, chapter, allChapters }: ComicReaderProps) {
  const [isUnlocked, setIsUnlocked] = useState(!chapter.is_locked);
  const [userCoins, setUserCoins] = useState(25);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageWidth, setImageWidth] = useState<"max-w-xl" | "max-w-3xl" | "max-w-full">("max-w-3xl");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Tìm chương trước & chương sau
  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Restore saved width from localStorage
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("truyenhub_comic_width");
      if (savedWidth && ["max-w-xl", "max-w-3xl", "max-w-full"].includes(savedWidth)) {
        setImageWidth(savedWidth as any);
      }
    } catch (_) {}
  }, []);

  const changeWidth = (width: "max-w-xl" | "max-w-3xl" | "max-w-full") => {
    setImageWidth(width);
    try {
      localStorage.setItem("truyenhub_comic_width", width);
    } catch (_) {}
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevChapter) {
        window.location.href = `/truyen/${story.slug}/${prevChapter.chapter_number}`;
      } else if (e.key === "ArrowRight" && nextChapter) {
        window.location.href = `/truyen/${story.slug}/${nextChapter.chapter_number}`;
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, story.slug]);

  // Theo dõi tiến độ cuộn
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
    setUserCoins((prev) => Math.max(0, prev - chapter.price_coins));
  };

  const pages = chapter.pages_images || [];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center select-none">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Header Toolbar */}
      <header
        className={`sticky top-0 z-40 w-full bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-2.5 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/truyen/${story.slug}`}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Về trang giới thiệu truyện"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">{story.title}</h1>
              <p className="text-xs text-neutral-400">{chapter.title}</p>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            {/* Width selector */}
            <button
              onClick={() => {
                const next = imageWidth === "max-w-xl" ? "max-w-3xl" : imageWidth === "max-w-3xl" ? "max-w-full" : "max-w-xl";
                changeWidth(next);
              }}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-xs font-bold"
              title="Đổi độ rộng trang đọc (Nhỏ / Vừa / Toàn màn hình)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Comic Pages Container */}
      <main ref={containerRef} className={`w-full ${imageWidth} mx-auto flex flex-col items-center my-4`}>
        {isUnlocked ? (
          <div className="w-full flex flex-col items-center">
            {pages.map((imgUrl, idx) => (
              <div key={idx} className="relative w-full overflow-hidden bg-neutral-900 border-b border-neutral-900/40">
                <img
                  src={imgUrl}
                  alt={`Trang ${idx + 1}`}
                  className="w-full h-auto object-cover block select-none"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Locked State Preview */
          <div className="w-full flex flex-col items-center px-4">
            {pages.length > 0 && (
              <div className="relative w-full max-h-[480px] overflow-hidden rounded-2xl mb-4">
                <img
                  src={pages[0]}
                  alt="Trang xem thử"
                  className="w-full h-auto object-cover blur-[2px] opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
              </div>
            )}

            <div className="w-full max-w-lg">
              <PaywallModal
                chapterTitle={chapter.title}
                chapterNumber={chapter.chapter_number}
                priceCoins={chapter.price_coins}
                userCoins={userCoins}
                onUnlockSuccess={handleUnlockSuccess}
              />
            </div>
          </div>
        )}

        {/* Bottom Chapter Switcher */}
        {isUnlocked && (
          <div className="w-full max-w-md mx-auto my-12 px-4 flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/truyen/${story.slug}/${prevChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chương Trước</span>
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 text-neutral-600 text-xs font-bold text-center">
                Đầu truyện
              </span>
            )}

            {nextChapter ? (
              <Link
                href={`/truyen/${story.slug}/${nextChapter.chapter_number}`}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-all"
              >
                <span>Chương Sau</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 text-neutral-600 text-xs font-bold text-center">
                Hết chương
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
