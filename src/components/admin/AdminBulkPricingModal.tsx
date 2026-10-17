"use client";

import { useState } from "react";
import {
  X,
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Info,
  Check,
} from "lucide-react";

interface AdminBulkPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStory?: any | null; // If set, editing this single story
  selectedIds?: string[];
  onSuccess: (msg: string) => void;
}

export function AdminBulkPricingModal({
  isOpen,
  onClose,
  targetStory,
  selectedIds = [],
  onSuccess,
}: AdminBulkPricingModalProps) {
  const isSingle = !!targetStory;

  // Scope: selected | comic | novel | book | all
  const [scope, setScope] = useState<"selected" | "comic" | "novel" | "book" | "all">(
    selectedIds.length > 0 ? "selected" : "comic"
  );

  // Pricing mode: lock_after_n | free_all | lock_all | update_price
  const [mode, setMode] = useState<"lock_after_n" | "free_all" | "lock_all" | "update_price">("lock_after_n");

  // Threshold & Price
  const [freeThreshold, setFreeThreshold] = useState<number>(3);
  const [priceCoins, setPriceCoins] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const payload: any = {
        action: "pricing",
        mode,
        free_threshold: freeThreshold,
        price_coins: priceCoins,
      };

      if (isSingle) {
        payload.story_ids = [targetStory.id];
      } else {
        if (scope === "selected") {
          if (selectedIds.length === 0) {
            setErrorMsg("Chưa có bộ truyện nào được chọn trong danh sách");
            setLoading(false);
            return;
          }
          payload.story_ids = selectedIds;
        } else {
          payload.target_type = scope; // "comic" | "novel" | "book" | "all"
        }
      }

      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.message || "Cập nhật giá và khóa VIP hàng loạt thành công!");
        onClose();
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi thực hiện cập nhật");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi mạng hoặc máy chủ không phản hồi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                {isSingle ? "Cài Đặt Xu & Khóa VIP Bộ Truyện" : "Quản Lý Miễn Phí & Xu Hàng Loạt"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isSingle
                  ? `Áp dụng cho: ${targetStory.title}`
                  : "Điều chỉnh điều kiện đọc miễn phí / trả phí bằng Xu cho nhiều bộ truyện"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scope Selector (Only in Bulk mode) */}
          {!isSingle && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                Phạm vi áp dụng
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScope("selected")}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      scope === "selected"
                        ? "bg-rose-500/10 border-rose-500 text-rose-500"
                        : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Đã chọn ({selectedIds.length})</span>
                      {scope === "selected" && <Check className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScope("comic")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    scope === "comic"
                      ? "bg-amber-500/10 border-amber-500 text-amber-500"
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Tất cả Truyện Tranh</span>
                    {scope === "comic" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("novel")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    scope === "novel"
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Tất cả Truyện Chữ</span>
                    {scope === "novel" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("book")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    scope === "book"
                      ? "bg-teal-500/10 border-teal-500 text-teal-400"
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Tất cả Sách</span>
                    {scope === "book" && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    scope === "all"
                      ? "bg-rose-500/10 border-rose-500 text-rose-500"
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Toàn bộ hệ thống</span>
                    {scope === "all" && <Check className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Pricing Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Quy tắc phân loại Miễn Phí / Thu Phí (Xu)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Lock after N */}
              <div
                onClick={() => setMode("lock_after_n")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "lock_after_n"
                    ? "bg-amber-500/10 border-amber-500/60 shadow-sm"
                    : "bg-card border-border/60 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "lock_after_n"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-extrabold text-foreground">
                      Miễn phí N chương đầu, Khóa VIP từ chương sau
                    </span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cho đọc thử miễn phí các chương đầu để giữ chân độc giả. Các chương tiếp theo tự động khóa VIP và yêu cầu Xu để mở.
                  </p>

                  {mode === "lock_after_n" && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-1">
                          Số chương đọc miễn phí:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 3, 5, 10].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setFreeThreshold(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                freeThreshold === val
                                  ? "bg-amber-500 text-white"
                                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={freeThreshold}
                            onChange={(e) => setFreeThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-1">
                          Giá Xu mỗi chương khóa:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[5, 10, 15, 20].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setPriceCoins(val)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                priceCoins === val
                                  ? "bg-rose-500 text-white"
                                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={priceCoins}
                            onChange={(e) => setPriceCoins(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center font-bold focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 2: Free all */}
              <div
                onClick={() => setMode("free_all")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "free_all"
                    ? "bg-emerald-500/10 border-emerald-500/60 shadow-sm"
                    : "bg-card border-border/60 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "free_all"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-extrabold text-foreground">
                      Miễn Phí Toàn Bộ (100% Free)
                    </span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500">
                      0 Xu
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mở khóa tự do tất cả các chương. Độc giả không cần xu và không bị rào cản khi đọc.
                  </p>
                </div>
              </div>

              {/* Option 3: Lock all */}
              <div
                onClick={() => setMode("lock_all")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "lock_all"
                    ? "bg-rose-500/10 border-rose-500/60 shadow-sm"
                    : "bg-card border-border/60 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "lock_all"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-extrabold text-foreground">
                      Khóa VIP Toàn Bộ Các Chương
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tất cả các chương từ chương 1 đều yêu cầu Xu để mở khóa. Phù hợp cho truyện bản quyền VIP cao cấp.
                  </p>

                  {mode === "lock_all" && (
                    <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center gap-3">
                      <label className="text-[11px] font-bold text-foreground">Giá Xu mỗi chương:</label>
                      <div className="flex items-center gap-1.5">
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setPriceCoins(val)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              priceCoins === val
                                ? "bg-rose-500 text-white"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={priceCoins}
                          onChange={(e) => setPriceCoins(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center font-bold focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 4: Update price only */}
              <div
                onClick={() => setMode("update_price")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "update_price"
                    ? "bg-indigo-500/10 border-indigo-500/60 shadow-sm"
                    : "bg-card border-border/60 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "update_price"
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-extrabold text-foreground">
                      Chỉ Cập Nhật Giá Xu Các Chương VIP
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Giữ nguyên trạng thái Khóa / Mở của từng chương, chỉ thay đổi giá Xu cho các chương đang bị khóa.
                  </p>

                  {mode === "update_price" && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center gap-3">
                      <label className="text-[11px] font-bold text-foreground">Giá Xu mới:</label>
                      <div className="flex items-center gap-1.5">
                        {[5, 10, 15, 20].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setPriceCoins(val)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              priceCoins === val
                                ? "bg-indigo-600 text-white"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={priceCoins}
                          onChange={(e) => setPriceCoins(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Summary Callout */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Tóm tắt hành động: </span>
              {mode === "free_all" && "Tất cả các chương sẽ được mở MIỄN PHÍ hoàn toàn (0 Xu)."}
              {mode === "lock_all" && `Tất cả các chương từ chương 1 sẽ bị KHÓA VIP với giá ${priceCoins} Xu/chương.`}
              {mode === "lock_after_n" && (
                <>
                  Chương 1 đến chương {freeThreshold} sẽ được <b className="text-emerald-500">Miễn phí (Free)</b>. Từ chương{" "}
                  {freeThreshold + 1} trở đi sẽ được <b className="text-amber-500">Khóa VIP</b> với giá{" "}
                  <b className="text-rose-500">{priceCoins} Xu/chương</b>.
                </>
              )}
              {mode === "update_price" && `Giữ nguyên cấu hình khóa, cập nhật giá xu các chương VIP thành ${priceCoins} Xu.`}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang xử lý hàng loạt...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác Nhận Áp Dụng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
