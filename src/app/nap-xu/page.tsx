"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { Coins, QrCode, Sparkles, CheckCircle2, Copy, ShieldCheck, Zap, Ticket } from "lucide-react";


const PACKAGES = [
  { amount: 10000, coins: 100, bonus: "" },
  { amount: 20000, coins: 220, bonus: "+10% Thưởng" },
  { amount: 50000, coins: 600, bonus: "+20% Thưởng" },
  { amount: 100000, coins: 1300, bonus: "+30% Thưởng", popular: true },
  { amount: 200000, coins: 2800, bonus: "+40% Thưởng" },
  { amount: 500000, coins: 7500, bonus: "+50% Thưởng VIP" },
];

export default function NapXuPage() {
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[3]);
  const [copied, setCopied] = useState(false);

  const transferCode = "NAPXU 888";

  const copyCode = () => {
    navigator.clipboard.writeText(transferCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.vietqr.io/image/970422-0388888888-compact2.jpg?amount=${selectedPkg.amount}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=DOCTRUYENVIP`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold w-fit mx-auto">
            <Coins className="w-3.5 h-3.5" /> Nạp Xu Tự Động 24/7
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Nạp Xu Đọc Truyện VIP</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quét mã VietQR chuyển khoản ngân hàng - Tiền vào tài khoản trong 3 đến 5 giây hoàn toàn tự động.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Select Packages */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              1. Chọn Gói Nạp
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPkg.amount === pkg.amount;
                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 shadow-md ring-2 ring-rose-500/20"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                        Bán Chạy Nhất
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-lg mb-1">
                      <Coins className="w-5 h-5" />
                      <span>{pkg.coins} Xu</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">{formatVND(pkg.amount)}</div>
                    {pkg.bonus && (
                      <div className="text-[10px] text-rose-500 font-extrabold mt-1">{pkg.bonus}</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-muted/60 border border-border/50 text-xs text-muted-foreground flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Cam kết an toàn & bảo mật
              </div>
              <p>Mỗi giao dịch đều có mã chuyển khoản riêng biệt được ngân hàng ghi nhận tức thì.</p>
            </div>

            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/5 border border-rose-500/20 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-foreground block">Bạn có Giftcode hoặc muốn Tích Xu?</span>
                  <span className="text-[11px] text-muted-foreground">Điểm danh 7 ngày & Nhập mã voucher nhận Xu miễn phí</span>
                </div>
              </div>
              <Link
                href="/tai-khoan#diem-danh"
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] whitespace-nowrap shadow-sm transition-all"
              >
                Nhận Ngay
              </Link>
            </div>
          </div>


          {/* VietQR Display */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              2. Quét Mã Thanh Toán
            </h2>

            <div className="rounded-3xl border border-border/50 bg-card p-6 flex flex-col items-center text-center shadow-lg">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-border/50 mb-4">
                <img src={qrUrl} alt="VietQR" className="w-52 h-auto rounded-lg" />
              </div>

              {/* Details table */}
              <div className="w-full bg-muted/60 p-4 rounded-2xl border border-border/50 text-xs flex flex-col gap-2.5 mb-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ngân hàng nhận:</span>
                  <b className="font-bold">MB Bank (Quân Đội)</b>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <b className="font-black text-rose-500 text-sm">{formatVND(selectedPkg.amount)}</b>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Xu nhận được:</span>
                  <b className="font-black text-amber-500">{selectedPkg.coins} Xu</b>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="bg-background px-2.5 py-1 rounded-md font-mono font-bold text-amber-500 border border-border">
                      {transferCode}
                    </code>
                    <button
                      onClick={copyCode}
                      className="p-1 hover:bg-background rounded text-muted-foreground"
                      title="Sao chép"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {copied && (
                <p className="text-xs text-emerald-500 font-bold mb-3 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Đã sao chép nội dung!
                </p>
              )}

              <p className="text-[11px] text-muted-foreground">
                Sau khi chuyển khoản thành công, hệ thống Webhook sẽ tự động cộng xu vào tài khoản của bạn trong 3–5 giây.
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
