import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Mail, AlertCircle, FileCheck2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Tuyên Bố Miễn Trừ Trách Nhiệm & Bản Quyền DMCA | DocTruyen.vip",
  description:
    "Tuyên bố miễn trừ trách nhiệm pháp lý và quy trình tiếp nhận khiếu nại bản quyền tác giả (DMCA) tại DocTruyen.vip.",
  alternates: {
    canonical: "https://doctruyen.vip/mien-tru-trach-nhiem",
  },
};

export default function DisclaimerPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold w-fit">
            <ShieldAlert className="w-4 h-4" /> Bản Quyền & Trách Nhiệm
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Miễn Trừ Trách Nhiệm & Bản Quyền DMCA
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chính sách tôn trọng quyền sở hữu trí tuệ và cơ chế gỡ bỏ nội dung theo quy chuẩn DMCA.
          </p>
        </header>

        <main className="flex flex-col gap-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> 1. Tuyên Bố Miễn Trừ Trách Nhiệm
            </h2>
            <p>
              DocTruyen.vip là nền tảng số hỗ trợ đọc truyện và sách online phục vụ cộng đồng độc giả vì mục đích giải trí và học tập. Mọi nội dung (văn bản, hình ảnh bìa, dữ liệu truyện tranh) được sưu tầm tự động từ các nguồn công khai trên mạng internet hoặc do người dùng đóng góp.
            </p>
            <p>
              Chúng tôi không sở hữu bản quyền gốc đối với các tác phẩm thuộc về các tác giả và nhà xuất bản thương mại. Nếu bạn có điều kiện, hãy mua sách và truyện bản quyền gốc để ủng hộ tác giả.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-500" /> 2. Chính Sách Bản Quyền DMCA
            </h2>
            <p>
              DocTruyen.vip tuyệt đối tuân thủ Đạo luật Bản quyền Thiên niên kỷ Kỹ thuật số (Digital Millennium Copyright Act - DMCA). Khi bạn là chủ sở hữu bản quyền hợp pháp hoặc người được ủy quyền và không muốn tác phẩm xuất hiện trên hệ thống:
            </p>
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-foreground text-xs sm:text-sm flex flex-col gap-2">
              <strong className="text-rose-500">Quy trình yêu cầu gỡ bỏ nội dung (Takedown Notice):</strong>
              <span>Vui lòng gửi email đến bộ phận pháp lý với các thông tin sau:</span>
              <ul className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Đường link URL cụ thể của truyện hoặc chương vi phạm trên DocTruyen.vip.</li>
                <li>Tên tác phẩm gốc và giấy tờ hoặc bằng chứng chứng minh bạn là chủ sở hữu bản quyền.</li>
                <li>Tuyên bố cam kết thông tin bạn cung cấp là chính xác và trung thực.</li>
              </ul>
            </div>
            <p>
              Sau khi nhận được thông báo hợp lệ, chúng tôi cam kết tiến hành xác minh và <strong>gỡ bỏ hoặc khóa truy cập nội dung vi phạm trong vòng 24 - 48 giờ làm việc</strong>.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" /> 3. Thông Tin Liên Hệ Tiếp Nhận
            </h2>
            <p>
              Mọi yêu cầu liên quan đến bản quyền và nội dung vui lòng gửi về:
            </p>
            <div className="flex items-center gap-3 text-sm font-bold text-foreground">
              <span>Email:</span>
              <a
                href="mailto:dmca@doctruyen.vip"
                className="text-rose-500 underline hover:text-rose-400"
              >
                dmca@doctruyen.vip
              </a>
              <span>hoặc</span>
              <a
                href="mailto:contact@doctruyen.vip"
                className="text-rose-500 underline hover:text-rose-400"
              >
                contact@doctruyen.vip
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
