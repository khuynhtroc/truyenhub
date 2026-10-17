"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Coins,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  Power,
  Calendar,
  Sparkles,
  Search,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import { Voucher, VoucherRedemption } from "@/types";

export function AdminVouchersSection() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal create/edit state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCoins, setFormCoins] = useState(50);
  const [formMaxUses, setFormMaxUses] = useState(100);
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchVouchersData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      if (res.ok && data.success) {
        setVouchers(data.vouchers || []);
        setRedemptions(data.redemptions || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Error loading admin vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchersData();
  }, []);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: voucher.id,
          is_active: !voucher.is_active,
        }),
      });
      if (res.ok) {
        setVouchers((prev) =>
          prev.map((v) => (v.id === voucher.id ? { ...v, is_active: !v.is_active } : v))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã voucher "${code}" không?`)) return;

    try {
      const res = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!formCode.trim()) {
      setModalError("Vui lòng nhập mã code");
      return;
    }
    if (!formTitle.trim()) {
      setModalError("Vui lòng nhập tiêu đề");
      return;
    }
    if (formCoins <= 0) {
      setModalError("Số xu thưởng phải lớn hơn 0");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.trim().toUpperCase(),
          title: formTitle.trim(),
          reward_coins: Number(formCoins),
          max_uses: Number(formMaxUses),
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
          is_active: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi tạo voucher");
      }

      setShowModal(false);
      // Reset form
      setFormCode("");
      setFormTitle("");
      setFormCoins(50);
      setFormMaxUses(100);
      setFormExpiresAt("");
      setFormIsActive(true);

      // Reload
      fetchVouchersData();
    } catch (err: any) {
      setModalError(err.message || "Lỗi tạo voucher");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Bar with Title & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6 text-rose-500" />
            <span>Quản Lý Voucher & Điểm Thưởng Thành Viên</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tạo giftcode tặng Xu, theo dõi điểm danh hàng ngày và lịch sử đổi thưởng của độc giả.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchVouchersData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Voucher Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Tổng Voucher</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats?.totalVouchers ?? vouchers.length}
          </div>
          <span className="text-[11px] text-emerald-500 font-bold">
            {stats?.activeVouchers ?? vouchers.filter((v) => v.is_active).length} đang kích hoạt
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Lượt Đổi Mã</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats?.totalRedemptions ?? redemptions.length}
          </div>
          <span className="text-[11px] text-muted-foreground">Lượt thành viên nhập code</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Lượt Điểm Danh</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats?.totalCheckins ?? 0}
          </div>
          <span className="text-[11px] text-amber-500 font-bold">Tích lũy chuỗi 7 ngày</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Tổng Xu Đã Tặng</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">
            {Number(stats?.totalCoinsAwarded || 0).toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-bold text-foreground">Xu</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Voucher + Điểm danh</span>
        </div>
      </div>

      {/* Vouchers Table Card */}
      <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm sm:text-base text-foreground">
              Danh Sách Mã Voucher ({filteredVouchers.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã hoặc tiêu đề..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border/60 focus:border-rose-500 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mã Code</th>
                <th className="py-3 px-4">Tiêu Đề / Mục Đích</th>
                <th className="py-3 px-4 text-center">Thưởng (Xu)</th>
                <th className="py-3 px-4 text-center">Đã Dùng / Tối Đa</th>
                <th className="py-3 px-4 text-center">Hạn Dùng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs font-semibold">
                    Không tìm thấy voucher nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => {
                  const isExpired = voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now();
                  const isMaxedOut = voucher.max_uses > 0 && voucher.used_count >= voucher.max_uses;

                  return (
                    <tr key={voucher.id} className="hover:bg-muted/20 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 text-xs tracking-wider">
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(voucher.code)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Sao chép mã"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-bold text-foreground max-w-xs truncate">
                        {voucher.title}
                      </td>

                      {/* Reward Coins */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          +{voucher.reward_coins} Xu
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold ${isMaxedOut ? "text-rose-500" : "text-muted-foreground"}`}>
                          {voucher.used_count || 0} / {voucher.max_uses > 0 ? voucher.max_uses : "∞"}
                        </span>
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 px-4 text-center text-muted-foreground">
                        {voucher.expires_at ? (
                          <span className={isExpired ? "text-rose-500 font-bold" : ""}>
                            {new Date(voucher.expires_at).toLocaleDateString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold">Vĩnh viễn</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(voucher)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                            voucher.is_active && !isExpired && !isMaxedOut
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80"
                          }`}
                        >
                          {voucher.is_active && !isExpired && !isMaxedOut ? "Hoạt Động" : "Tạm Dừng"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteVoucher(voucher.id, voucher.code)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Redemptions Table */}
      <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border/60">
          <h3 className="font-black text-sm sm:text-base text-foreground">
            Lịch Sử Đổi Mã Gần Đây ({redemptions.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            50 lượt đổi mã mới nhất của thành viên trên hệ thống.
          </p>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-muted/60 backdrop-blur border-b border-border/40">
              <tr className="text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mã Code</th>
                <th className="py-3 px-4">Người Dùng (Email / ID)</th>
                <th className="py-3 px-4 text-center">Xu Nhận</th>
                <th className="py-3 px-4 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground text-xs font-semibold">
                    Chưa có lượt đổi mã nào.
                  </td>
                </tr>
              ) : (
                redemptions.map((red) => (
                  <tr key={red.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-500">
                      {red.voucher_code}
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {red.user_email || red.user_id.substring(0, 12) + "..."}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-amber-500">
                      +{red.reward_coins} Xu
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {new Date(red.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tạo Voucher Mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border/60 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-500" />
                <span>Tạo Mã Voucher / Giftcode Mới</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Mã Code (Tự động in hoa)</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="VD: VIP2026, TANTHU50"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 focus:border-rose-500 font-mono font-bold uppercase focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tiêu Đề / Mô Tả</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Quà Tặng Cuối Tuần Tri Ân Độc Giả"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 focus:border-rose-500 font-medium focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Số Xu Thưởng</label>
                  <input
                    type="number"
                    min="1"
                    value={formCoins}
                    onChange={(e) => setFormCoins(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 focus:border-rose-500 font-bold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Giới Hạn Lượt Dùng</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 focus:border-rose-500 font-bold focus:outline-none"
                    placeholder="VD: 500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Hạn Sử Dụng (Để trống nếu Vĩnh viễn)
                </label>
                <input
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60 focus:border-rose-500 font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-foreground cursor-pointer">
                  Kích hoạt mã ngay sau khi tạo
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "Đang tạo..." : "Xác Nhận Tạo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
