import Link from "next/link";
import { BookOpen, Sparkles, ShieldCheck, Heart, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-card/60 border-t border-border/50 text-muted-foreground mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Intro */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="font-extrabold text-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                  DocTruyen
                </span>
                <span className="ml-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
                  VIP
                </span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground/80 mt-1">
              DocTruyen.vip là website đọc truyện tranh Webtoon/Manga full HD và tiểu thuyết truyện chữ online phong phú hàng đầu. Tích hợp AI đọc truyện tự nhiên, tốc độ tải siêu tốc.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-rose-500">
              <Sparkles className="w-4 h-4" />
              <span>Trải nghiệm đọc VIP hoàn toàn miễn phí</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              Khám Phá
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?type=comic" className="hover:text-foreground transition-colors">
                  Truyện Tranh Tuyển Chọn
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?type=novel" className="hover:text-foreground transition-colors">
                  Truyện Chữ / Tiểu Thuyết
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?genre=S%C3%A1ch" className="hover:text-foreground transition-colors font-semibold text-emerald-500">
                  Danh Mục Sách & Ebook
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors font-semibold text-rose-500">
                  Blog & Tin Tức Truyện
                </Link>
              </li>
              <li>
                <Link href="/tu-truyen" className="hover:text-foreground transition-colors">
                  Tủ Truyện Cá Nhân
                </Link>
              </li>
              <li>
                <Link href="/nap-xu" className="hover:text-foreground transition-colors">
                  Nạp Xu Ủng Hộ Tác Giả
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Genres */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              Thể Loại Hot
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-medium">
              <li>
                <Link href="/kham-pha?genre=Huyền+Huyễn" className="hover:text-foreground transition-colors">
                  Huyền Huyễn & Tiên Hiệp
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?genre=Trinh+Thám" className="hover:text-foreground transition-colors">
                  Trinh Thám & Ly Kỳ
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?genre=Hài+Hước" className="hover:text-foreground transition-colors">
                  Hài Hước & Đời Thường
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?genre=Kiếm+Hiệp" className="hover:text-foreground transition-colors">
                  Võ Thuật & Kiếm Hiệp
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?genre=Webtoon" className="hover:text-foreground transition-colors">
                  Webtoon / Manhwa Hàn Quốc
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & DMCA */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
              Chính Sách & Bản Quyền
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs font-medium">
              <li>
                <Link href="/chinh-sach-bao-mat" className="hover:text-rose-500 transition-colors">
                  Chính Sách Bảo Mật
                </Link>
              </li>
              <li>
                <Link href="/dieu-khoan-su-dung" className="hover:text-rose-500 transition-colors">
                  Điều Khoản Dịch Vụ
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-cookie" className="hover:text-rose-500 transition-colors">
                  Chính Sách Cookie
                </Link>
              </li>
              <li>
                <Link href="/mien-tru-trach-nhiem" className="hover:text-rose-500 transition-colors">
                  Miễn Trừ Trách Nhiệm & DMCA
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-rose-500 transition-colors">
                  Liên Hệ & Hỗ Trợ Độc Giả
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cloudflare R2 SSL Secure</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground/70">
          <div className="flex items-center gap-1">
            <span>© 2026</span>
            <strong className="text-foreground">DocTruyen.vip</strong>
            <span>— Đọc truyện online đỉnh cao.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/kham-pha" className="hover:underline">
              Sơ đồ trang
            </Link>
            <a href="https://doctruyen.vip/sitemap.xml" target="_blank" rel="noreferrer" className="hover:underline">
              Sitemap.xml
            </a>
            <span className="flex items-center gap-1">
              Phát triển với <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> bởi DocTruyen Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
