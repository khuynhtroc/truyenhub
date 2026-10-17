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
  Flag,
  BookOpen,
  Search,
  X,
  Lock,
  Crown,
} from "lucide-react";
import { CommentSection } from "@/components/comment/CommentSection";
import { normalizeMediaUrl, SITE_CONFIG } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { recordReadingProgress } from "@/lib/sync/syncService";
import { canUserReadChapter } from "@/lib/vip";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { recordMissionActivity } from "@/lib/missions";

interface ComicReaderProps {
  story: Story;
  chapter: Chapter;
  allChapters: Chapter[];
}

export function ComicReader({ story, chapter, allChapters }: ComicReaderProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!chapter.is_locked);
  const [vipUnlockedReason, setVipUnlockedReason] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(25);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageWidth, setImageWidth] = useState<"max-w-xl" | "max-w-3xl" | "max-w-full">("max-w-3xl");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [tocSearch, setTocSearch] = useState("");

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

  // Sync reading progress to bookmarks
  useEffect(() => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("truyenhub_bookmarks") || "[]");
      const foundIdx = savedBookmarks.findIndex((b: any) => b.slug === story.slug);
      if (foundIdx >= 0) {
        savedBookmarks[foundIdx].last_chapter = chapter.chapter_number;
        localStorage.setItem("truyenhub_bookmarks", JSON.stringify(savedBookmarks));
      }
    } catch (_) {}
  }, [story.slug, chapter.chapter_number]);

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

  // Kiểm tra đăng nhập & quyền hạn VIP
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (user) {
        supabase
          .from("profiles")
          .select("coins, coins_balance, vip_level, vip_until")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const currentCoins = Number(data.coins_balance ?? data.coins ?? 0);
              setUserCoins(currentCoins);

              if (chapter.is_locked) {
                const check = canUserReadChapter(
                  Number(data.vip_level || 0),
                  data.vip_until,
                  chapter.price_coins,
                  chapter.is_locked
                );
                if (check.allowed) {
                  setIsUnlocked(true);
                  setVipUnlockedReason(check.reason || null);
                }
              }
            }
          });

        if (chapter.is_locked) {
          supabase
            .from("unlocked_chapters")
            .select("chapter_id")
            .eq("user_id", user.id)
            .eq("chapter_id", chapter.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) setIsUnlocked(true);
            });
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setCurrentUser(u);
      setAuthChecked(true);
      if (u) {
        supabase
          .from("profiles")
          .select("coins, coins_balance, vip_level, vip_until")
          .eq("id", u.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const currentCoins = Number(data.coins_balance ?? data.coins ?? 0);
              setUserCoins(currentCoins);

              if (chapter.is_locked) {
                const check = canUserReadChapter(
                  Number(data.vip_level || 0),
                  data.vip_until,
                  chapter.price_coins,
                  chapter.is_locked
                );
                if (check.allowed) {
                  setIsUnlocked(true);
                  setVipUnlockedReason(check.reason || null);
                }
              }
            }
          });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [chapter.id, chapter.is_locked, chapter.price_coins]);

  // Ghi nhận tiến độ đọc & đồng bộ đa thiết bị
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      recordReadingProgress(story.id, chapter.id, scrollProgress, user?.id);
      if (user?.id) {
        recordMissionActivity("read_chapter", { story_id: story.id, chapter_id: chapter.id });
      }
    });
  }, [story.id, chapter.id, scrollProgress > 80]);

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

  const rawPages = chapter.pages_images;
  const pages: string[] = Array.isArray(rawPages)
    ? rawPages
    : typeof rawPages === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(rawPages);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center select-none">
      {/* Floating Header Toolbar with Safe Area Inset */}
      <header
        className={`sticky top-0 z-40 w-full bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 pt-[calc(max(env(safe-area-inset-top,0px),var(--app-safe-top,0px))+0.625rem)] pb-2.5 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Reading Progress Bar attached to bottom of header */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
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
            {/* TOC Toggle Button */}
            <button
              onClick={() => setShowToc(!showToc)}
              className={`p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 ${
                showToc ? "bg-rose-500 text-white" : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
              title="Mục lục các tập"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Mục lục</span>
            </button>

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

      {/* Slide-out Table of Contents Drawer */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full bg-neutral-900 border-l border-neutral-800 flex flex-col p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Mục lục ({allChapters.length} tập)
                </h3>
                <p className="text-xs text-neutral-400 truncate max-w-[200px]">{story.title}</p>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tocSearch}
                onChange={(e) => setTocSearch(e.target.value)}
                placeholder="Tìm số tập / tên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {allChapters
                .filter(
                  (c) =>
                    !tocSearch.trim() ||
                    c.chapter_number.toString().includes(tocSearch.trim()) ||
                    c.title.toLowerCase().includes(tocSearch.toLowerCase().trim())
                )
                .map((c) => {
                  const isCurrent = c.chapter_number === chapter.chapter_number;
                  return (
                    <Link
                      key={c.id || c.chapter_number}
                      href={`/truyen/${story.slug}/${c.chapter_number}`}
                      onClick={() => setShowToc(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                          : "hover:bg-neutral-800 text-neutral-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`text-xs ${isCurrent ? "text-rose-400 font-black" : "text-neutral-500 font-semibold"}`}>
                          C.{c.chapter_number}
                        </span>
                        <span className="truncate">{c.title}</span>
                      </div>
                      {c.is_locked ? (
                        <span className="shrink-0 text-[10px] text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Lock className="w-3 h-3" /> {c.price_coins}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Free
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Comic Pages Container */}
      <main ref={containerRef} className={`w-full ${imageWidth} mx-auto flex flex-col items-center my-4`}>
        {authChecked && !currentUser ? (
          <AuthRequiredGate
            storyTitle={story.title}
            chapterTitle={chapter.title}
            storySlug={story.slug}
          />
        ) : isUnlocked ? (
          <div className="w-full flex flex-col items-center">
            {vipUnlockedReason && (
              <div className="w-full mb-4 px-4">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-500 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>{vipUnlockedReason}</span>
                  </div>
                  <Link href="/vip" className="text-[11px] hover:underline font-extrabold whitespace-nowrap">
                    Hội viên VIP &rarr;
                  </Link>
                </div>
              </div>
            )}
            {pages.map((rawUrl, idx) => {
              const imgUrl = normalizeMediaUrl(rawUrl);
              return (
                <div key={idx} className="relative w-full overflow-hidden bg-neutral-900 border-b border-neutral-900/40">
                  <img
                    src={imgUrl}
                    alt={`Trang ${idx + 1}`}
                    className="w-full h-auto object-cover block select-none"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                      if (imgUrl.includes("media.doctruyen.vip") || e.currentTarget.src.includes("media.doctruyen.vip")) {
                        e.currentTarget.src = imgUrl.replace("https://media.doctruyen.vip", SITE_CONFIG.fallbackR2Url);
                      }
                    }}
                  />
                </div>
              );
            })}
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

        {/* Comment Section */}
        <div className="w-full max-w-3xl mx-auto px-4 my-8">
          <CommentSection
            storyId={story.id}
            storyTitle={story.title}
            chapterNumber={chapter.chapter_number}
          />
        </div>
      </main>
    </div>
  );
}
