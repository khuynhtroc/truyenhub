import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  QrCode,
  Flame,
  BookOpen,
  Headphones
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tải App Đọc Truyện Tranh & Truyện Chữ Siêu Tốc Cho Android & iOS",
  description:
    "Tải ngay ứng dụng DocTruyen.vip cho Android (file APK gốc) và hướng dẫn cài đặt trên iPhone/iPad (PWA). Đọc truyện full HD, audio AI, không quảng cáo, hoàn toàn miễn phí.",
  alternates: {
    canonical: "https://doctruyen.vip/tai-app",
  },
  openGraph: {
    title: "Tải App DocTruyen.vip - Đọc Truyện VIP Trên Điện Thoại",
    description: "Cài đặt ứng dụng DocTruyen.vip cho Android & iOS hoàn toàn miễn phí. Trải nghiệm đọc mượt mà đỉnh cao.",
    url: "https://doctruyen.vip/tai-app",
    siteName: "DocTruyen.vip",
  },
};

export default function TaiAppPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full pt-6 sm:pt-10 flex flex-col gap-10">
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ứng Dụng Đọc Truyện Đỉnh Cao 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Tải App <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">DocTruyen.vip</span> Cho Điện Thoại
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Thưởng thức hàng vạn bộ truyện tranh Manga, Webtoon và tiểu thuyết chọn lọc với tốc độ tải siêu tốc, giao diện tối ưu cho màn hình di động, hoàn toàn miễn phí.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 flex flex-col gap-2 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">Tốc Độ Siêu Tốc</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hạ tầng Cloudflare Edge CDN toàn cầu, lật trang không độ trễ.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 flex flex-col gap-2 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">Full Màn Hình</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Không thanh công cụ vướng víu, tận hưởng trọn vẹn khung hình.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 flex flex-col gap-2 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">AI Đọc Tự Nhiên</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Chuyển văn bản thành giọng đọc truyền cảm cho truyện chữ.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 flex flex-col gap-2 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">An Toàn 100%</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              File gốc sạch mã độc, dung lượng cực nhẹ chỉ 6.1 MB.
            </p>
          </div>
        </div>

        {/* 2 Big Platform Cards: Android vs iOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: ANDROID */}
          <div className="rounded-3xl bg-card border-2 border-emerald-500/30 p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-emerald-500/5 relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl shrink-0">
                    🤖
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">
                      Hệ Điều Hành Android
                    </span>
                    <h2 className="text-xl font-extrabold text-foreground">
                      Tải File Cài Đặt APK
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  v1.1 • 6.4 MB
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Tương thích với mọi điện thoại Samsung, Xiaomi, Oppo, Vivo, Realme... chạy Android 7.0 trở lên.
              </p>

              {/* Download CTA Button */}
              <a
                href="https://media.doctruyen.vip/DocTruyen-VIP.apk?v=1.1"
                download="DocTruyen-VIP.apk"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Tải File APK Trực Tiếp (Miễn Phí)</span>
              </a>

              {/* Steps Guide */}
              <div className="space-y-2 pt-2 text-xs">
                <h4 className="font-bold text-foreground">Cách cài đặt trên Android:</h4>
                <div className="space-y-1.5 text-muted-foreground">
                  <p>1. Bấm nút tải file APK ở trên về máy.</p>
                  <p>2. Mở file trong thông báo tải xuống (nếu máy báo nguồn không xác định $\rightarrow$ chọn Cho phép).</p>
                  <p>3. Bấm <strong>Cài đặt</strong> và mở app DocTruyen.vip từ màn hình.</p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Được quét virus & kiểm định an toàn tự động bởi Google Services</span>
            </div>
          </div>

          {/* CARD 2: IOS (IPHONE / IPAD) */}
          <div className="rounded-3xl bg-card border-2 border-indigo-500/30 p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-indigo-500/5 relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-3xl shrink-0">
                    🍏
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500">
                      iPhone & iPad (iOS)
                    </span>
                    <h2 className="text-xl font-extrabold text-foreground">
                      Thêm Vào Màn Hình Chính
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Chuẩn PWA VIP
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Không cần App Store, không cần máy tính Mac. Ứng dụng chạy toàn màn hình, mượt mà và lưu lịch sử đọc vĩnh viễn.
              </p>

              {/* Steps Guide for iOS */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p className="text-muted-foreground">
                    Mở <strong>Safari</strong> trên iPhone/iPad và truy cập <strong>doctruyen.vip</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
                    <span>Bấm nút</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">
                      <Share2 className="w-3.5 h-3.5 text-blue-500 inline" /> Chia sẻ
                    </span>
                    <span>ở thanh dưới Safari.</span>
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
                    <span>Cuộn xuống chọn</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">
                      <PlusSquare className="w-3.5 h-3.5 text-rose-500 inline" /> Thêm vào MH chính
                    </span>
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <p className="text-muted-foreground">
                    Bấm <strong>"Thêm" (Add)</strong> ở góc phải trên cùng $\rightarrow$ Biểu tượng DocTruyen sẽ xuất hiện trên màn hình iPhone!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Chạy toàn màn hình (Standalone) không có thanh URL Safari</span>
            </div>
          </div>
        </div>

        {/* QR Code Section for Desktop Users */}
        <div className="p-6 sm:p-8 rounded-3xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-rose-500">
              <QrCode className="w-4 h-4" />
              <span>Dành Cho Người Dùng Máy Tính (PC / Laptop)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
              Quét Mã QR Bằng Camera Điện Thoại
            </h3>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Bạn đang xem trang trên máy tính? Chỉ cần mở ứng dụng Camera trên iPhone hoặc Android quét mã QR bên cạnh để mở trang tải app trực tiếp trên điện thoại của bạn.
            </p>
          </div>

          <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white p-2 rounded-2xl shadow-lg border border-border/50 shrink-0 flex items-center justify-center">
            <img
              src="https://media.doctruyen.vip/qr-tai-app.png"
              alt="QR Code Tải App DocTruyen.vip"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
