"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import {
  Heart,
  Coffee,
  Sparkles,
  QrCode,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Gift,
  BookOpen,
  ArrowRight,
  Share2,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const DONATE_PRESETS = [
  { amount: 10000, label: "1 Ly Trà Đá 🍵", desc: "Ủng hộ Admin ly nước mát" },
  { amount: 20000, label: "1 Cốc Cà Phê ☕", desc: "Thức đêm cập nhật truyện hay" },
  { amount: 50000, label: "1 Bát Phở Bò 🍜", desc: "Nạp năng lượng duy trì web", popular: true },
  { amount: 100000, label: "Tiền Máy Chủ 1 Tháng 🚀", desc: "Duy trì máy chủ & CDN siêu tốc" },
  { amount: 200000, label: "VIP Donor Yêu Quý 💖", desc: "Đồng hành lâu dài cùng DocTruyen" },
  { amount: 500000, label: "Nhà Tài Trợ Vàng 👑", desc: "Góp sức phát triển app & audio AI" },
];

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>("");
  const [donorMessage, setDonorMessage] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        setDonorName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      }
    });
  }, []);

  const effectiveAmount = isCustom ? (parseInt(customAmount, 10) || 10000) : selectedAmount;
  const transferContent = `DONATE DOCTRUYEN ${donorName ? donorName.slice(0, 15).toUpperCase().replace(/[^A-Z0-9]/g, "") : "VIP"}`;

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const qrUrl = `https://img.vietqr.io/image/970432-10011918888-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=mimiclothing`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-8">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Heart className="w-7 h-7 fill-white animate-pulse" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-black uppercase tracking-wider">
            <Coffee className="w-3.5 h-3.5" /> Đồng Hành & Ủng Hộ Admin
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Ủng Hộ Admin ĐọcTruyện.VIP
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Hệ thống đã <strong className="text-emerald-500">mở khóa 100% toàn bộ truyện chữ & truyện tranh miễn phí</strong> cho tất cả độc giả đã đăng nhập.
            Nếu yêu mến website, bạn có thể tùy tâm donate một ly cà phê để tiếp sức cho Admin trang trải chi phí máy chủ, đường truyền CDN tốc độ cao và số hóa thêm nhiều truyện hay mỗi ngày!
          </p>
        </div>

        {/* Free Stories Announcement Box */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-card to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Tất Cả Truyện Đang Mở Khóa Đọc Miễn Phí!
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chỉ cần <strong className="text-foreground">Đăng nhập tài khoản</strong> là có thể đọc trọn bộ không giới hạn. Tích lũy <strong>Point</strong> bằng cách like, bình luận và chia sẻ truyện.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs shrink-0 whitespace-nowrap">
            100% Free VIP
          </span>
        </div>

        {/* Main 2-Col Donation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Choose Amount & Message */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                1. Chọn Mức Ủng Hộ Tùy Tâm
              </h2>
              {isCustom ? (
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Chọn mức gợi ý &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Nhập số tiền khác &rarr;
                </button>
              )}
            </div>

            {!isCustom ? (
              <div className="grid grid-cols-2 gap-2.5">
                {DONATE_PRESETS.map((preset) => {
                  const isSelected = selectedAmount === preset.amount;
                  return (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => setSelectedAmount(preset.amount)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-rose-500 bg-rose-500/10 shadow-md ring-2 ring-rose-500/20"
                          : "border-border/60 hover:bg-muted/40 bg-card"
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                          Gợi ý phổ biến
                        </span>
                      )}
                      <div className="text-xs font-extrabold text-foreground mb-1">
                        {preset.label}
                      </div>
                      <div className="text-sm sm:text-base font-black text-rose-500">
                        {formatVND(preset.amount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-rose-500/30 flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">
                  Nhập số tiền bạn muốn ủng hộ (VNĐ):
                </label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ví dụ: 30000"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted border border-border text-foreground font-black text-base focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
                <span className="text-[11px] text-muted-foreground">
                  Số tiền tối thiểu: 5.000đ. Cảm ơn tấm lòng của bạn! ❤️
                </span>
              </div>
            )}

            {/* Donor info (Optional) */}
            <div className="flex flex-col gap-2 pt-2">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                2. Thông Tin Độc Giả (Tùy Chọn)
              </h2>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Tên / Biệt danh của bạn (để Admin gửi lời cảm ơn)"
                className="w-full h-10 px-3.5 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
              <textarea
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder="Lời nhắn nhủ gửi tới Admin / Yêu cầu truyện muốn đọc..."
                rows={2}
                className="w-full p-3 rounded-xl bg-card border border-border/80 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
              />
            </div>

            {/* Assurance Box */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-xs text-muted-foreground flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hoàn toàn tự nguyện & Minh bạch</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Mọi đóng góp từ quý độc giả đều được dùng 100% để thanh toán tiền thuê Cloudflare Workers, kho lưu trữ Cloudflare R2, domain và mua bản quyền sách giấy để scan phục vụ cộng đồng.
              </p>
            </div>
          </div>

          {/* Right Column: VietQR Code & Banking Details */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              3. Quét Mã VietQR Chuyển Khoản Nhanh
            </h2>

            <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xl flex flex-col items-center gap-4 text-center">
              {/* QR Image with dynamic amount */}
              <div className="relative p-2 rounded-2xl bg-white border border-neutral-200 shadow-md">
                <img
                  src={qrUrl}
                  alt="VietQR Donate DocTruyen.VIP"
                  className="w-56 h-auto sm:w-64 object-contain rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Số tiền ủng hộ</span>
                <span className="text-xl sm:text-2xl font-black text-rose-500">
                  {formatVND(effectiveAmount)}
                </span>
              </div>

              {/* Bank Details List */}
              <div className="w-full flex flex-col gap-2 pt-2 border-t border-border/60 text-xs text-left">
                {/* Bank Name */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Ngân hàng:</span>
                    <strong className="text-foreground font-black">VPBank (Việt Nam Thịnh Vượng)</strong>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    VPB
                  </span>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Số tài khoản:</span>
                    <strong className="text-foreground font-mono font-black text-sm text-amber-500">
                      10011918888
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("10011918888", "account")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    {copiedField === "account" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Holder */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Chủ tài khoản:</span>
                    <strong className="text-foreground font-black uppercase">
                      mimiclothing
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("mimiclothing", "name")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    {copiedField === "name" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Transfer Content */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Nội dung chuyển khoản:</span>
                    <strong className="text-rose-500 font-mono font-black text-xs">
                      {transferContent}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, "content")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    {copiedField === "content" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                💖 Mở bất kỳ app ngân hàng nào (Vietcombank, MB, Techcombank, VPBank, MoMo...) và quét mã QR ở trên để hoàn tất chuyển khoản trong 3 giây.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

