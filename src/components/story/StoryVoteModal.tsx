"use client";

import { useState } from "react";
import { Trophy, Sparkles, X, Heart, Gift, Award, Zap, Coins, CheckCircle2 } from "lucide-react";
import { getUserRank } from "@/lib/ranks";

interface StoryVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  userBalance: number;
  onVoteSuccess: (newBalance: number, votesAdded: number) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

const VOTE_PACKAGES = [
  { points: 10, votes: 1, label: "Tặng Hoa", icon: "🌸", color: "from-pink-500 to-rose-500", desc: "Ủng hộ nhẹ nhàng" },
  { points: 50, votes: 5, label: "Tặng Rượu", icon: "🍶", color: "from-amber-500 to-orange-500", desc: "Cổ vũ nhiệt tình" },
  { points: 100, votes: 10, label: "Minh Chủ Buff", icon: "👑", color: "from-yellow-400 to-amber-600", desc: "Top Fan Vinh Danh", popular: true },
  { points: 500, votes: 50, label: "Bá Vương Xuất Kích", icon: "⚡", color: "from-purple-500 to-indigo-600", desc: "Đẩy truyện lên Top 1" },
];

export function StoryVoteModal({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  userBalance,
  onVoteSuccess,
  onOpenAuth,
  isLoggedIn,
}: StoryVoteModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[1]);
  const [cheerMessage, setCheerMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRank = getUserRank(userBalance);

  const handleVote = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    if (userBalance < selectedPackage.points) {
      setErrorMsg(`Số dư Point (${userBalance.toLocaleString()}) không đủ để đề cử gói ${selectedPackage.points} Point!`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/stories/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: storyId,
          points: selectedPackage.points,
          cheer_message: cheerMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể thực hiện đề cử");
      }

      setSuccessMsg(data.message || `Đã bỏ phiếu đề cử thành công!`);
      onVoteSuccess(data.new_balance, data.votes_added || 1);

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi đề cử");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-6 text-foreground">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
            🏆
          </div>
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-1.5">
              Bỏ Phiếu Đề Cử Truyện
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{storyTitle}</p>
          </div>
        </div>

        {/* User Balance & Rank Pill */}
        <div className="flex items-center justify-between p-3 mb-5 bg-muted/40 rounded-2xl border border-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentRank.badge}</span>
            <div>
              <div className="font-bold text-foreground">{currentRank.name}</div>
              <div className="text-[10px] text-muted-foreground">Cấp bậc độc giả</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-sm text-amber-500 flex items-center gap-1">
              <span>{userBalance.toLocaleString("vi-VN")}</span>
              <span className="text-xs">Point</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Số dư hiện tại</div>
          </div>
        </div>

        {/* Vote Packages Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {VOTE_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.points === pkg.points;
            return (
              <button
                key={pkg.points}
                type="button"
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/30"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                    Hot
                  </span>
                )}
                <div className="text-2xl mb-1.5">{pkg.icon}</div>
                <div className="font-bold text-sm text-foreground">{pkg.label}</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-black mt-0.5">
                  {pkg.points} Point <span className="text-muted-foreground font-normal">({pkg.votes} phiếu)</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{pkg.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Optional Praise Message */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Lời chúc / Bình luận vinh danh (Tùy chọn):
          </label>
          <input
            type="text"
            value={cheerMessage}
            onChange={(e) => setCheerMessage(e.target.value)}
            placeholder="Truyện siêu hay, chúc tác giả bùng nổ!"
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Status / Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleVote}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Đang gửi đề cử...</span>
          ) : !isLoggedIn ? (
            <span>Đăng Nhập Để Đề Cử Truyện</span>
          ) : (
            <>
              <span>Xác Nhận Đề Cử ({selectedPackage.points} Point)</span>
              <span>🚀</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Mỗi lượt đề cử giúp truyện thăng hạng trên Bảng Xếp Hạng Đề Cử Trang Chủ DocTruyen.VIP.
        </p>
      </div>
    </div>
  );
}
