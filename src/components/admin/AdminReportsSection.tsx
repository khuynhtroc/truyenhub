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
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center justify-between shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lọc bình luận theo nội dung hoặc người gửi..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onRefreshComments()}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              onClick={onRefreshComments}
              className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black">
                <tr>
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
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
                      <span className="block mt-2 font-semibold">Đang tải bình luận...</span>
                    </td>
                  </tr>
                ) : comments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Chưa có bình luận nào cần kiểm duyệt.
                    </td>
                  </tr>
                ) : (
                  comments.map((cm) => (
                    <tr key={cm.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-medium text-foreground max-w-sm truncate">{cm.content}</td>
                      <td className="p-3.5 text-rose-500 font-bold">{cm.stories?.title || "Chung"}</td>
                      <td className="p-3.5 font-mono">{cm.likes_count || 0}</td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(cm.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteComment(cm.id)}
                          className="p-1.5 rounded-lg bg-muted hover:text-rose-500 cursor-pointer"
                          title="Xóa bình luận"
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
        </div>
      )}
    </div>
  );
}
