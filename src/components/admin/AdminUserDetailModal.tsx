"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Crown,
  Coins,
  QrCode,
  Calendar,
  Clock,
  BookOpen,
  CreditCard,
  MessageSquare,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Bookmark,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface AdminUserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onUpgradeVip: (user: any) => void;
  onAdjustCoins: (user: any) => void;
  onGenerateQr: (user: any) => void;
}

export function AdminUserDetailModal({
  userId,
  onClose,
  onUpgradeVip,
  onAdjustCoins,
  onGenerateQr,
}: AdminUserDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    profile: any;
    stats: any;
    transactions: any[];
    readingHistory: any[];
    comments: any[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "transactions" | "comments">("history");
  const [copiedId, setCopiedId] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/admin/users/${userId}/activity`)
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted) {
          if (resData.success) {
            setData(resData);
          } else {
            console.error(resData.error);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) return null;

  const copyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const p = data?.profile;
  const s = data?.stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-foreground">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {p?.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.display_name || "User"}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                (p?.display_name || p?.email || "U")[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-foreground">
                  {p?.display_name || "Chưa đặt tên"}
                </h2>
                {p?.vip_level ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> VIP {p.vip_level}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                    Độc giả thường
                  </span>
                )}
                {p?.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span className="font-mono">{p?.email}</span>
                <span className="text-border">•</span>
                <button
                  onClick={copyUserId}
                  className="inline-flex items-center gap-1 font-mono text-[11px] hover:text-foreground transition-colors cursor-pointer"
                  title="Sao chép User ID"
                >
                  ID: {userId.slice(0, 8)}...
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-semibold text-muted-foreground">
                Đang tải toàn bộ dữ liệu lịch sử và hoạt động của thành viên...
              </p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-muted-foreground">
              Không thể tải thông tin thành viên.
            </div>
          ) : (
            <>
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số Dư Xu</span>
                    <span className="text-lg font-black text-amber-500 font-mono">
                      {(p?.coins_balance || 0).toLocaleString()} xu
                    </span>
                  </div>
                  {p?.vip_until && (
                    <div className="border-l border-border/60 pl-4">
                      <span className="text-[11px] text-muted-foreground block">Hạn VIP</span>
                      <span className="text-xs font-bold text-foreground">
                        {new Date(p.vip_until).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpgradeVip(p)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" /> Nâng Cấp VIP
                  </button>
                  <button
                    onClick={() => onAdjustCoins(p)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" /> Chỉnh Xu
                  </button>
                  <button
                    onClick={() => onGenerateQr(p)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> VietQR Nạp
                  </button>
                </div>
              </div>

              {/* 4 Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-semibold">Tổng Nạp Tiền</span>
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-emerald-500 font-mono">
                    {(s?.totalDepositVnd || 0).toLocaleString()} đ
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {s?.totalTransactions || 0} lần giao dịch
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-semibold">Truyện Đã Đọc</span>
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-indigo-400 font-mono">
                    {s?.totalStoriesRead || 0} bộ
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Đã lưu tiến độ cloud
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-semibold">Tần Suất Đọc</span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-amber-500 font-mono">
                    {s?.readsPast7d || 0} lượt
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    7 ngày ({s?.readsPast30d || 0} lượt / 30 ngày)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-semibold">Ngày Tham Gia</span>
                    <Calendar className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-base sm:text-lg font-black text-purple-400 font-mono">
                    {s?.daysSinceJoined || 1} ngày
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate" title={new Date(p?.created_at).toLocaleDateString("vi-VN")}>
                    Từ: {new Date(p?.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Detail Navigation Tabs */}
              <div className="border-b border-border/60 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "history"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Lịch Sử Đọc ({data.readingHistory.length})
                </button>

                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "transactions"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Giao Dịch Xu ({data.transactions.length})
                </button>

                <button
                  onClick={() => setActiveTab("comments")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "comments"
                      ? "border-rose-500 text-rose-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Bình Luận ({data.comments.length})
                </button>
              </div>

              {/* Tab 1: Reading History */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  {data.readingHistory.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                      Thành viên này chưa đọc hoặc chưa lưu tiến độ truyện nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.readingHistory.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3 rounded-2xl bg-muted/20 border border-border/50 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="w-12 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                            {item.story?.cover_url ? (
                              <img
                                src={item.story.cover_url}
                                alt={item.story.title || "Story"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <BookOpen className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-foreground truncate">
                                {item.story?.title || "Truyện ID: " + item.story_id.slice(0, 8)}
                              </h4>
                              {item.is_bookmarked && (
                                <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              Đang đọc: {item.chapter?.title ? item.chapter.title : item.chapter?.chapter_number ? `Chương ${item.chapter.chapter_number}` : "Đang cập nhật"}
                            </p>

                            {/* Progress bar */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted/80 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(100, item.progress_percent || 0)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                                {item.progress_percent || 0}%
                              </span>
                            </div>

                            <span className="text-[10px] text-muted-foreground block mt-1">
                              Đọc lúc: {new Date(item.updated_at).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Transactions */}
              {activeTab === "transactions" && (
                <div className="space-y-3">
                  {data.transactions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                      Chưa có giao dịch xu hay nạp tiền nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                          <tr>
                            <th className="p-3">Mã GD</th>
                            <th className="p-3">Số Tiền (VND)</th>
                            <th className="p-3">Xu Nhận</th>
                            <th className="p-3">Trạng Thái</th>
                            <th className="p-3 text-right">Thời Gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {data.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/20">
                              <td className="p-3 font-mono font-bold text-foreground">
                                {tx.order_code || tx.id.slice(0, 12)}
                              </td>
                              <td className="p-3 font-mono font-semibold">
                                {tx.amount_vnd > 0 ? (
                                  <span className="text-emerald-500 font-bold">
                                    +{(tx.amount_vnd).toLocaleString()} đ
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0 đ (Thưởng)</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-black text-amber-500">
                                +{(tx.coins_added || 0).toLocaleString()} xu
                              </td>
                              <td className="p-3">
                                {tx.status === "completed" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Thành công
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                    {tx.status}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right text-muted-foreground font-mono text-[11px]">
                                {new Date(tx.created_at).toLocaleString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Comments */}
              {activeTab === "comments" && (
                <div className="space-y-3">
                  {data.comments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                      Thành viên này chưa để lại bình luận nào trên các bộ truyện.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.comments.map((cmt) => (
                        <div key={cmt.id} className="p-3.5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              Truyện: {cmt.stories?.title || "Truyện"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(cmt.created_at).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground italic">"{cmt.content}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            {p?.updated_at && `Cập nhật lần cuối: ${new Date(p.updated_at).toLocaleString("vi-VN")}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
