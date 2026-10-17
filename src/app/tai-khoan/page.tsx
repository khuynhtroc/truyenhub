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
} from "lucide-react";
import { DailyCheckinCard } from "@/components/profile/DailyCheckinCard";
import { VoucherRedeemCard } from "@/components/profile/VoucherRedeemCard";
import { MemberMissionsCard } from "@/components/profile/MemberMissionsCard";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);


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
        fetchUserProfile(user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile(data);
      } else if (error && error.code === "PGRST116") {
        // Create initial profile if not exists
        const newProfile = {
          id: userId,
          full_name: user?.user_metadata?.full_name || "Độc Giả",
          email: user?.email,
          coins_balance: 20,
          coins: 20,
          vip_level: 1,
        };
        await supabase.from("profiles").insert([newProfile]);
        setProfile(newProfile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setProfile((prev: any) => ({
      ...prev,
      coins_balance: newBalance,
      coins: newBalance,
    }));
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/tai-khoan`,
        },
      });
      if (error) throw error;
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
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs text-muted-foreground font-bold">Đang tải thông tin tài khoản...</span>
          </div>
        ) : !user ? (
          /* ========================================================= */
          /* NOT LOGGED IN: PROMINENT GOOGLE & FACEBOOK LOGIN INTERFACE */
          /* ========================================================= */
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-200">
            {/* Header intro */}
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-500/25">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Đăng Nhập Tài Khoản Độc Giả
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                Đăng nhập để tự động đồng bộ tủ truyện, lịch sử đọc trên mọi thiết bị, nhận <strong className="text-amber-500">10 Xu tân thủ</strong> và mở khóa các chương VIP đỉnh cao.
              </p>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-md rounded-3xl bg-card border border-border/70 p-6 sm:p-8 shadow-xl flex flex-col gap-5">
              {/* Fast Social Login Buttons (Google & Facebook) */}
              <div className="flex flex-col gap-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 rounded-2xl border border-border/80 bg-background hover:bg-muted font-bold text-xs sm:text-sm text-foreground flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Tiếp tục bằng tài khoản Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Tiếp tục bằng tài khoản Facebook</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-border w-full" />
                <span className="bg-card px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Hoặc với Email
                </span>
                <div className="border-t border-border w-full" />
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`py-2 rounded-lg transition-all ${
                    authMode === "login"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`py-2 rounded-lg transition-all ${
                    authMode === "register"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Đăng Ký
                </button>
              </div>

              {/* Alerts */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 text-xs">
                {authMode === "register" && (
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-foreground">Họ và Tên</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Địa chỉ Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
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
            </div>

            {/* Perks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-2">
              <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-foreground">Tặng 10 Xu Tân Thủ</span>
                  <span className="text-[11px] text-muted-foreground">Mở khóa ngay các chương VIP</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-xs">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-foreground">Đồng Bộ Đa Thiết Bị</span>
                  <span className="text-[11px] text-muted-foreground">Tủ truyện & lịch sử đọc lưu cloud</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-foreground">Bảo Mật An Toàn</span>
                  <span className="text-[11px] text-muted-foreground">Đăng nhập chuẩn mã hóa SSL</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LOGGED IN: FULL USER PROFILE DASHBOARD */
          /* ========================================================= */
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* User Card */}
            <div className="rounded-3xl border border-border/50 bg-gradient-to-r from-card to-rose-500/5 p-6 sm:p-8 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md ring-4 ring-rose-500/20 overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black">
                      {profile?.full_name || user.user_metadata?.full_name || "Độc Giả Thân Thiết"}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3" /> VIP {profile?.vip_level || 1}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Thành viên từ: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            </div>

            {/* Coins Balance Card */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Số dư khả dụng</span>
                  <div className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
                    {Number(profile?.coins_balance ?? profile?.coins ?? 0).toLocaleString("vi-VN")}{" "}
                    <span className="text-xs font-bold text-foreground">Xu</span>
                  </div>
                </div>
              </div>

              <Link
                href="/nap-xu"
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all hover:opacity-90"
              >
                + Nạp Xu Ngay
              </Link>
            </div>

            {/* Daily 7-Day Check-in Streak Card */}
            <div id="diem-danh">
              <DailyCheckinCard user={user} onRewardClaimed={handleBalanceUpdate} />
            </div>

            {/* Voucher & Giftcode Redeem Card */}
            <VoucherRedeemCard user={user} onVoucherRedeemed={handleBalanceUpdate} />

            {/* Member Activity Missions */}
            <MemberMissionsCard />


            {/* Quick Menu */}
            <div className="rounded-2xl border border-border/50 bg-card p-2 flex flex-col divide-y divide-border/40 shadow-sm text-sm font-semibold">
              <Link
                href="/tu-truyen"
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-rose-500" />
                  <span>Lịch sử đọc & Tủ truyện cá nhân</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/kham-pha"
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <span>Khám phá truyện mới & chương VIP</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span>Bảo mật tài khoản & Xác thực OAuth</span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Đã Kích Hoạt
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
