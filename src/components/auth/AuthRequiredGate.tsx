"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Sparkles,
  Mail,
  User,
  ArrowLeft,
  Coins,
  History,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AuthRequiredGateProps {
  storyTitle: string;
  chapterTitle: string;
  storySlug: string;
  onSuccess?: () => void;
}

export function AuthRequiredGate({
  storyTitle,
  chapterTitle,
  storySlug,
  onSuccess,
}: AuthRequiredGateProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const supabase = createClient();

  // Đăng nhập Google
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            window.location.pathname
          )}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối với tài khoản Google.");
      setLoading(false);
    }
  };

  // Đăng nhập Facebook
  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const { loginWithFacebook } = await import("@/lib/auth/facebookLogin");
      await loginWithFacebook(window.location.pathname);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối với tài khoản Facebook.");
      setLoading(false);
    }
  };

  // Đăng nhập hoặc Đăng ký qua Email
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const regData = await res.json();
        if (!res.ok) {
          throw new Error(regData.error || "Đăng ký thất bại");
        }

        // Auto sign in immediately after registration
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginErr) throw loginErr;

        setSuccessMessage("Đăng ký thành công! Bạn nhận được 50 Xu tân thủ.");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else window.location.reload();
        }, 800);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage("Đăng nhập thành công! Bắt đầu đọc truyện...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Xác thực thất bại, vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-8 px-4 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
      {/* Top back link */}
      <div className="w-full mb-4 flex items-center justify-between text-xs">
        <Link
          href={`/truyen/${storySlug}`}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang giới thiệu truyện</span>
        </Link>
      </div>

      {/* Main Gate Card */}
      <div className="w-full rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-foreground">
        {/* Header with Lock icon */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Yêu Cầu Đăng Nhập Để Đọc Truyện
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
            Đăng nhập để đọc <strong className="text-rose-500">{storyTitle}</strong> ({chapterTitle}), tự động lưu tiến độ đọc và đồng bộ tủ truyện trên mọi thiết bị.
          </p>
        </div>

        {/* 1-Click Social Logins */}
        <div className="flex flex-col gap-2.5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Tiếp tục bằng tài khoản Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Hoặc với Email
          </span>
          <div className="border-t border-border w-full" />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-1.5 rounded-lg transition-all ${
              mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-1.5 rounded-lg transition-all ${
              mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Feedback messages */}
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

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 text-xs">
          {mode === "register" && (
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
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
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
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
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
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{mode === "login" ? "Đăng Nhập Ngay" : "Tạo Tài Khoản & Bắt Đầu Đọc"}</span>
          </button>
        </form>

        {/* Benefits badge */}
        <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-bold text-amber-500">Tặng ngay 50 Xu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Lưu trang & Đọc đa thiết bị</span>
          </div>
        </div>
      </div>
    </div>
  );
}
