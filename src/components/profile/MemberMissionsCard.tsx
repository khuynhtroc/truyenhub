"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Gift,
  BookOpen,
  Bookmark,
  Share2,
  Coins,
  Check,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Heart,
  ThumbsUp,
  RefreshCw,
  CheckCircle2,
  Flame,
  Award,
} from "lucide-react";

interface MissionItem {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  daily_limit: number;
  unit: string;
  actionLabel: string;
  iconName: string;
  badge: string;
  href?: string;
  completed_count: number;
  coins_earned_today: number;
  is_completed: boolean;
}

interface MemberMissionsCardProps {
  user?: any;
  onBalanceUpdate?: (newBalance: number) => void;
}

const ICON_MAP: Record<string, any> = {
  Share2,
  MessageSquare,
  Heart,
  ThumbsUp,
  BookOpen,
  Bookmark,
  Gift,
};

export function MemberMissionsCard({ user, onBalanceUpdate }: MemberMissionsCardProps) {
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [totalEarnedToday, setTotalEarnedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/missions");
      const data = await res.json();
      if (res.ok && data.missions) {
        setMissions(data.missions);
        setTotalEarnedToday(data.total_coins_earned_today || 0);
      }
    } catch (e) {
      console.error("Error fetching missions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [user]);

  // Handle Share to Earn 100 Coins immediately
  const handleShareToEarn = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Vui lòng đăng nhập để nhận 100 Xu khi chia sẻ." });
      return;
    }

    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://doctruyen.vip";
    const shareData = {
      title: "DocTruyen.vip - Đọc truyện tranh & truyện chữ miễn phí",
      text: "Đọc truyện tranh Manga/Webtoon full HD và tiểu thuyết hay, nghe audio AI cực đỉnh tại DocTruyen.vip!",
      url: shareUrl,
    };

    try {
      setSharing(true);
      setMessage(null);

      // Trigger Web Share API if supported
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (_) {
          // Fallback to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
          }
        }
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }

      // Call mission API to award 100 coins immediately
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share", metadata: { url: shareUrl } }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `🎉 Tuyệt vời! Bạn đã nhận ngay +100 Xu vào tài khoản khi chia sẻ với bạn bè!`,
        });
        if (onBalanceUpdate && typeof data.new_balance === "number") {
          onBalanceUpdate(data.new_balance);
        }
        fetchMissions();
      } else {
        setMessage({
          type: "success",
          text: data.message || "Đã sao chép liên kết chia sẻ!",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi xử lý chia sẻ." });
    } finally {
      setSharing(false);
    }
  };

  const shareMission = missions.find((m) => m.id === "share");
  const otherMissions = missions.filter((m) => m.id !== "share");

  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-card via-card to-indigo-500/5 p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
                Nhiệm Vụ Thành Viên Tích Xu
              </h2>
              {totalEarnedToday > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase flex items-center gap-1">
                  <Coins className="w-3 h-3 fill-amber-500" />
                  +{totalEarnedToday} Xu hôm nay
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tương tác với website (thả tim, bình luận, đọc truyện) và chia sẻ để nhận Xu đọc truyện VIP miễn phí mỗi ngày.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMissions}
          disabled={loading}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Làm mới nhiệm vụ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-500" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}

      {/* SPECIAL SPOTLIGHT MISSION: Chia sẻ nhận 100 Xu luôn */}
      <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md relative overflow-hidden group">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform">
            <Share2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-foreground">
                Chia Sẻ Với Bạn Bè
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black uppercase shadow-xs">
                +100 Xu Luôn
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Giới thiệu DocTruyen.vip cho bạn bè qua Facebook, Zalo, Telegram để nhận ngay 100 Xu lập tức!
            </p>
          </div>
        </div>

        <button
          onClick={handleShareToEarn}
          disabled={sharing || (shareMission?.is_completed && Boolean(user))}
          className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 ${
            shareMission?.is_completed
              ? "bg-emerald-500 text-white shadow-emerald-500/20 cursor-default"
              : "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white shadow-rose-500/25"
          }`}
        >
          {sharing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : shareMission?.is_completed ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Coins className="w-4 h-4 fill-white" />
          )}
          <span>
            {shareMission?.is_completed
              ? "Đã Nhận 100 Xu Hôm Nay"
              : sharing
              ? "Đang xử lý..."
              : "Chia Sẻ Nhận 100 Xu Ngay"}
          </span>
        </button>
      </div>

      {/* Grid of Other Interaction Missions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* Daily Checkin Quick Card */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-card hover:bg-muted/40 transition-all flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-foreground block">
                  Điểm danh hàng ngày
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Đăng nhập nhận Xu chuỗi 7 ngày
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black shrink-0">
              +5 ~ 30 Xu
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground font-semibold">1 lần / ngày</span>
            <a
              href="#diem-danh"
              className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-0.5"
            >
              Điểm Danh <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Dynamic Interaction Missions */}
        {otherMissions.map((mission) => {
          const Icon = ICON_MAP[mission.iconName] || Target;
          const progressPercent = Math.min(
            100,
            Math.round((mission.completed_count / mission.daily_limit) * 100)
          );

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                mission.is_completed
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border/60 hover:border-indigo-500/40 bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      mission.is_completed
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-indigo-500/15 text-indigo-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs sm:text-sm text-foreground block">
                      {mission.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {mission.description}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                    mission.is_completed
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {mission.badge}
                </span>
              </div>

              {/* Progress Bar & CTA */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">
                    Tiến độ: {mission.completed_count}/{mission.daily_limit} {mission.unit}
                  </span>
                  <span
                    className={
                      mission.is_completed ? "text-emerald-500 font-black" : "text-amber-500"
                    }
                  >
                    +{mission.coins_earned_today} Xu
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      mission.is_completed
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-amber-500 to-indigo-600"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  {mission.is_completed ? (
                    <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã Hoàn Thành
                    </span>
                  ) : mission.href ? (
                    <Link
                      href={mission.href}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-0.5"
                    >
                      {mission.actionLabel} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
