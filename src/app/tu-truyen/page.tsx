import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MOCK_STORIES } from "@/lib/mock-data";
import Link from "next/link";
import { Bookmark, Clock, ArrowRight, BookOpen, Image as ImageIcon } from "lucide-react";

export default function BookshelfPage() {
  const readingList = [
    {
      story: MOCK_STORIES[0], // Dragon Ball
      lastChapter: 3,
      totalChapters: 42,
      progressPercent: 7,
      updatedAt: "Vừa xong",
    },
    {
      story: MOCK_STORIES[2], // Vạn Cổ Kiếm Tôn
      lastChapter: 2,
      totalChapters: 50,
      progressPercent: 4,
      updatedAt: "2 giờ trước",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-rose-500" />
              Tủ Truyện Của Bạn
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Tự động lưu lại chương và vị trí trang bạn đang đọc dở.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {readingList.map((item) => (
            <div
              key={item.story.id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-rose-500/40 transition-all shadow-sm"
            >
              <div className="relative w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden shrink-0 bg-muted">
                <img src={item.story.cover_url} alt={item.story.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col justify-between flex-1 gap-1 truncate">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                    {item.story.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.updatedAt}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base truncate text-foreground">
                  {item.story.title}
                </h3>

                <p className="text-xs text-muted-foreground">
                  Đang đọc: <b className="text-foreground">Chương {item.lastChapter}</b> / {item.totalChapters}
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action button */}
              <Link
                href={`/truyen/${item.story.slug}/${item.lastChapter}`}
                className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Đọc Tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
