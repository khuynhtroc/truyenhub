"use client";

import { useState } from "react";
import { Ticket, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Copy, ArrowRight } from "lucide-react";

interface VoucherRedeemCardProps {
  onVoucherRedeemed?: (newBalance: number) => void;
  user: any;
}

export function VoucherRedeemCard({ onVoucherRedeemed, user }: VoucherRedeemCardProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const popularCodes = [
    { code: "TANTHU2026", label: "+50 Xu Tân Thủ" },
    { code: "TRUYENHUBVIP", label: "+100 Xu Độc Giả VIP" },
    { code: "TICHDIEM2026", label: "+30 Xu Tri Ân" },
  ];

  const handleRedeem = async (codeToUse?: string) => {
    const targetCode = (codeToUse || code).trim().toUpperCase();
    if (!targetCode) {
      setStatus({ type: "error", message: "Vui lòng nhập mã voucher." });
      return;
    }

    if (!user) {
      setStatus({ type: "error", message: "Vui lòng đăng nhập để đổi mã quà tặng." });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể đổi mã voucher.");
      }

      setStatus({
        type: "success",
        message: data.message || `Đổi mã thành công! Bạn nhận được +${data.reward_coins} Xu.`,
      });

      setCode("");

      if (onVoucherRedeemed && typeof data.new_balance === "number") {
        onVoucherRedeemed(data.new_balance);
      }
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Lỗi xử lý đổi mã voucher.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/5 p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
            Nhập Giftcode / Voucher Quà Tặng
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nhận ngay Xu miễn phí để đọc và mở khóa các chương truyện VIP đặc quyền.
          </p>
        </div>
      </div>

      {/* Input Box */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRedeem();
              }
            }}
            placeholder="NHẬP MÃ CODE (VD: TANTHU2026)"
            className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border/60 focus:border-rose-500 focus:outline-none text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-black tracking-wider uppercase transition-all"
            disabled={loading}
          />
          {code && (
            <button
              onClick={() => setCode("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => handleRedeem()}
          disabled={loading || !code.trim()}
          className="py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? "Đang xử lý..." : "Đổi Mã Ngay"}</span>
        </button>
      </div>

      {/* Status Alert */}
      {status && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
            status.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Suggested Popular Codes */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-muted-foreground">Mã hot hôm nay:</span>
        {popularCodes.map((item) => (
          <button
            key={item.code}
            onClick={() => {
              setCode(item.code);
              handleRedeem(item.code);
            }}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl bg-card border border-border/60 hover:border-rose-500/50 hover:bg-rose-500/10 text-foreground hover:text-rose-500 text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
          >
            <span>{item.code}</span>
            <span className="text-[10px] text-amber-500 font-bold group-hover:text-amber-400">
              ({item.label})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
