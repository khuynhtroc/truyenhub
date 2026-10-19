import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, CheckCircle2, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Cookie & Lưu Trữ Trình Duyệt",
  description:
    "Tìm hiểu cách DocTruyen.vip sử dụng cookie và bộ nhớ cục bộ (localStorage) để tối ưu hóa trải nghiệm đọc truyện của bạn.",
  alternates: {
    canonical: "https://doctruyen.vip/chinh-sach-cookie",
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>

        <header className="border-b border-border/50 pb-6 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold w-fit">
            <Cookie className="w-4 h-4" /> Chính Sách Cookie
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Chính Sách Cookie & Bộ Nhớ Cục Bộ
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Giải thích minh bạch về việc sử dụng Cookie và Web Storage trên DocTruyen.vip.
          </p>
        </header>

        <main className="flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">1. Cookie Là Gì?</h2>
            <p>
              Cookie là các tệp văn bản nhỏ được lưu trữ trên trình duyệt của bạn khi truy cập trang web. Tại DocTruyen.vip, chúng tôi kết hợp Cookie và <code>localStorage</code> để lưu trữ tùy chọn giao diện và trạng thái đọc truyện.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">2. Chúng Tôi Sử Dụng Cookie Vào Mục Đích Gì?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Cookie Thiết Yếu:</strong> Duy trì phiên đăng nhập Supabase và số dư xu an toàn.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Tủ Truyện Offline:</strong> Lưu chương bạn đang đọc dở và danh sách đánh dấu để bạn đọc tiếp ngay cả khi chưa đăng nhập.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Tùy Biến Trình Đọc:</strong> Ghi nhớ cỡ chữ, khoảng cách dòng, màu nền (Sáng / Tối / Sepia) và tốc độ giọng đọc AI.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Phân Tích Hiệu Suất:</strong> Google Analytics (GA4) và Vercel Web Analytics thu thập ẩn danh dữ liệu tải trang để khắc phục lỗi giật lag.
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">3. Cách Quản Lý Hoặc Tắt Cookie</h2>
            <p>
              Bạn hoàn toàn có thể xóa hoặc chặn cookie bất cứ lúc nào thông qua phần cài đặt của trình duyệt (Chrome, Safari, Edge, Firefox). Tuy nhiên, việc tắt cookie hoàn toàn có thể khiến tính năng đăng nhập và lưu vị trí đọc truyện bị gián đoạn.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
