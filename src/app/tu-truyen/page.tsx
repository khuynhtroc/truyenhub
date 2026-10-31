"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SafeImage } from "@/components/common/SafeImage";
import { useSyncState } from "@/lib/sync/useSyncState";
import { AuthModal } from "@/components/auth/AuthModal";
import { 
  Bookmark, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Trash2, 
  Compass, 
  Sparkles,
  BookMarked,
  CloudCheck,
  RefreshCw
} from "lucide-react";

export default function BookshelfPage() {
  const { user, bookmarks, isSyncing, toggleBookmark, refreshBookmarks } = useSyncState();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetChapterUrl, setTargetChapterUrl] = useState<string>("");

  const handleReadClick = (e: React.MouseEvent, url: string) => {
    if (!user) {
      e.preventDefault();
      setTargetChapterUrl(url);
      setIsAuthModalOpen(true);
    }
  };

  const handleRemove = async (item: any) => {
    await toggleBookmark(item);
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả truyện khỏi Tủ Truyện?")) {
      try {
        localStorage.removeItem("doctruyen_bookmarks");
        localStorage.removeItem("truyenhub_bookmarks");
        refreshBookmarks();
      } catch (_) {}
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
              <Bookmark className="w-7 h-7 text-rose-500 fill-rose-500/20" />
              Tủ Truyện Của Bạn
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Bộ sưu tập các tác phẩm bạn đã đánh dấu yêu thích, đồng bộ tự động giữa Web, Android và iOS.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sync Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-[11px] font-semibold text-muted-foreground">
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Đang đồng bộ...</span>
                </>
              ) : user ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-500 font-bold">Cloud Sync</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <Link href="/tai-khoan" className="hover:underline text-rose-500 font-bold">
                    Đăng nhập để đồng bộ
                  </Link>
                </>
              )}
            </div>

            {bookmarks.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* List or Empty State */}
        {bookmarks.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-card border border-border/60 flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <BookMarked className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                Tủ truyện của bạn đang trống
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Khi đọc bất kỳ tác phẩm truyện tranh, sách hay tiểu thuyết nào, hãy bấm nút <b>&quot;Tủ truyện&quot;</b> để lưu lại tại đây!
              </p>
            </div>
            <Link
              href="/kham-pha"
              className="mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all hover:opacity-95"
            >
              <Compass className="w-4 h-4" />
              <span>Khám Phá Truyện Ngay</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((item) => {
              const currentChapter = Number(item.last_chapter || item.last_chapter_number || 1);
              const totalChaps = Number(item.total_chapters || 1);
              const percent = item.progress_percent ?? Math.min(100, Math.round((currentChapter / totalChaps) * 100));

              return (
                <div
                  key={item.slug}
                  className="flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border border-border/60 bg-card hover:border-rose-500/40 transition-all shadow-sm group"
                >
                  <Link
                    href={`/truyen/${item.slug}`}
                    className="relative w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden shrink-0 bg-muted shadow-sm"
                  >
                    <SafeImage
                      src={item.cover_url}
                      alt={item.title}
                      fallbackTitle={item.title}
                      fallbackAuthor={item.author_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex flex-col justify-between flex-1 gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {item.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.author_name}
                      </span>
                    </div>

                    <Link
                      href={`/truyen/${item.slug}`}
                      className="font-bold text-sm sm:text-base truncate text-foreground hover:text-rose-500 transition-colors"
                    >
                      {item.title}
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      Đang đọc: <b className="text-foreground">Tập {currentChapter}</b> / {totalChaps} chương
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/truyen/${item.slug}/${currentChapter}`}
                      onClick={(e) => handleReadClick(e, `/truyen/${item.slug}/${currentChapter}`)}
                      className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Đọc Tiếp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleRemove(item)}
                      className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Xóa khỏi tủ truyện"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />

      {/* Auth Modal when clicking to read */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={targetChapterUrl}
        title="Đăng Nhập Để Đọc Tiếp"
        subtitle="Vui lòng đăng nhập tài khoản để đọc tiếp chương đã lưu"
      />
    </div>
  );
}
