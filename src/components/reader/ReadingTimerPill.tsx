"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, Gift, Sparkles, CheckCircle2, ChevronRight, X, Trophy } from "lucide-react";
import { recordMissionActivity, getVietnamDateStr } from "@/lib/missions";

interface ReadingTimerPillProps {
  storyId?: string;
  chapterId?: string;
}

export function ReadingTimerPill({ storyId, chapterId }: ReadingTimerPillProps) {
  const [seconds, setSeconds] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [isClaimed15, setIsClaimed15] = useState<boolean>(false);
  const [isClaimed30, setIsClaimed30] = useState<boolean>(false);

  const todayStr = getVietnamDateStr();
  const storageKeyDate = `dtv_read_date`;
  const storageKeySecs = `dtv_read_seconds`;
  const storageKeyClaim15 = `dtv_claimed_15_${todayStr}`;
  const storageKeyClaim30 = `dtv_claimed_30_${todayStr}`;

  // Initialize from storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reset daily reading timer if day changed
    const savedDate = localStorage.getItem(storageKeyDate);
    if (savedDate !== todayStr) {
      localStorage.setItem(storageKeyDate, todayStr);
      localStorage.setItem(storageKeySecs, "0");
      setSeconds(0);
    } else {
      const savedSecs = parseInt(localStorage.getItem(storageKeySecs) || "0", 10);
      setSeconds(isNaN(savedSecs) ? 0 : savedSecs);
    }

    setIsClaimed15(localStorage.getItem(storageKeyClaim15) === "true");
    setIsClaimed30(localStorage.getItem(storageKeyClaim30) === "true");
  }, [todayStr]);

  // Active reading timer (only runs when tab is active and visible)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      if (document.hidden) return;

      setSeconds((prev) => {
        const next = prev + 1;
        if (next % 5 === 0) {
          localStorage.setItem(storageKeySecs, String(next));
        }

        // Trigger Milestone 15 mins (900s)
        if (next >= 900 && !isClaimed15) {
          claimMilestone("read_time_15", 30, storageKeyClaim15, () => setIsClaimed15(true));
        }

        // Trigger Milestone 30 mins (1800s)
        if (next >= 1800 && !isClaimed30) {
          claimMilestone("read_time_30", 80, storageKeyClaim30, () => setIsClaimed30(true));
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isClaimed15, isClaimed30, storageKeyClaim15, storageKeyClaim30]);

  const claimMilestone = async (
    action: "read_time_15" | "read_time_30",
    points: number,
    key: string,
    onSuccess: () => void
  ) => {
    localStorage.setItem(key, "true");
    onSuccess();

    const res = await recordMissionActivity(action, { story_id: storyId, chapter_id: chapterId });
    if (res && res.success) {
      setRewardToast(`🎉 Tuyệt vời! Bạn nhận được +${points} Point nhờ chăm chỉ đọc truyện!`);
    } else if (res && res.already_completed) {
      // already claimed earlier today on another device
    }
    setTimeout(() => setRewardToast(null), 6000);
  };

  // Target determination
  const nextTargetSecs = seconds < 900 ? 900 : 1800;
  const currentProgress = Math.min(100, Math.floor((seconds / nextTargetSecs) * 100));
  const currentMins = Math.floor(seconds / 60);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Celebration Toast Modal */}
      {rewardToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in zoom-in duration-300 max-w-sm w-full px-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-2xl border border-white/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-xl shadow-inner animate-bounce">
              🎁
            </div>
            <div className="flex-1 text-xs">
              <p className="font-black text-sm">Mở Rương Độc Giả!</p>
              <p className="opacity-95 mt-0.5">{rewardToast}</p>
            </div>
            <button
              onClick={() => setRewardToast(null)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill on Reader */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-40 select-none">
        <div className="relative">
          {/* Main Floating Pill Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-card/95 hover:bg-card border border-amber-500/30 text-foreground shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="relative">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              {currentProgress >= 100 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
              )}
            </div>

            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                  {formatTimer(seconds)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  / {nextTargetSecs === 900 ? "15p" : "30p"}
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>

            <span className="text-xs group-hover:rotate-12 transition-transform">🎁</span>
          </button>

          {/* Expanded Popover */}
          {isOpen && (
            <div className="absolute bottom-12 right-0 w-72 p-4 rounded-2xl bg-card border border-border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-foreground">Tu Luyện & Rương Điểm</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Đọc truyện tích lũy thời gian mỗi ngày để nhận Point nâng cấp Cảnh Giới và Đề Cử truyện!
              </p>

              {/* Milestones list */}
              <div className="space-y-2.5 mt-3">
                {/* Milestone 1: 15 mins */}
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    isClaimed15
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : seconds >= 900
                      ? "bg-amber-500/10 border-amber-500/40"
                      : "bg-muted/30 border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>🎁 Mốc 15 phút</span>
                      {isClaimed15 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-amber-500 font-semibold font-mono">
                          ({Math.min(15, currentMins)}/15p)
                        </span>
                      )}
                    </span>
                    <span className="font-black text-amber-500">+30 Point</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (seconds / 900) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone 2: 30 mins */}
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    isClaimed30
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : seconds >= 1800
                      ? "bg-rose-500/10 border-rose-500/40"
                      : "bg-muted/30 border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>🔥 Mốc 30 phút</span>
                      {isClaimed30 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-rose-500 font-semibold font-mono">
                          ({Math.min(30, currentMins)}/30p)
                        </span>
                      )}
                    </span>
                    <span className="font-black text-rose-500">+80 Point</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (seconds / 1800) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                ⏱️ Đã đọc hôm nay: <strong className="text-foreground">{currentMins} phút</strong> (Tự reset 00:00)
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
