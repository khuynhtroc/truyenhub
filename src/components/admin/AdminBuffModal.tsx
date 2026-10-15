"use client";

import { useState } from "react";
import {
  X,
  Zap,
  TrendingUp,
  Heart,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface AdminBuffModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStory?: any | null; // If null, bulk mode
  selectedIds?: string[];
  onSuccess: (msg: string) => void;
}

export function AdminBuffModal({
  isOpen,
  onClose,
  targetStory,
  selectedIds = [],
  onSuccess,
}: AdminBuffModalProps) {
  const isSingle = !!targetStory;

  // Single mode state
  const [singleMode, setSingleMode] = useState<"add" | "set">("add");
  const [viewsToAdd, setViewsToAdd] = useState<number>(2500);
  const [likesToAdd, setLikesToAdd] = useState<number>(180);

  // Bulk mode state
  const [targetType, setTargetType] = useState<"selected" | "all" | "comic" | "novel" | "book">(
    selectedIds.length > 0 ? "selected" : "all"
  );
  const [minViews, setMinViews] = useState<number>(1000);
  const [maxViews, setMaxViews] = useState<number>(8000);
  const [minLikes, setMinLikes] = useState<number>(50);
  const [maxLikes, setMaxLikes] = useState<number>(600);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let payload: any = {};

      if (isSingle) {
        payload = {
          action: "single",
          story_id: targetStory.id,
          mode: singleMode,
          views: viewsToAdd,
          likes: likesToAdd,
        };
      } else {
        payload = {
          action: "bulk_random",
          target_type: targetType === "selected" ? "all" : targetType,
          story_ids: targetType === "selected" ? selectedIds : [],
          min_views: minViews,
          max_views: maxViews,
          min_likes: minLikes,
          max_likes: maxLikes,
        };
      }

      const res = await fetch("/api/admin/buff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Đã buff chỉ số tương tác ảo thành công!");
        onClose();
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi mạng hoặc máy chủ không phản hồi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-foreground">
                {isSingle ? `Tạo Lượt Xem & Thích Ảo (Seeding)` : `Buff Chỉ Số Ảo Hàng Loạt`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isSingle
                  ? `Đang áp dụng cho: ${targetStory.title}`
                  : `Tạo độ hot và kích thích độc giả cho hệ thống`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {isSingle ? (
            <>
              {/* Current Stats */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-around">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Lượt xem hiện tại
                  </span>
                  <span className="text-sm font-extrabold text-foreground font-mono">
                    {(targetStory.total_views || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-8 bg-border/60" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Lượt thích hiện tại
                  </span>
                  <span className="text-sm font-extrabold text-rose-500 font-mono">
                    {(targetStory.total_likes || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSingleMode("add")}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    singleMode === "add"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  + Cộng thêm vào số hiện có
                </button>
                <button
                  type="button"
                  onClick={() => setSingleMode("set")}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    singleMode === "set"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Đặt lại số tuyệt đối mới
                </button>
              </div>

              {/* Views Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    {singleMode === "add" ? "Số Lượt Xem Muốn Cộng Thêm" : "Tổng Lượt Xem Mới"}
                  </label>
                  <div className="flex items-center gap-1">
                    {[1000, 5000, 10000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setViewsToAdd(v)}
                        className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        +{v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={viewsToAdd}
                  onChange={(e) => setViewsToAdd(parseInt(e.target.value, 10) || 0)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Likes Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {singleMode === "add" ? "Số Lượt Thích Muốn Cộng Thêm" : "Tổng Lượt Thích Mới"}
                  </label>
                  <div className="flex items-center gap-1">
                    {[50, 200, 500].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLikesToAdd(l)}
                        className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                      >
                        +{l}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={likesToAdd}
                  onChange={(e) => setLikesToAdd(parseInt(e.target.value, 10) || 0)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* Bulk Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground">Đối Tượng Áp Dụng Buff</label>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs font-semibold focus:outline-none focus:border-rose-500"
                >
                  {selectedIds.length > 0 && (
                    <option value="selected">
                      Các bộ truyện đã tích chọn ({selectedIds.length} truyện)
                    </option>
                  )}
                  <option value="all">Toàn bộ kho truyện (Tất cả)</option>
                  <option value="comic">Chỉ Truyện Tranh (Manga/Webtoon)</option>
                  <option value="novel">Chỉ Truyện Chữ (Tiểu thuyết)</option>
                  <option value="book">Chỉ Danh mục Sách & Ebook</option>
                </select>
              </div>

              {/* Views Random Range */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-500" /> Khoảng Lượt Xem Ngẫu Nhiên (+Views)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Tối thiểu"
                    value={minViews}
                    onChange={(e) => setMinViews(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-muted-foreground font-bold">~</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Tối đa"
                    value={maxViews}
                    onChange={(e) => setMaxViews(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Likes Random Range */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-foreground flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Khoảng Lượt Thích Ngẫu Nhiên (+Likes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Tối thiểu"
                    value={minLikes}
                    onChange={(e) => setMinLikes(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-muted-foreground font-bold">~</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Tối đa"
                    value={maxLikes}
                    onChange={(e) => setMaxLikes(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Áp Dụng Buff Ngay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
