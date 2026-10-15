import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertTriangle, ShieldCheck, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng Dịch Vụ | DocTruyen.vip",
  description:
    "Điều khoản và quy định sử dụng dịch vụ đọc truyện tranh, truyện chữ online trên DocTruyen.vip.",
  alternates: {
    canonical: "https://doctruyen.vip/dieu-khoan-su-dung",
  },
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold w-fit">
            <Scale className="w-4 h-4" /> Quy Định Sử Dụng
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bằng việc truy cập hoặc sử dụng ứng dụng và website DocTruyen.vip, bạn đồng ý tuân thủ các điều khoản dưới đây.
          </p>
        </header>

        <main className="flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-500" /> 1. Dịch Vụ & Trách Nhiệm Độc Giả
            </h2>
            <p>
              DocTruyen.vip cung cấp nền tảng đọc truyện trực tuyến miễn phí và hỗ trợ các tính năng cao cấp (giọng đọc AI, mở khóa chương VIP, lưu tủ truyện đám mây).
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Người dùng cam kết không sử dụng công cụ tự động (bot, scraper, crawler) gây tắc nghẽn hoặc quá tải hệ thống máy chủ.</li>
              <li>Không đăng tải nội dung bình luận vi phạm pháp luật Việt Nam, bôi nhọ, xúc phạm danh dự cá nhân hoặc kích động bạo lực.</li>
              <li>Tự bảo mật thông tin tài khoản cá nhân và mật khẩu đăng nhập.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> 2. Quy Định Về Xu & Mở Khóa Nội Dung
            </h2>
            <p>
              Xu trên hệ thống được sử dụng để mở khóa các chương VIP hoặc ủng hộ tác giả:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Xu đã nạp thành công không thể quy đổi lại thành tiền mặt.</li>
              <li>Chương truyện sau khi đã mở khóa bằng xu sẽ thuộc quyền đọc vĩnh viễn của tài khoản đó.</li>
              <li>Trường hợp gặp sự cố gián đoạn khi nạp xu qua VietQR, đội ngũ hỗ trợ sẽ kiểm tra đối soát và cộng xu trong vòng 5-15 phút.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> 3. Thay Đổi Điều Khoản
            </h2>
            <p>
              DocTruyen.vip có quyền sửa đổi hoặc bổ sung điều khoản bất kỳ lúc nào để phù hợp với quy định pháp luật hiện hành và sự phát triển của nền tảng. Thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang này.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
