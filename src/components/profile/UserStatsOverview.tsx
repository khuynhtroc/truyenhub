"use client";

import { formatVND } from "@/lib/utils";
import {
  Coins,
  CreditCard,
  Crown,
  BookMarked,
  History,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { isUserVipActive, VIP_TIERS, getRemainingVipDays } from "@/lib/vip";

export interface UserStats {
  totalRechargedVnd: number;
  totalCoinsEarned: number;
  totalRechargeTxCount: number;
  pendingTxCount: number;
  readingCount: number;
  bookmarkCount: number;
  coinsBalance: number;
  vipLevel: number;
  vipUntil: string | null;
}

interface UserStatsOverviewProps {
  stats: UserStats;
  userEmail?: string;
  userName?: string;
}

export function UserStatsOverview({ stats, userEmail, userName }: UserStatsOverviewProps) {
  const isVip = isUserVipActive(stats.vipUntil);
  const remainingDays = isVip ? getRemainingVipDays(stats.vipUntil) : 0;
  const vipName = isVip
    ? VIP_TIERS[stats.vipLevel || 1]?.name || `VIP ${stats.vipLevel}`
    : "Độc Giả Thường";

  return (
    <div className="flex flex-col gap-4">
      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Ví Xu Khả Dụng */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Ví Xu Khả Dụng
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-500">
              {Number(stats.coinsBalance || 0).toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-foreground">Xu</span>
            </div>
            <Link
              href="/nap-xu"
              className="mt-2 text-[11px] font-extrabold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5"
            >
              <span>+ Nạp thêm xu</span>
            </Link>
          </div>
        </div>

        {/* 2. Tổng Tiền Đã Nạp */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Đã Nạp Ngân Hàng
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500">
              {formatVND(stats.totalRechargedVnd || 0)}
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">
              {stats.totalRechargeTxCount} lần giao dịch
            </span>
          </div>
        </div>

        {/* 3. Tổng Xu Đã Nhận (Tích luỹ) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500/10 via-card to-card border border-purple-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tổng Xu Tích Lũy
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-500">
              +{Number(stats.totalCoinsEarned || 0).toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-foreground">Xu</span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Từ nạp tiền, quà & nhiệm vụ
            </span>
          </div>
        </div>

        {/* 4. Cấp Bậc VIP */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-500/10 via-card to-card border border-rose-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Cấp Bậc Hội Viên
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-rose-500 truncate">
              {vipName}
            </div>
            <div className="mt-1">
              {isVip ? (
                <span className="text-[11px] text-emerald-500 font-bold">
                  Còn {remainingDays} ngày sử dụng
                </span>
              ) : (
                <Link
                  href="/vip"
                  className="text-[11px] font-bold text-amber-500 hover:underline"
                >
                  Nâng cấp mở khoá VIP &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 5. Tủ Truyện & Đang Theo Dõi */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tủ Truyện Theo Dõi
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.bookmarkCount || 0}{" "}
              <span className="text-xs font-semibold text-muted-foreground">truyện</span>
            </div>
            <Link
              href="/tu-truyen"
              className="mt-1 text-[11px] font-bold text-indigo-500 hover:underline block"
            >
              Xem tủ truyện &rarr;
            </Link>
          </div>
        </div>

        {/* 6. Lịch Sử Đọc Gần Đây */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Lịch Sử Đọc
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.readingCount || 0}{" "}
              <span className="text-xs font-semibold text-muted-foreground">tác phẩm</span>
            </div>
            <Link
              href="/tu-truyen"
              className="mt-1 text-[11px] font-bold text-cyan-500 hover:underline block"
            >
              Đọc tiếp tác phẩm &rarr;
            </Link>
          </div>
        </div>

        {/* 7. Trạng thái Giao Dịch Chờ Duyệt (Nếu có) */}
        {stats.pendingTxCount > 0 && (
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs flex items-center gap-3 animate-pulse">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="font-extrabold text-foreground block">
                Bạn có {stats.pendingTxCount} yêu cầu nạp xu đang chờ duyệt
              </span>
              <span className="text-[11px] text-muted-foreground">
                Admin đang đối chiếu biến động tài khoản và sẽ cộng xu cho bạn ngay.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
