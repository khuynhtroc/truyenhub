import { Suspense } from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { RankingsView } from "@/components/rankings/RankingsView";
import { Trophy, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Bảng Xếp Hạng Truyện & Sách Hay Nhất 2026",
  description:
    "Bảng xếp hạng truyện tranh (Manga), truyện chữ (Tiểu thuyết) và sách tinh hoa hay nhất theo lượt đọc, lượt yêu thích và đề cử thời gian thực tại DocTruyen.vip.",
  keywords: [
    "bảng xếp hạng truyện",
    "top truyện tranh",
    "top truyện chữ",
    "sách hay bán chạy",
    "truyện hot nhất",
    "manga xếp hạng",
    "doctruyen vip ranking",
  ],
  alternates: {
    canonical: "https://doctruyen.vip/bang-xep-hang",
  },
  openGraph: {
    title: "Bảng Xếp Hạng Truyện & Sách Hay Nhất 2026 - DocTruyen.vip",
    description:
      "Khám phá các siêu phẩm truyện tranh, truyện chữ và sách hay dẫn đầu xu hướng đọc sách online tại DocTruyen.vip.",
    url: "https://doctruyen.vip/bang-xep-hang",
    siteName: "DocTruyen.vip",
    locale: "vi_VN",
    type: "website",
  },
};

export default function BangXepHangPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-4 sm:pt-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
              <span className="text-xs font-bold">Đang tải bảng xếp hạng...</span>
            </div>
          }
        >
          <RankingsView />
        </Suspense>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
