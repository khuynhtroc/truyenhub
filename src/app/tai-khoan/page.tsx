"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Coins,
  Crown,
  Shield,
  History,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Ticket,
  Gift,
  CreditCard,
  TrendingUp,
  Clock,
  BookMarked,
  Bell,
  HelpCircle,
  Send,
  X,
  Phone,
  MessageSquare,
  Loader2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { DailyCheckinCard } from "@/components/profile/DailyCheckinCard";
import { VoucherRedeemCard } from "@/components/profile/VoucherRedeemCard";
import { MemberMissionsCard } from "@/components/profile/MemberMissionsCard";
import { DepositHistoryCard, CoinTransaction } from "@/components/profile/DepositHistoryCard";
import { UserStatsOverview, UserStats } from "@/components/profile/UserStatsOverview";
import { isUserVipActive, VIP_TIERS, getRemainingVipDays } from "@/lib/vip";
import { formatVND } from "@/lib/utils";

type ProfileTab = "overview" | "transactions" | "missions" | "bookshelf";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats & Transactions
  const [stats, setStats] = useState<UserStats>({
    totalRechargedVnd: 0,
    totalCoinsEarned: 0,
    totalRechargeTxCount: 0,
    pendingTxCount: 0,
    readingCount: 0,
    bookmarkCount: 0,
    coinsBalance: 0,
    vipLevel: 0,
    vipUntil: null,
  });
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Support Modal to Telegram
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);

  // Auth form states when not logged in
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    // 1. Check initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserProfileAndStats(user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfileAndStats(currentUser.id);
      } else {
        setProfile(null);
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfileAndStats = async (userId: string) => {
    setIsStatsLoading(true);
    try {
      // Gọi API profile-stats để lấy đồng bộ profile, thống kê và toàn bộ lịch sử giao dịch
      const res = await fetch(`/api/user/profile-stats?user_id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setStats(data.stats);
        setTransactions(data.transactions || []);
      } else {
        // Fallback fetch từ Supabase trực tiếp
        const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (p) setProfile(p);
      }
    } catch (e) {
      console.error("Lỗi tải thông tin user:", e);
    } finally {
      setLoading(false);
      setIsStatsLoading(false);
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setProfile((prev: any) => ({
      ...prev,
      coins_balance: newBalance,
      coins: newBalance,
    }));
    setStats((prev) => ({
      ...prev,
      coinsBalance: newBalance,
    }));
    if (user?.id) {
      fetchUserProfileAndStats(user.id);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setErrorMessage("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/tai-khoan`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối với tài khoản Google.");
      setAuthLoading(false);
    }
  };

  // Facebook OAuth Login
  const handleFacebookLogin = async () => {
    try {
      setAuthLoading(true);
      setErrorMessage("");
      const { loginWithFacebook } = await import("@/lib/auth/facebookLogin");
      await loginWithFacebook("/tai-khoan");
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối với tài khoản Facebook.");
      setAuthLoading(false);
    }
  };

  // Email / Password Login or Register
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (authMode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSuccessMessage("Đăng ký thành công! Bạn nhận được 10 Xu tân thủ.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage("Đăng nhập thành công!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Xác thực thất bại, vui lòng kiểm tra lại thông tin.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setTransactions([]);
    }
  };

  // Submit Support to Telegram bot truyenvip
  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setIsSubmittingSupport(true);
    setSupportError(null);

    try {
      const res = await fetch("/api/payment/contact-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          userName: profile?.display_name || user?.user_metadata?.full_name || "Thành viên",
          userPhone: supportPhone.trim(),
          message: supportMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gửi phản ánh thất bại, vui lòng thử lại.");
      }

      setSupportSuccess(
        "✓ Tin nhắn đã được chuyển tiếp đến bot Telegram của Admin! Admin sẽ kiểm tra và giải quyết ngay cho bạn."
      );
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportMessage("");
        setSupportSuccess(null);
      }, 3000);
    } catch (err: any) {
      setSupportError(err.message || "Có lỗi xảy ra khi gửi tin nhắn.");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-6 sm:py-8 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* TOP HERO BANNER (STYLE KHÔNG GIAN CÁ NHÂN GIỐNG YEUTRUYEN) */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-muted/30 to-rose-500/5 p-6 sm:p-8 flex flex-col gap-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Không Gian Cá Nhân
            </span>
            {user && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Cloud Sync
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Tài Khoản ĐọcTruyện.VIP
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            {user
              ? "Quản lý tủ truyện theo dõi, lịch sử đọc dở, ví xu nạp tiền và các ưu đãi thành viên VIP độc quyền."
              : "Đăng nhập để đồng bộ tủ truyện, lịch sử đọc, ví xu và nhận thông báo chương mới."}
          </p>

          {!user && !loading && (
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 cursor-pointer"
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="py-2.5 px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-extrabold text-xs border border-border cursor-pointer transition-colors"
              >
                Đăng Ký
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-muted-foreground font-bold">Đang tải thông tin tài khoản...</span>
          </div>
        ) : !user ? (
          /* ========================================================= */
          /* NOT LOGGED IN: 7 SPACE CARDS (GIỐNG ẢNH YEUTRUYEN) + LOGIN */
          /* ========================================================= */
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            {/* 7 Feature Space Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Hồ Sơ */}
              <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground">Hồ Sơ Thành Viên</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Thông tin tài khoản, biệt danh, số dư xu và vai trò thành viên.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-500">Xem thông tin &rarr;</span>
              </div>

              {/* 2. Tủ Truyện */}
              <Link
                href="/tu-truyen"
                className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-indigo-500 transition-colors">
                    Tủ Truyện Cá Nhân
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Đang theo dõi, đã đọc, hoàn thành và các chương đã mở khóa.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-500 flex items-center gap-1">
                  <span>Mở tủ truyện</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              {/* 3. Lịch Sử Đọc */}
              <Link
                href="/tu-truyen"
                className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-cyan-500 transition-colors">
                    Lịch Sử Đọc Truyện
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Truyện đã đọc, chương đang đọc dở và thời gian đọc gần nhất.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-cyan-500 flex items-center gap-1">
                  <span>Đọc tiếp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              {/* 4. Ví Xu */}
              <Link
                href="/nap-xu"
                className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-amber-500 transition-colors">
                    Ví Xu & Nạp Tiền
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Số dư xu, nạp xu tự động VPBank, lịch sử giao dịch và mua VIP.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                  <span>Nạp xu ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              {/* 5. Nhiệm Vụ Hệ Thống */}
              <div className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground">Nhiệm Vụ Hệ Thống</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Điểm danh 7 ngày, đọc truyện, bình luận và nhận xu mỗi ngày.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-purple-500">Tích lũy xu miễn phí &rarr;</span>
              </div>

              {/* 6. Hội Viên VIP */}
              <Link
                href="/vip"
                className="p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-xs group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                    <Crown className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-rose-500 transition-colors">
                    Gói Hội Viên VIP
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Đọc không giới hạn kho truyện chữ, truyện tranh, eBook và 15 giọng AI.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>Khám phá gói VIP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* Auth Form Card */}
            <div className="w-full max-w-md mx-auto rounded-3xl bg-card border border-border/70 p-6 sm:p-8 shadow-xl flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-xl font-black text-foreground">
                  {authMode === "login" ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản Mới"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Nhận ngay <strong className="text-amber-500">10 Xu tân thủ</strong> khi đăng ký
                </p>
              </div>

              {/* Social Login */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-border/80 bg-background hover:bg-muted font-bold text-xs sm:text-sm text-foreground flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Tiếp tục bằng Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={authLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-blue-600/30 bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Tiếp tục bằng Facebook</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Hoặc Email</span>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {authMode === "register" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-foreground">Họ tên / Biệt danh:</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-foreground">Email:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-foreground">Mật khẩu:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{authMode === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}</span>
                </button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                {authMode === "login" ? (
                  <span>
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                  </span>
                ) : (
                  <span>
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Đăng nhập
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LOGGED IN: COMPREHENSIVE USER PROFILE & TRANSACTION HUB   */
          /* ========================================================= */
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* User Profile Info Card */}
            <div className="rounded-3xl border border-border/60 bg-gradient-to-r from-card to-rose-500/5 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md ring-4 ring-rose-500/20 overflow-hidden shrink-0">
                  {user.user_metadata?.avatar_url || profile?.avatar_url ? (
                    <img
                      src={user.user_metadata?.avatar_url || profile?.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-foreground truncate">
                      {profile?.display_name || profile?.full_name || user.user_metadata?.full_name || "Độc Giả VIP"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                      <Crown className="w-3 h-3" />{" "}
                      {isUserVipActive(profile?.vip_until)
                        ? VIP_TIERS[profile?.vip_level || 1]?.name || `VIP ${profile?.vip_level}`
                        : "Thành Viên"}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>
                      Gia nhập: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">
                      ID: {user.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Hỗ trợ & Báo Admin"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Hỗ Trợ Admin</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2 px-3 rounded-xl bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 border border-border/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng Xuất</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Tổng Quan & Thống Kê</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "transactions"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Lịch Sử Nạp & Ví Xu</span>
                {transactions.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === "transactions" ? "bg-white text-rose-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {transactions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("missions")}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "missions"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Điểm Danh & Nhiệm Vụ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bookshelf")}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "bookshelf"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <BookMarked className="w-4 h-4" />
                <span>Tủ Truyện & Đã Đọc</span>
              </button>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & STATS */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                {/* 1. Stats Overview Cards */}
                <UserStatsOverview
                  stats={stats}
                  userEmail={user.email}
                  userName={profile?.display_name || user.user_metadata?.full_name}
                />

                {/* 2. VIP Status & Quick Upgrade Banner */}
                <div className="rounded-3xl border border-border/60 bg-gradient-to-r from-amber-500/10 via-card to-rose-500/10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${
                        isUserVipActive(profile?.vip_until)
                          ? "bg-gradient-to-tr from-amber-500 to-rose-500 ring-2 ring-amber-500/40"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-semibold">Quyền lợi hội viên:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          {isUserVipActive(profile?.vip_until)
                            ? VIP_TIERS[profile?.vip_level || 1]?.name || `VIP ${profile?.vip_level}`
                            : "Độc Giả Thường"}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground mt-0.5">
                        {isUserVipActive(profile?.vip_until) ? (
                          <span className="text-emerald-500">
                            Đang hoạt động · Còn {getRemainingVipDays(profile.vip_until)} ngày (Hết hạn:{" "}
                            {new Date(profile.vip_until).toLocaleDateString("vi-VN")})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Đọc toàn bộ truyện VIP, eBook không giới hạn và mở khóa 15 giọng đọc AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/vip"
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all whitespace-nowrap flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{isUserVipActive(profile?.vip_until) ? "Gia Hạn VIP" : "Nâng Cấp VIP Ngay"}</span>
                  </Link>
                </div>

                {/* 3. Recent Transactions Preview (Top 3) */}
                <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-rose-500" />
                      <span>Giao Dịch Gần Đây</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("transactions")}
                      className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem toàn bộ ({transactions.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {transactions.slice(0, 3).length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Chưa có giao dịch nạp xu nào gần đây.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {transactions.slice(0, 3).map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                              <Coins className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-foreground block truncate">
                                {tx.order_code}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-amber-500 block">
                              +{tx.coins_added} Xu
                            </span>
                            {Number(tx.amount_vnd || 0) > 0 && (
                              <span className="text-[10px] font-bold text-rose-500">
                                {formatVND(Number(tx.amount_vnd))}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Daily Checkin & Streaks */}
                <div id="diem-danh">
                  <DailyCheckinCard user={user} onRewardClaimed={handleBalanceUpdate} />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: DEPOSIT & TRANSACTIONS HISTORY */}
            {activeTab === "transactions" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                <DepositHistoryCard
                  transactions={transactions}
                  isLoading={isStatsLoading}
                  onRefresh={() => user && fetchUserProfileAndStats(user.id)}
                  onOpenSupport={() => setIsSupportModalOpen(true)}
                />
              </div>
            )}

            {/* TAB CONTENT 3: MISSIONS & VOUCHERS */}
            {activeTab === "missions" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                <div id="diem-danh">
                  <DailyCheckinCard user={user} onRewardClaimed={handleBalanceUpdate} />
                </div>
                <VoucherRedeemCard user={user} onVoucherRedeemed={handleBalanceUpdate} />
                <MemberMissionsCard user={user} onBalanceUpdate={handleBalanceUpdate} />
              </div>
            )}

            {/* TAB CONTENT 4: BOOKSHELF & READING HISTORY */}
            {activeTab === "bookshelf" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-indigo-500" />
                      <span>Tủ Truyện Cá Nhân & Lịch Sử Đọc</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đồng bộ toàn bộ danh sách truyện yêu thích và tiến độ đọc dở trên mọi thiết bị.
                    </p>
                  </div>
                  <Link
                    href="/tu-truyen"
                    className="py-2.5 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Mở Tủ Truyện Chi Tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SUPPORT MODAL (DIRECT FORWARD TO TELEGRAM BOT TRUYENVIP)  */}
      {/* ========================================================= */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-foreground">
                    Hỗ Trợ Admin Trực Tiếp
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tin nhắn sẽ được chuyển tiếp tức thì vào Telegram Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSupport} className="flex flex-col gap-3 text-left">
              {user && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold block truncate">
                      {profile?.display_name || user?.user_metadata?.full_name || "Thành viên"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {user?.email} (Số dư: {stats.coinsBalance} Xu)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Số điện thoại / Zalo để Admin tiện liên hệ (Không bắt buộc):</span>
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="Ví dụ: 0987xxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nội dung yêu cầu / Phản ánh nạp xu: *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Ví dụ: Em đã chuyển khoản nạp xu từ 10 phút trước qua app ngân hàng nhưng chưa thấy cộng xu, nhờ Admin kiểm tra giúp em với..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-foreground resize-none"
                />
              </div>

              {supportError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{supportError}</span>
                </div>
              )}

              {supportSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{supportSuccess}</span>
                </div>
              )}

              {/* Direct Telegram link */}
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs flex items-center justify-center">
                <a
                  href="https://t.me/truyenvip_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Liên hệ admin qua Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  disabled={isSubmittingSupport}
                  className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSupport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Cho Admin ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
