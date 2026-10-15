"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Filter,
  Check,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";

interface AdminReportsSectionProps {
  comments: any[];
  loadingComments: boolean;
  commentSearch: string;
  setCommentSearch: (val: string) => void;
  onRefreshComments: () => void;
  onDeleteComment: (id: string) => void;
}

export function AdminReportsSection({
  comments,
  loadingComments,
  commentSearch,
  setCommentSearch,
  onRefreshComments,
  onDeleteComment,
}: AdminReportsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"reports" | "comments">("reports");

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams();
      if (reportStatusFilter !== "all") params.set("status", reportStatusFilter);
      if (reportSearch) params.set("q", reportSearch);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
        setPendingCount(data.pendingCount || 0);
        setResolvedCount(data.resolvedCount || 0);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportStatusFilter]);

  const handleUpdateReportStatus = async (id: string, newStatus: "pending" | "resolved" | "dismissed") => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Xóa bản ghi báo cáo này khỏi hệ thống?")) return;
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in">
      {/* Subtab Switcher */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "reports"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Báo Cáo Lỗi Từ Độc Giả</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black">
                {pendingCount} mới
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("comments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "comments"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bình Luận Của Độc Giả</span>
            <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
              {comments.length}
            </span>
          </button>
        </div>

        <button
          onClick={activeSubTab === "reports" ? fetchReports : onRefreshComments}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Làm mới danh sách"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: ERROR REPORTS */}
      {/* ============================================================== */}
      {activeSubTab === "reports" && (
        <div className="flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm theo tên truyện, chương hoặc nội dung lỗi..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchReports()}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-muted-foreground hidden md:inline">Trạng thái:</span>
              {[
                { id: "all", label: "Tất Cả" },
                { id: "pending", label: `Chờ Sửa (${pendingCount})` },
                { id: "resolved", label: `Đã Sửa (${resolvedCount})` },
                { id: "dismissed", label: "Bỏ Qua" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setReportStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    reportStatusFilter === st.id
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 font-bold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3.5">Bộ Truyện & Chương</th>
                  <th className="p-3.5">Phân Loại Lỗi</th>
                  <th className="p-3.5">Mô Tả Lỗi Từ Độc Giả</th>
                  <th className="p-3.5">Người Báo & Thời Gian</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Xử Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loadingReports ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                      <span className="block mt-2 font-semibold">Đang tải báo cáo lỗi...</span>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                      Tuyệt vời! Không có báo cáo lỗi nào đang chờ xử lý.
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr
                      key={rep.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        rep.status === "pending" ? "bg-amber-500/[0.03]" : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground">{rep.story_title}</span>
                          {rep.chapter_title && (
                            <span className="text-[11px] text-amber-500 font-semibold">
                              {rep.chapter_title}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            rep.type === "missing_images"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : rep.type === "duplicate_chapter"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : rep.type === "audio_error"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {rep.type_label || rep.type}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs sm:max-w-md">
                        <p className="text-foreground font-medium leading-relaxed">
                          {rep.content}
                        </p>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span className="font-semibold text-foreground">{rep.reporter || "Độc giả"}</span>
                          <span className="text-[10px] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(rep.created_at).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.status === "resolved"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : rep.status === "dismissed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {rep.status === "resolved"
                            ? "✓ Đã khắc phục"
                            : rep.status === "dismissed"
                            ? "Đã bỏ qua"
                            : "● Đang chờ sửa"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rep.status !== "resolved" && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, "resolved")}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Đánh dấu đã sửa xong"
                            >
                              <Check className="w-3 h-3" /> Đã Sửa
                            </button>
                          )}
                          {rep.status !== "dismissed" && rep.status !== "resolved" && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, "dismissed")}
                              className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-[10px] transition-colors cursor-pointer"
                              title="Bỏ qua báo cáo này"
                            >
                              Bỏ qua
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(rep.id)}
                            className="p-1.5 rounded-lg bg-muted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Xóa vĩnh viễn báo cáo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: READER COMMENTS */}
      {/* ============================================================== */}
      {activeSubTab === "comments" && (
        <AdminCommentsSubtab
          comments={comments}
          loadingComments={loadingComments}
          commentSearch={commentSearch}
          setCommentSearch={setCommentSearch}
          onRefreshComments={onRefreshComments}
          onDeleteComment={onDeleteComment}
        />
      )}
    </div>
  );
}

function AdminCommentsSubtab({
  comments,
  loadingComments,
  commentSearch,
  setCommentSearch,
  onRefreshComments,
  onDeleteComment,
}: {
  comments: any[];
  loadingComments: boolean;
  commentSearch: string;
  setCommentSearch: (val: string) => void;
  onRefreshComments: () => void;
  onDeleteComment: (id: string) => void;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [readerName, setReaderName] = useState("Độc giả VIP");
  const [commentContent, setCommentContent] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [likesCount, setLikesCount] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch stories for selection dropdown
    fetch("/api/admin/stories?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stories) {
          setStories(data.stories);
          if (data.stories.length > 0 && !selectedStoryId) {
            setSelectedStoryId(data.stories[0].id);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryId || !commentContent.trim()) {
      alert("Vui lòng chọn bộ truyện và nhập nội dung bình luận!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: selectedStoryId,
          user_name: readerName.trim() || "Độc giả VIP",
          content: commentContent.trim(),
          is_spoiler: isSpoiler,
          likes_count: likesCount,
          status: "approved",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setCommentContent("");
        onRefreshComments();
      } else {
        alert(data.error || "Lỗi tạo bình luận");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Lọc bình luận theo nội dung, người gửi hoặc tên truyện..."
            value={commentSearch}
            onChange={(e) => setCommentSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onRefreshComments()}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> + Thêm Bình Luận Cho Truyện
          </button>
          <button
            onClick={onRefreshComments}
            className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
            <tr>
              <th className="p-3.5">Người Bình Luận</th>
              <th className="p-3.5">Nội Dung Bình Luận</th>
              <th className="p-3.5">Bộ Truyện</th>
              <th className="p-3.5">Lượt Thích</th>
              <th className="p-3.5">Thời Gian</th>
              <th className="p-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loadingComments ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                  <span className="block mt-2 font-semibold">Đang tải bình luận...</span>
                </td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-2" />
                  Chưa có bình luận nào trên hệ thống. Bạn có thể nhấn <strong>"+ Thêm Bình Luận Cho Truyện"</strong> ở trên để tạo bình luận mồi cho các bộ truyện.
                </td>
              </tr>
            ) : (
              comments.map((cm) => (
                <tr key={cm.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {(cm.user_name || "Đ")[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground">{cm.user_name || "Độc giả"}</span>
                    </div>
                  </td>
                  <td className="p-3.5 max-w-xs sm:max-w-md">
                    <p className="font-medium text-foreground leading-relaxed">
                      {cm.content}
                    </p>
                    {cm.is_spoiler && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-bold">
                        ⚠️ Có Spoil
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {cm.stories ? (
                      <Link
                        href={`/truyen/${cm.stories.slug}`}
                        target="_blank"
                        className="text-rose-500 font-bold hover:underline flex items-center gap-1"
                      >
                        {cm.stories.title} <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Chung</span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-muted-foreground">
                    ❤️ {cm.likes_count || 0}
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {new Date(cm.created_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDeleteComment(cm.id)}
                      className="p-1.5 rounded-lg bg-muted hover:text-rose-500 cursor-pointer transition-colors"
                      title="Xóa bình luận này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM BÌNH LUẬN CHO TRUYỆN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Thêm Bình Luận Cho Bộ Truyện
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComment} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Chọn Bộ Truyện Cần Bình Luận
                </label>
                <select
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-semibold focus:outline-none focus:border-rose-500"
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.type === "comic" ? "Truyện Tranh" : "Truyện Chữ"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Tên Người Bình Luận / Cấp VIP
                </label>
                <input
                  type="text"
                  value={readerName}
                  onChange={(e) => setReaderName(e.target.value)}
                  placeholder="Ví dụ: Trần Thế (VIP 12), Lâm Phong..."
                  className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Nội Dung Bình Luận
                </label>
                <textarea
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Nhập nội dung chia sẻ, đánh giá hoặc khen ngợi bộ truyện..."
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="rounded border-border text-rose-500"
                  />
                  <span>Chứa nội dung Spoil</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground font-bold">Số Tim:</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={likesCount}
                    onChange={(e) => setLikesCount(parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2 py-1 rounded-lg bg-muted/50 border border-border/60 text-xs text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu Bình Luận"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
