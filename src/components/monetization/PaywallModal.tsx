"use client";

import { useState } from "react";
import { Lock, Coins, Sparkles, QrCode, CheckCircle2, Copy, AlertCircle, X } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface PaywallModalProps {
  chapterTitle: string;
  chapterNumber: number;
  priceCoins: number;
  userCoins: number;
  onUnlockSuccess: () => void;
}

export function PaywallModal({
  chapterTitle,
  chapterNumber,
  priceCoins,
  userCoins,
  onUnlockSuccess,
}: PaywallModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"single" | "combo10" | "full">("single");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tính giá theo gói
  const plans = {
    single: { label: `Mở Chương ${chapterNumber}`, coins: priceCoins, discount: "" },
    combo10: { label: "Mở 10 chương tiếp theo", coins: Math.round(priceCoins * 10 * 0.9), discount: "Tiết kiệm 10%" },
    full: { label: "Mở trọn bộ tác phẩm", coins: Math.round(priceCoins * 30 * 0.7), discount: "Tiết kiệm 30%" },
  };

  const currentCost = plans[selectedPlan].coins;
  const isEnoughCoins = userCoins >= currentCost;

  const handleUnlock = () => {
    if (!isEnoughCoins) {
      setShowQR(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onUnlockSuccess();
    }, 800);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-8 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-card to-amber-500/5 p-6 sm:p-8 text-center shadow-xl backdrop-blur-md overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {!showQR ? (
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-foreground mb-1">
            Chương Trả Phí
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6">
            Ủng hộ tác giả & dịch giả để mở khóa <b className="text-foreground">{chapterTitle}</b>
          </p>

          {/* Balance badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border/50 text-xs font-semibold mb-6">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Số dư của bạn:</span>
            <b className="text-amber-500">{userCoins} Xu</b>
          </div>

          {/* Options */}
          <div className="w-full flex flex-col gap-2.5 mb-6 text-left">
            {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
              const p = plans[key];
              const isSelected = selectedPlan === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{p.label}</span>
                    {p.discount && (
                      <span className="text-[11px] text-rose-500 font-bold">{p.discount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500 font-black">
                    <Coins className="w-4 h-4" />
                    <span>{p.coins} Xu</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          {isEnoughCoins ? (
            <button
              onClick={handleUnlock}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? "Đang mở khóa..." : `Xác Nhận Mở (${currentCost} Xu)`}</span>
            </button>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => setShowQR(true)}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Nạp Thêm Xu Qua VietQR (Từ 10.000đ)</span>
              </button>
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Bạn còn thiếu {currentCost - userCoins} Xu
              </p>
            </div>
          )}
        </div>
      ) : (
        /* VietQR Instant Deposit View */
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-500" />
              Quét Mã VietQR Nạp Xu
            </h3>
            <button
              onClick={() => setShowQR(false)}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Mở ứng dụng ngân hàng bất kỳ hoặc ví điện tử để quét mã thanh toán tự động trong 3 giây:
          </p>

          {/* Dynamic Mock VietQR Image */}
          <div className="p-3 bg-white rounded-2xl shadow-md border border-border/50 mb-4">
            <img
              src="https://api.vietqr.io/image/970422-0388888888-compact2.jpg?amount=20000&addInfo=NAPXU%20888&accountName=DOCTRUYENVIP"
              alt="Mã VietQR"
              className="w-56 h-auto rounded-lg"
            />
          </div>

          {/* Transfer Details */}
          <div className="w-full bg-muted/60 p-3.5 rounded-xl border border-border/50 text-xs flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ngân hàng:</span>
              <b className="font-bold">MB Bank (Quân Đội)</b>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Số tiền:</span>
              <b className="font-bold text-rose-500 text-sm">20.000 VNĐ (= 200 Xu)</b>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-1.5">
                <code className="bg-background px-2 py-0.5 rounded font-bold text-amber-500 border">
                  NAPXU 888
                </code>
                <button
                  onClick={() => copyText("NAPXU 888")}
                  className="p-1 hover:bg-background rounded text-muted-foreground"
                  title="Sao chép"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {copied && (
            <p className="text-xs text-emerald-500 font-bold mb-3 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã sao chép nội dung chuyển khoản!
            </p>
          )}

          <button
            onClick={() => {
              alert("Hệ thống kiểm tra thanh toán tự động qua Webhook: Sau khi chuyển tiền, số xu sẽ được cộng tức thì vào tài khoản!");
              setShowQR(false);
            }}
            className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
          >
            Đã Chuyển Khoản Xong
          </button>
        </div>
      )}
    </div>
  );
}
