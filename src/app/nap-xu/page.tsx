"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { Coins, ShieldCheck, Ticket, Crown } from "lucide-react";
import { VietQrPaymentSection } from "@/components/payment/VietQrPaymentSection";

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
            Quét mã VietQR hoặc chuyển khoản trực tiếp qua App ngân hàng - Tiền vào tài khoản trong 3 đến 5 giây hoàn toàn tự động.
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
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                  <span className="font-bold text-foreground block">Nhiệm Vụ Tích Xu & Chia Sẻ Nhận 100 Xu</span>
                  <span className="text-[11px] text-muted-foreground">Thả tim, bình luận, đọc truyện & Chia sẻ nhận ngay 100 Xu miễn phí</span>
                </div>
              </div>
              <Link
                href="/tai-khoan#diem-danh"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white font-black text-[11px] whitespace-nowrap shadow-sm transition-all"
              >
                Nhận Xu Ngay
              </Link>
            </div>

            <div className="mt-2 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-foreground block">Đọc không giới hạn với Gói Hội Viên VIP</span>
                  <span className="text-[11px] text-muted-foreground">Mở toàn bộ truyện VIP, sách eBook & 15 giọng đọc AI từ 29.000đ</span>
                </div>
              </div>
              <Link
                href="/vip"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white font-black text-[11px] whitespace-nowrap shadow-sm transition-all"
              >
                Xem Gói VIP
              </Link>
            </div>
          </div>

          {/* VietQR Display & Instant Banking App Transfer */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              2. Quét Mã Hoặc Mở App Ngân Hàng
            </h2>

            <VietQrPaymentSection
              key={selectedPkg.amount}
              amount={selectedPkg.amount}
              defaultTransferCode="NAPXU 888"
              coinsReceived={selectedPkg.coins}
            />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
