"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Heart, Reply, ShieldAlert, Sparkles, User, Crown, RefreshCw } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";

interface CommentItem {
  id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  is_spoiler: boolean;
  likes_count: number;
  created_at: string;
}

interface CommentSectionProps {
  storyId: string;
  storyTitle: string;
  chapterNumber?: number;
}

export function CommentSection({ storyId, storyTitle, chapterNumber }: CommentSectionProps) {
  const [activeTab, setActiveTab] = useState<"internal" | "facebook">("internal");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const fetchStoryComments = async () => {
    if (!storyId) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?story_id=${storyId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchStoryComments();
  }, [storyId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);

      // Tải Facebook SDK nếu chọn tab Facebook
      if (activeTab === "facebook") {
        if (!document.getElementById("facebook-jssdk")) {
          const js = document.createElement("script");
          js.id = "facebook-jssdk";
          js.src = "https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v19.0";
          document.body.appendChild(js);
        } else if ((window as any).FB) {
          (window as any).FB.XFBML.parse();
        }
      }
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: storyId,
          content: newComment.trim(),
          is_spoiler: isSpoiler,
          user_name: userName.trim() || "Độc giả DocTruyen",
        }),
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments([data.comment, ...comments]);
        setNewComment("");
        setIsSpoiler(false);
      }
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedMap[commentId]) return;
    setLikedMap((prev) => ({ ...prev, [commentId]: true }));
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c))
    );

    try {
      await fetch("/api/comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "Vừa xong";
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} ngày trước`;
      return new Date(isoString).toLocaleDateString("vi-VN");
    } catch {
      return "Gần đây";
    }
  };

  return (
    <section className="w-full rounded-3xl bg-card border border-border/50 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
      {/* Header with Dual Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-rose-500" />
            Bình Luận & Thảo Luận
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {chapterNumber ? `Thảo luận cho Chương ${chapterNumber}` : `Thảo luận cho tác phẩm ${storyTitle}`}
          </p>
        </div>

        {/* Tab switchers: DocTruyen.vip vs Facebook */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("internal")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "internal"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tài Khoản ({comments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("facebook")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "facebook"
                ? "bg-[#1877F2] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook Plugin</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Internal DocTruyen.vip Comments */}
      {activeTab === "internal" && (
        <div className="flex flex-col gap-6">
          {/* Post Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Biệt danh của bạn (để trống nếu muốn ẩn danh)..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Chia sẻ cảm nghĩ của bạn về bộ truyện này..."
                rows={3}
                className="w-full p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Spoiler tag checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={isSpoiler}
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                  className="rounded border-border text-rose-500 focus:ring-rose-500"
                />
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Nội dung có tiết lộ cốt truyện (Spoil)</span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>{submitting ? "Đang gửi..." : "Gửi Bình Luận"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Comment List */}
          {loadingComments ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
              <span className="text-xs">Đang tải bình luận...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2 bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <MessageSquare className="w-8 h-8 opacity-40 text-rose-500" />
              <p className="text-xs font-semibold">Chưa có bình luận nào cho tác phẩm này.</p>
              <p className="text-[11px] text-muted-foreground">Hãy là người đầu tiên để lại cảm nghĩ của bạn!</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {comments.map((c) => (
                <div key={c.id} className="py-4 flex gap-3 sm:gap-4 items-start">
                  {/* User avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm">
                    {(c.user_name || "Đ")[0].toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-foreground">{c.user_name || "Độc giả"}</span>
                      <span className="text-[11px] text-muted-foreground">· {formatTime(c.created_at)}</span>
                    </div>

                    {/* Body text with spoiler protect */}
                    {c.is_spoiler ? (
                      <details className="text-xs sm:text-sm text-muted-foreground p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 my-1 cursor-pointer">
                        <summary className="font-bold text-amber-600 dark:text-amber-400 select-none">
                          ⚠️ Bình luận có chứa Spoil (Bấm để xem)
                        </summary>
                        <p className="mt-2 text-foreground">{c.content}</p>
                      </details>
                    ) : (
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                    )}

                    {/* Comment actions */}
                    <div className="flex items-center gap-4 mt-1 text-[11px] font-bold text-muted-foreground">
                      <button
                        onClick={() => handleLike(c.id)}
                        className={`flex items-center gap-1 transition-colors cursor-pointer ${
                          likedMap[c.id] ? "text-rose-500" : "hover:text-rose-500"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedMap[c.id] ? "fill-current text-rose-500" : ""}`} />
                        <span>{c.likes_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Facebook Comments Plugin */}
      {activeTab === "facebook" && (
        <div className="w-full flex flex-col items-center py-2">
          <div className="w-full bg-white dark:bg-white/95 p-4 rounded-2xl shadow-inner min-h-[350px]">
            <div id="fb-root" />
            <div
              className="fb-comments"
              data-href={currentUrl || "https://doctruyen.vip"}
              data-width="100%"
              data-numposts="10"
              data-colorscheme="light"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Bình luận Facebook được đồng bộ trực tiếp theo đường link của từng tác phẩm.
          </p>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </section>
  );
}
