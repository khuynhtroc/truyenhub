import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { VipMembershipView } from "@/components/vip/VipMembershipView";

export const metadata: Metadata = {
  title: "Đặc Quyền Thành Viên VIP - Đọc Truyện & Sách Không Giới Hạn",
  description:
    "Phân loại hội viên VIP, điều kiện và quyền hạn đọc truyện tranh, tiểu thuyết, sách eBook bản quyền và nghe Audio AI chất lượng cao tại DocTruyen.vip.",
  alternates: {
    canonical: "https://doctruyen.vip/vip",
  },
  openGraph: {
    title: "Đặc Quyền Hội Viên VIP | DocTruyen.vip",
    description: "Khám phá quyền hạn đọc truyện, sách eBook và nghe Audio AI cao cấp của các cấp bậc VIP.",
    url: "https://doctruyen.vip/vip",
    siteName: "DocTruyen.vip",
  },
};

export default function VipPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 sm:py-10 flex-1">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
              <span className="mt-3 text-xs text-muted-foreground font-semibold">
                Đang tải thông tin hội viên VIP...
              </span>
            </div>
          }
        >
          <VipMembershipView />
        </Suspense>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
