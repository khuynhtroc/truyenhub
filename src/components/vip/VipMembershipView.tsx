"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Award,
  Coins,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  ArrowRight,
  BookOpen,
  Headphones,
  Zap,
  Ticket,
  ChevronDown,
  Gift,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  VIP_TIERS,
  VIP_PACKAGES,
  VipPackage,
  VipTierInfo,
  isUserVipActive,
  getRemainingVipDays,
} from "@/lib/vip";
import { formatVND } from "@/lib/utils";

export function VipMembershipView() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Purchasing VIP state
  const [selectedPackage, setSelectedPackage] = useState<VipPackage>(VIP_PACKAGES[1]);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // VietQR modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Voucher redeem state
  const [voucherCode, setVoucherCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, coins_balance, vip_level, vip_until")
        .eq("id", userId)
        .single();
      if (data) {
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        fetchProfile(user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setCurrentUser(u);
      if (u) fetchProfile(u.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const isVip = isUserVipActive(profile?.vip_until);
  const userTier: VipTierInfo = isVip
    ? VIP_TIERS[profile?.vip_level || 1] || VIP_TIERS[1]
    : VIP_TIERS[0];
  const remainingDays = getRemainingVipDays(profile?.vip_until);

  // Handle Buy with Coins
  const handleSubscribeWithCoins = async (pkg: VipPackage) => {
    if (!currentUser) {
      window.location.href = `/tai-khoan?next=/vip`;
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);
    setPurchaseSuccess(null);

    try {
      const res = await fetch("/api/vip/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: pkg.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể đăng ký gói VIP");
      }

      setPurchaseSuccess(data.message);
      // Update local profile
      setProfile((prev: any) => ({
        ...prev,
        coins_balance: data.new_balance,
        vip_level: data.vip_level,
        vip_until: data.vip_until,
      }));
    } catch (err: any) {
      setPurchaseError(err.message || "Lỗi xử lý đăng ký");
    } finally {
      setPurchasing(false);
    }
  };

  // Handle Voucher / Give Away Code Redeem
  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      window.location.href = `/tai-khoan?next=/vip`;
      return;
    }

    if (!voucherCode.trim()) {
      setRedeemError("Vui lòng nhập mã code kích hoạt");
      return;
    }

    setRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mã kích hoạt không hợp lệ");
      }

      setRedeemSuccess(data.message);
      setVoucherCode("");
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
    } catch (err: any) {
      setRedeemError(err.message || "Lỗi xử lý đổi mã");
    } finally {
      setRedeeming(false);
    }
  };

  const transferCode = `VIP${profile?.id ? profile.id.substring(0, 6).toUpperCase() : "DOC"}`;
  const qrUrl = `https://api.vietqr.io/image/970432-10011918888-compact2.jpg?amount=${selectedPackage.priceVnd}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=mimiclothing`;

  const copyTransferCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(transferCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-b from-card via-card to-amber-500/5 p-6 sm:p-10 text-center shadow-lg">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-black shadow-xs">
            <Crown className="w-4 h-4" /> Hệ Thống Hội Viên DocTruyen.vip
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Nâng Cấp VIP - Đọc Truyện & Sách Không Giới Hạn
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Mở khóa toàn bộ truyện tranh màu sắc nét, tiểu thuyết hot nhất, kho sách eBook bản quyền và 15 giọng đọc AI diễn cảm cao cấp.
          </p>

          {/* Current VIP Status Card */}
          {currentUser && (
            <div className="mt-4 w-full p-4 rounded-2xl bg-card/80 border border-border/80 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${
                    isVip
                      ? "bg-gradient-to-tr from-amber-500 to-rose-500 ring-2 ring-amber-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isVip ? <Crown className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">
                      {profile?.display_name || currentUser.email}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${userTier.badgeClass}`}
                    >
                      {userTier.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isVip ? (
                      <span className="text-emerald-500 font-bold">
                        Đang hoạt động · Còn {remainingDays} ngày (Hết hạn:{" "}
                        {new Date(profile.vip_until).toLocaleDateString("vi-VN")})
                      </span>
                    ) : (
                      <span>Chưa kích hoạt VIP · Số dư: <b className="text-amber-500">{profile?.coins_balance || 0} Xu</b></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/nap-xu"
                  className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> Nạp Xu
                </Link>
                <a
                  href="#goi-vip"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs shadow-sm hover:opacity-95 transition-all"
                >
                  Gia Hạn VIP
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. INSTANT VOUCHER / GIVE AWAY CODE REDEEM */}
      <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-purple-500/10 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                Nhập Mã Give Away / Giftcode Kích Hoạt VIP
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhận được mã từ Fanpage, Zalo hoặc sự kiện cộng đồng? Nhập mã tại đây để nhận ngày VIP và Xu thưởng tức thì.
              </p>
            </div>
          </div>

          <form onSubmit={handleRedeemVoucher} className="w-full md:w-auto flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="VD: VIPDONG7NGAY..."
              className="h-10 px-4 rounded-xl bg-background border border-border/80 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase placeholder:normal-case min-w-[200px]"
            />
            <button
              type="submit"
              disabled={redeeming}
              className="h-10 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              {redeeming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Kích Hoạt Ngay</span>
            </button>
          </form>
        </div>

        {redeemSuccess && (
          <div className="mt-4 max-w-3xl mx-auto p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
        )}

        {redeemError && (
          <div className="mt-4 max-w-3xl mx-auto p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{redeemError}</span>
          </div>
        )}
      </div>

      {/* 3. 4-TIER COMPARISON GRID */}
      <div className="flex flex-col gap-4">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Bảng Phân Loại & Quyền Hạn Các Cấp VIP
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Mỗi cấp VIP sở hữu điều kiện thăng hạng và đặc quyền đọc truyện/sách chuyên biệt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {([1, 2, 3, 4] as const).map((lvl) => {
            const tier = VIP_TIERS[lvl];
            const isUserCurrentTier = isVip && profile?.vip_level === lvl;

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all bg-gradient-to-b ${tier.gradientClass} ${tier.borderClass} ${
                  isUserCurrentTier ? "ring-2 ring-amber-500/50 shadow-xl" : "shadow-sm hover:shadow-md"
                }`}
              >
                {isUserCurrentTier && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                    Cấp Hiện Tại Của Bạn
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${tier.badgeClass}`}>
                      {tier.badge}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">{tier.title}</span>
                  </div>

                  <h3 className={`text-lg font-black ${tier.textClass} mb-1`}>{tier.name}</h3>

                  <div className="p-3 rounded-2xl bg-background/80 border border-border/50 text-xs mb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">
                      Điều kiện đạt được:
                    </span>
                    <p className="font-semibold text-foreground text-[11px] leading-snug">
                      {tier.conditionDesc}
                    </p>
                  </div>

                  {/* Reading Rights */}
                  <div className="mb-4">
                    <span className="text-[11px] font-black uppercase text-foreground block mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-rose-500" /> Quyền hạn đọc truyện & Sách:
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {tier.readingRights.map((right, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{right}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Perks list */}
                  <div>
                    <span className="text-[11px] font-black uppercase text-foreground block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Đặc quyền bổ sung:
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {tier.perks.map((perk, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                  <a
                    href="#goi-vip"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      lvl === 2 || lvl === 3
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <span>Xem Gói {tier.badge}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. VIP PACKAGES PURCHASE (COINS & VIETQR) */}
      <div id="goi-vip" className="flex flex-col gap-6 pt-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold inline-block mb-1">
            Gói Hội Viên Tiết Kiệm
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Chọn Gói VIP Phù Hợp Với Bạn
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ thanh toán nhanh bằng Xu tích lũy hoặc chuyển khoản VietQR tự động kích hoạt
          </p>
        </div>

        {/* Feedback alerts */}
        {purchaseSuccess && (
          <div className="max-w-2xl mx-auto w-full p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{purchaseSuccess}</span>
            </div>
            <button onClick={() => setPurchaseSuccess(null)} className="p-1 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {purchaseError && (
          <div className="max-w-2xl mx-auto w-full p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{purchaseError}</span>
            </div>
            <button onClick={() => setPurchaseError(null)} className="p-1 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all bg-card ${
                  isSelected
                    ? "border-rose-500 ring-2 ring-rose-500/30 shadow-lg"
                    : "border-border/70 hover:border-border"
                }`}
              >
                {pkg.discountBadge && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                    {pkg.discountBadge}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase text-amber-500">
                      {pkg.tierName}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-foreground mb-1">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{pkg.description}</p>

                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/50 flex flex-col gap-1 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Giá bằng Xu:</span>
                      <span className="text-lg font-black text-amber-500 flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {pkg.priceCoins} Xu
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground">Chuyển khoản:</span>
                      <span className="text-xs font-bold text-foreground">{formatVND(pkg.priceVnd)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubscribeWithCoins(pkg)}
                    disabled={purchasing}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {purchasing && selectedPackage.id === pkg.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Coins className="w-3.5 h-3.5" />
                    )}
                    <span>Đăng Ký ({pkg.priceCoins} Xu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowQrModal(true);
                    }}
                    className="w-full py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-rose-500" />
                    <span>Quét VietQR ({formatVND(pkg.priceVnd)})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. VIETQR POPUP MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold mb-2">
              <QrCode className="w-3.5 h-3.5" /> Kích Hoạt VIP Tự Động 24/7
            </div>

            <h3 className="text-lg font-black text-foreground">
              Quét Mã Mở Gói {selectedPackage.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Mở app ngân hàng quét mã VietQR, hệ thống sẽ tự động kích hoạt VIP trong 3 giây.
            </p>

            <div className="p-3 bg-white rounded-2xl shadow-md border border-border/50 mb-4">
              <img src={qrUrl} alt="VietQR VIP" className="w-52 h-auto rounded-lg" />
            </div>

            <div className="w-full bg-muted/60 p-3.5 rounded-xl border border-border/50 text-xs flex flex-col gap-2 mb-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngân hàng nhận:</span>
                <b className="font-bold text-emerald-600 dark:text-emerald-400">VP Bank (VPBank)</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <b className="font-mono font-bold text-foreground">10011918888</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <b className="font-extrabold text-foreground uppercase">mimiclothing</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tiền:</span>
                <b className="font-black text-rose-500 text-sm">
                  {formatVND(selectedPackage.priceVnd)}
                </b>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <code className="bg-background px-2 py-0.5 rounded font-mono font-bold text-amber-500 border border-border">
                    {transferCode}
                  </code>
                  <button
                    onClick={copyTransferCode}
                    className="p-1 hover:bg-background rounded text-muted-foreground"
                    title="Sao chép"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {copiedCode && (
              <p className="text-xs text-emerald-500 font-bold mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã sao chép nội dung chuyển khoản!
              </p>
            )}

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* 6. FAQ SECTION */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 flex flex-col gap-4">
        <h3 className="font-black text-lg text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" /> Câu Hỏi Thường Gặp Về Hội Viên VIP
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/40">
            <b className="text-foreground block mb-1">Nếu tôi đang có VIP mà mua thêm gói thì sao?</b>
            <p className="text-muted-foreground">
              Thời gian sử dụng sẽ được cộng dồn tiếp tục vào ngày hết hạn hiện tại. Nếu bạn nâng lên cấp VIP cao hơn (ví dụ từ VIP 1 lên VIP 3), toàn bộ quyền hạn mới sẽ được kích hoạt ngay lập tức.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/40">
            <b className="text-foreground block mb-1">Làm sao để nhận mã Give Away VIP miễn phí?</b>
            <p className="text-muted-foreground">
              Ban quản trị DocTruyen.vip thường xuyên tổ chức minigame, đố vui và phát mã Give Away nâng cấp VIP trên Fanpage, Zalo và Telegram chính thức của website.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/40">
            <b className="text-foreground block mb-1">Tôi có thể đọc sách eBook và nghe Audio AI bằng VIP không?</b>
            <p className="text-muted-foreground">
              Từ VIP 2 (Bạc), bạn được mở khóa toàn bộ 15 giọng đọc AI Neural cao cấp. Từ VIP 3 (Vàng) trở lên, bạn được mở khóa toàn bộ kho Sách eBook bản quyền và Sách nói Premium không giới hạn.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/40">
            <b className="text-foreground block mb-1">Giao dịch nạp VIP có được hỗ trợ 24/7 không?</b>
            <p className="text-muted-foreground">
              Hệ thống quét mã VietQR và kiểm tra giao dịch hoàn toàn tự động trong 3 đến 5 giây. Nếu có bất kỳ trục trặc nào, hãy liên hệ ngay hỗ trợ trực tuyến qua trang Liên Hệ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
