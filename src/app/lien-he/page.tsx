import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Send, Globe, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Liên Hệ Hỗ Trợ & Hợp Tác",
  description:
    "Thông tin liên hệ hỗ trợ độc giả, đóng góp ý kiến và hợp tác phát triển nội dung cùng DocTruyen.vip.",
  alternates: {
    canonical: "https://doctruyen.vip/lien-he",
  },
};

export default function ContactPage() {
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
            <MessageSquare className="w-4 h-4" /> Trung Tâm Hỗ Trợ
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Liên Hệ Với DocTruyen.vip
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chúng tôi luôn lắng nghe ý kiến đóng góp của độc giả để không ngừng hoàn thiện trải nghiệm đọc truyện.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-border/50 bg-card flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-500" /> Hòm Thư Điện Tử
            </h2>
            <div className="flex flex-col gap-3 text-xs sm:text-sm text-muted-foreground">
              <div>
                <span className="block font-semibold text-foreground">Hỗ trợ độc giả & nạp xu:</span>
                <a href="mailto:support@doctruyen.vip" className="text-rose-500 hover:underline">
                  support@doctruyen.vip
                </a>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Hợp tác nội dung & tác giả:</span>
                <a href="mailto:contact@doctruyen.vip" className="text-rose-500 hover:underline">
                  contact@doctruyen.vip
                </a>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Khiếu nại bản quyền (DMCA):</span>
                <a href="mailto:dmca@doctruyen.vip" className="text-rose-500 hover:underline">
                  dmca@doctruyen.vip
                </a>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Kênh Trực Tuyến
            </h2>
            <div className="flex flex-col gap-3 text-xs sm:text-sm text-muted-foreground">
              <div>
                <span className="block font-semibold text-foreground">Website chính thức:</span>
                <a href="https://doctruyen.vip" className="text-indigo-400 hover:underline">
                  https://doctruyen.vip
                </a>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Thời gian hỗ trợ:</span>
                <span>24/7 qua hệ thống Ticket và Email</span>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs text-emerald-500">
                <ShieldCheck className="w-4 h-4" /> Hệ thống phản hồi tự động trong 15 phút
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
