"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Gift,
  Sparkles,
  CheckCircle2,
  Lock,
  Crown,
  Coins,
  RefreshCw,
  Flame,
} from "lucide-react";

interface DailyCheckinCardProps {
  onRewardClaimed?: (newBalance: number) => void;
  user: any;
}

export function DailyCheckinCard({ onRewardClaimed, user }: DailyCheckinCardProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkinData, setCheckinData] = useState<{
    rewards: number[];
    hasCheckedInToday: boolean;
    currentStreak: number;
    nextStreak: number;
    nextReward: number;
    totalCheckins: number;
  }>({
    rewards: [5, 5, 10, 10, 15, 15, 30],
    hasCheckedInToday: false,
    currentStreak: 0,
    nextStreak: 1,
    nextReward: 5,
    totalCheckins: 0,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCheckinStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vouchers/checkin");
      const data = await res.json();
      if (res.ok) {
        setCheckinData(data);
      }
    } catch (e) {
      console.error("Error fetching checkin status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCheckinStatus();
    }
  }, [user]);

  const handleClaim = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Vui lòng đăng nhập để điểm danh nhận Xu." });
      return;
    }
    if (checkinData.hasCheckedInToday || submitting) return;

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch("/api/vouchers/checkin", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể hoàn thành điểm danh.");
      }

      setMessage({
        type: "success",
        text: `🎉 ${data.message}`,
      });

      // Update local state
      setCheckinData((prev) => ({
        ...prev,
        hasCheckedInToday: true,
        currentStreak: data.streak,
        nextStreak: (data.streak % 7) + 1,
        totalCheckins: prev.totalCheckins + 1,
      }));

      if (onRewardClaimed && typeof data.new_balance === "number") {
        onRewardClaimed(data.new_balance);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi xử lý điểm danh" });
    } finally {
      setSubmitting(false);
    }
  };

  const rewards = checkinData.rewards || [5, 5, 10, 10, 15, 15, 30];
  const activeDayIndex = checkinData.hasCheckedInToday
    ? checkinData.currentStreak - 1
    : checkinData.nextStreak - 1;

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-500/5 p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
                Điểm Danh 7 Ngày
              </h2>
              {checkinData.currentStreak > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-rose-500" />
                  Chuỗi {checkinData.currentStreak} ngày
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đăng nhập mỗi ngày nhận Xu miễn phí. Ngày thứ 7 mở Rương Thần Tài!
            </p>
          </div>
        </div>

        <button
          onClick={fetchCheckinStatus}
          disabled={loading}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Tải lại trạng thái"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 7-Day Rewards Ladder Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
        {rewards.map((reward, idx) => {
          const dayNumber = idx + 1;
          const isDay7 = dayNumber === 7;

          // Determine status
          let isClaimed = false;
          let isCurrent = false;

          if (checkinData.hasCheckedInToday) {
            isClaimed = dayNumber <= checkinData.currentStreak;
            isCurrent = dayNumber === checkinData.currentStreak;
          } else {
            isClaimed = dayNumber < checkinData.nextStreak;
            isCurrent = dayNumber === checkinData.nextStreak;
          }

          return (
            <div
              key={dayNumber}
              className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all ${
                isDay7 ? "col-span-2 sm:col-span-1" : ""
              } ${
                isClaimed
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : isCurrent && !checkinData.hasCheckedInToday
                  ? "bg-gradient-to-b from-amber-500/20 to-rose-500/10 border-2 border-amber-500 shadow-md shadow-amber-500/20 scale-[1.03] z-10"
                  : isDay7
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-500"
                  : "bg-muted/40 border border-border/50 text-muted-foreground"
              }`}
            >
              {/* Day Label */}
              <span className="text-[10px] font-black uppercase tracking-wider">
                Ngày {dayNumber}
              </span>

              {/* Icon / Coin badge */}
              <div className="my-1.5 flex items-center justify-center">
                {isClaimed ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isDay7 ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-md animate-bounce">
                    <Crown className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Reward Amount */}
              <span
                className={`text-xs font-black ${
                  isClaimed
                    ? "text-emerald-600 dark:text-emerald-400 line-through opacity-80"
                    : isCurrent
                    ? "text-amber-500 font-black text-sm"
                    : "text-foreground"
                }`}
              >
                +{reward} Xu
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Claim Button */}
      <div className="pt-2">
        {checkinData.hasCheckedInToday ? (
          <button
            disabled
            className="w-full py-3.5 px-4 rounded-2xl bg-muted border border-border/60 text-muted-foreground font-black text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Đã Điểm Danh Hôm Nay (Chuỗi {checkinData.currentStreak} Ngày) - Mai Quay Lại Nhé!</span>
          </button>
        ) : (
          <button
            onClick={handleClaim}
            disabled={submitting || loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 bg-size-200 hover:bg-pos-100 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {submitting
                ? "Đang xử lý..."
                : `Điểm Danh Ngay (+${checkinData.nextReward} Xu Ngày ${checkinData.nextStreak})`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
