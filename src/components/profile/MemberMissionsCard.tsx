"use client";

import { useState } from "react";
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
} from "lucide-react";

export function MemberMissionsCard() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://doctruyen.vip";
    const shareData = {
      title: "DocTruyen.vip - Đọc truyện tranh & truyện chữ miễn phí",
      text: "Đọc truyện online bản đẹp, nghe audio AI cực đỉnh tại DocTruyen.vip!",
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to copy link
      }
    }

    // Fallback: Copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const missions = [
    {
      id: "checkin",
      title: "Điểm danh hàng ngày",
      description: "Đăng nhập mỗi ngày để tích lũy chuỗi và nhận thưởng",
      reward: "+5 ~ 30 Xu",
      actionLabel: "Nhận Ngay",
      icon: Gift,
      color: "text-amber-500 bg-amber-500/10",
      href: "#diem-danh",
    },
    {
      id: "read",
      title: "Đọc chương truyện mới",
      description: "Khám phá các bộ truyện hot hoặc truyện tranh cập nhật",
      reward: "+5 Xu",
      actionLabel: "Đọc Ngay",
      icon: BookOpen,
      color: "text-indigo-500 bg-indigo-500/10",
      href: "/kham-pha",
    },
    {
      id: "bookmark",
      title: "Lưu truyện vào tủ sách",
      description: "Thêm bộ truyện yêu thích để nhận thông báo chương mới",
      reward: "+5 Xu",
      actionLabel: "Tủ Sách",
      icon: Bookmark,
      color: "text-rose-500 bg-rose-500/10",
      href: "/tu-truyen",
    },
    {
      id: "share",
      title: "Chia sẻ với bạn bè",
      description: "Giới thiệu DocTruyen.vip tới cộng đồng đọc truyện",
      reward: "+10 Xu",
      actionLabel: copied ? "Đã Sao Chép!" : "Chia Sẻ",
      icon: copied ? Check : Share2,
      color: "text-emerald-500 bg-emerald-500/10",
      onClick: handleShare,
    },
  ];

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
              Nhiệm Vụ Thành Viên Tích Xu
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hoàn thành các hoạt động đọc truyện để nhận thêm nhiều Xu thưởng miễn phí.
            </p>
          </div>
        </div>
      </div>

      {/* Missions list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {missions.map((mission) => {
          const Icon = mission.icon;
          const content = (
            <div className="p-3.5 rounded-2xl border border-border/50 hover:border-indigo-500/40 bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mission.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {mission.title}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black">
                      {mission.reward}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {mission.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-xs font-black text-indigo-500 group-hover:translate-x-0.5 transition-transform">
                <span>{mission.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );

          if (mission.onClick) {
            return (
              <button
                key={mission.id}
                onClick={mission.onClick}
                className="text-left w-full cursor-pointer"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={mission.id} href={mission.href || "#"} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
