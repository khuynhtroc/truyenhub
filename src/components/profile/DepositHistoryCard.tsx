"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import {
  Coins,
  CreditCard,
  Gift,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount_vnd: number;
  coins_added: number;
  order_code: string;
  status: "completed" | "pending" | "cancelled" | string;
  created_at: string;
}

interface DepositHistoryCardProps {
  transactions: CoinTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenSupport?: () => void;
}

export function DepositHistoryCard({
  transactions,
  isLoading = false,
  onRefresh,
  onOpenSupport,
}: DepositHistoryCardProps) {
  const [filterType, setFilterType] = useState<"all" | "recharge" | "voucher" | "mission">("all");

  const filteredTransactions = transactions.filter((tx) => {
    const code = (tx.order_code || "").toUpperCase();
    const amount = Number(tx.amount_vnd || 0);

    if (filterType === "recharge") {
      return amount > 0 || code.includes("NAPXU") || code.includes("TRANSFER") || code.includes("VPB");
    }
    if (filterType === "voucher") {
      return code.includes("VOUCHER");
    }
    if (filterType === "mission") {
      return code.includes("CHECKIN") || code.includes("MISSION");
    }
    return true;
  });

  const getTxTypeBadge = (tx: CoinTransaction) => {
    const code = (tx.order_code || "").toUpperCase();
    const amount = Number(tx.amount_vnd || 0);

    if (amount > 0 || code.includes("NAPXU") || code.includes("TRANSFER") || code.includes("VPB")) {
      return {
        label: "Nạp Ngân Hàng",
        icon: CreditCard,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      };
    }
    if (code.includes("VOUCHER")) {
      return {
        label: "Mã Quà Tặng",
        icon: Gift,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      };
    }
    if (code.includes("CHECKIN")) {
      return {
        label: "Điểm Danh Ngày",
        icon: CalendarCheck,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    }
    return {
      label: "Thưởng Nhiệm Vụ",
      icon: Coins,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Chờ duyệt
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Đã huỷ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-7 flex flex-col gap-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            <span>Lịch Sử Nạp Xu & Giao Dịch Ví</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toàn bộ biến động số dư, giao dịch nạp tiền qua ngân hàng và quà tặng xu của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Làm mới lịch sử"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}

          <Link
            href="/nap-xu"
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-sm hover:opacity-95 transition-all flex items-center gap-1"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>+ Nạp Xu Ngay</span>
          </Link>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
            filterType === "all"
              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
          }`}
        >
          Tất cả ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType("recharge")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
            filterType === "recharge"
              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
          }`}
        >
          Nạp Ngân Hàng
        </button>

        <button
          type="button"
          onClick={() => setFilterType("voucher")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
            filterType === "voucher"
              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
          }`}
        >
          Mã Quà Tặng
        </button>

        <button
          type="button"
          onClick={() => setFilterType("mission")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
            filterType === "mission"
              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
          }`}
        >
          Điểm Danh & Nhiệm Vụ
        </button>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
          <span className="text-xs font-bold">Đang tải lịch sử giao dịch...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-muted/30 border border-dashed border-border/80 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Chưa có giao dịch nào</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bạn chưa có giao dịch nào trong mục này. Nạp xu hoặc điểm danh để tích lũy xu nhé!
            </p>
          </div>
          <Link
            href="/nap-xu"
            className="mt-1 py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-xs transition-colors"
          >
            Nạp Xu Đọc Truyện VIP
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredTransactions.map((tx) => {
            const badge = getTxTypeBadge(tx);
            const BadgeIcon = badge.icon;
            const amountVnd = Number(tx.amount_vnd || 0);
            const dateStr = new Date(tx.created_at).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badge.color}`}
                  >
                    <BadgeIcon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-foreground">
                        {badge.label}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <code className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[260px]">
                        {tx.order_code}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Right: Coins & VND Amount */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 shrink-0">
                  <span className="font-black text-amber-500 text-sm sm:text-base flex items-center gap-1">
                    +{Number(tx.coins_added || 0).toLocaleString("vi-VN")} Xu
                  </span>
                  {amountVnd > 0 && (
                    <span className="text-xs font-bold text-rose-500">
                      {formatVND(amountVnd)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Support footer helper */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Bạn đã chuyển khoản nhưng chưa thấy cộng xu vào ví?</span>
        </div>
        {onOpenSupport ? (
          <button
            type="button"
            onClick={onOpenSupport}
            className="text-xs font-black text-rose-500 hover:text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Báo Admin hỗ trợ ngay</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            href="/nap-xu"
            className="text-xs font-black text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
          >
            <span>Báo Admin hỗ trợ ngay</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
