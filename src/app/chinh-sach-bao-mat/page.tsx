import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật Thông Tin",
  description:
    "Chính sách bảo mật thông tin người dùng và quyền riêng tư khi truy cập nền tảng đọc truyện online DocTruyen.vip.",
  alternates: {
    canonical: "https://doctruyen.vip/chinh-sach-bao-mat",
  },
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold w-fit">
            <ShieldCheck className="w-4 h-4" /> Cam Kết Bảo Mật 100%
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Chính Sách Bảo Mật Thông Tin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Cập nhật lần cuối: Tháng 10 năm 2026 · Áp dụng cho toàn bộ người dùng trên DocTruyen.vip
          </p>
        </header>

        <main className="flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-500" /> 1. Thu Thập Thông Tin
            </h2>
            <p>
              DocTruyen.vip tôn trọng tuyệt đối quyền riêng tư của độc giả. Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành và nâng cao trải nghiệm đọc truyện của bạn:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Thông tin tài khoản: Email và tên hiển thị khi bạn tự nguyện đăng ký hoặc đăng nhập nhanh qua Google / Facebook Login. Xem thêm <Link href="/chinh-sach-quyen-rieng-tu" className="text-rose-500 underline font-semibold">Chính sách quyền riêng tư</Link> để biết chi tiết hướng dẫn xóa dữ liệu.</li>
              <li>Dữ liệu tủ truyện: Lịch sử đọc, chương đã mở khóa và bookmark truyện để đồng bộ giữa các thiết bị (Web, Android, iOS).</li>
              <li>Dữ liệu kỹ thuật ẩn danh: Địa chỉ IP, loại trình duyệt, hệ điều hành nhằm phân tích tốc độ tải trang và bảo vệ hệ thống khỏi tấn công DDoS.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" /> 2. Sử Dụng & Bảo Vệ Thông Tin
            </h2>
            <p>
              Mọi dữ liệu cá nhân của người dùng được mã hóa an toàn theo tiêu chuẩn SSL/TLS 256-bit và lưu trữ trên cụm máy chủ Supabase đạt chuẩn bảo mật quốc tế. Chúng tôi cam kết:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Không bán dữ liệu:</strong> Tuyệt đối không bán, chia sẻ hoặc tiết lộ thông tin người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">
                  <strong>Mã hóa tài chính:</strong> Toàn bộ giao dịch nạp xu qua chuyển khoản VietQR được xử lý tự động qua ngân hàng, chúng tôi không lưu giữ mật khẩu hay mã OTP ngân hàng.
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> 3. Quyền Của Người Dùng
            </h2>
            <p>
              Bạn có quyền yêu cầu tra cứu, chỉnh sửa hoặc xóa vĩnh viễn toàn bộ dữ liệu tài khoản, lịch sử đọc truyện của mình bất kỳ lúc nào bằng cách truy cập trang Tài Khoản hoặc gửi yêu cầu về email quản trị: <strong>contact@doctruyen.vip</strong>.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
