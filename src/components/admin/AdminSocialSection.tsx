"use client";

import { useState } from "react";
import {
  Share2,
  Key,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Smartphone,
  Globe,
  Database,
  ShieldCheck,
} from "lucide-react";

interface AdminSocialSectionProps {
  settings: any;
  setSettings: (s: any) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  showToast: (msg: string) => void;
}

export function AdminSocialSection({
  settings,
  setSettings,
  onSave,
  saving,
  showToast,
}: AdminSocialSectionProps) {
  const [copiedKey, setCopiedKey] = useState<string>("");
  const [testingTg, setTestingTg] = useState(false);
  const [tgTestMsg, setTgTestMsg] = useState("");
  const [tgResult, setTgResult] = useState<string | null>(null);

  const [testingFb, setTestingFb] = useState(false);
  const [fbResult, setFbResult] = useState<string | null>(null);

  const [testingGoogle, setTestingGoogle] = useState(false);
  const [googleResult, setGoogleResult] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(""), 2500);
  };

  const oauth = settings?.oauth || {
    googleEnabled: true,
    googleClientId: "",
    googleClientSecret: "",
    facebookEnabled: true,
    facebookAppId: "",
    facebookAppSecret: "",
    supabaseCallbackUrl: "https://bqvffeqjgjtzprouwshd.supabase.co/auth/v1/callback",
    siteRedirectUrl: "https://doctruyen.vip/auth/callback",
  };

  const social = settings?.socialIntegrations || {
    facebook: {
      pageId: "",
      pageAccessToken: "",
      groupId: "",
      autoShareStory: true,
      autoShareChapter: false,
      pageUrl: "https://facebook.com/doctruyenvip",
      postTemplate: "🎉 [DocTruyen.vip] Ra mắt chương mới: {title} - {chapter}!\n👉 Đọc ngay tại: {url}\n#doctruyen #manga #truyenmoi",
    },
    telegram: {
      botToken: "",
      channelId: "@doctruyenvip",
      autoBroadcastStory: true,
      autoBroadcastChapter: true,
      channelUrl: "https://t.me/doctruyenvip",
      messageTemplate: "📢 *{title}* vừa cập nhật *{chapter}*!\n\n📖 Đọc miễn phí tại: {url}",
    },
    zalo: {
      oaId: "",
      appId: "",
      secretKey: "",
      autoNotify: false,
    },
    googleIndexing: {
      enabled: true,
      serviceAccountEmail: "",
      serviceAccountKey: "",
      autoPingNewChapter: true,
    },
    twitter: {
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      accessSecret: "",
      autoTweet: false,
    },
    pinterest: {
      accessToken: "",
      boardId: "",
      autoPinCover: false,
    },
    shareButtons: {
      enableFacebook: true,
      enableTelegram: true,
      enableTwitter: true,
      enableZalo: true,
      enablePinterest: true,
      enableCopyLink: true,
    },
  };

  const updateOauth = (patch: any) => {
    setSettings({
      ...settings,
      oauth: { ...oauth, ...patch },
    });
  };

  const updateSocial = (patch: any) => {
    setSettings({
      ...settings,
      socialIntegrations: { ...social, ...patch },
    });
  };

  // Test Telegram Bot
  const handleTestTelegram = async () => {
    setTestingTg(true);
    setTgResult(null);
    try {
      const res = await fetch("/api/admin/social/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "telegram",
          config: {
            botToken: social.telegram?.botToken,
            channelId: social.telegram?.channelId,
            message: tgTestMsg || "🚀 [DocTruyen.vip] Kiểm tra kết nối Telegram Bot tự động thành công!",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgResult(data.message);
        showToast("Gửi tin nhắn Telegram thử nghiệm thành công!");
      } else {
        setTgResult(`Lỗi: ${data.error}`);
      }
    } catch (e: any) {
      setTgResult(`Lỗi kết nối: ${e.message}`);
    } finally {
      setTestingTg(false);
    }
  };

  // Test Facebook Page
  const handleTestFacebook = async () => {
    setTestingFb(true);
    setFbResult(null);
    try {
      const res = await fetch("/api/admin/social/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "facebook",
          config: {
            pageId: social.facebook?.pageId,
            pageAccessToken: social.facebook?.pageAccessToken,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFbResult(data.message);
        showToast("Kết nối Fanpage Facebook thành công!");
      } else {
        setFbResult(`Lỗi: ${data.error}`);
      }
    } catch (e: any) {
      setFbResult(`Lỗi: ${e.message}`);
    } finally {
      setTestingFb(false);
    }
  };

  // Test Google Indexing Key
  const handleTestGoogleIndexing = async () => {
    setTestingGoogle(true);
    setGoogleResult(null);
    try {
      const res = await fetch("/api/admin/social/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "google_indexing",
          config: {
            serviceAccountKey: social.googleIndexing?.serviceAccountKey,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGoogleResult(data.message);
        showToast("Cấu hình Google Service Account hợp lệ!");
      } else {
        setGoogleResult(`Lỗi: ${data.error}`);
      }
    } catch (e: any) {
      setGoogleResult(`Lỗi: ${e.message}`);
    } finally {
      setTestingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      {/* Intro Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-card via-card to-rose-500/10 border border-border/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Share2 className="w-5 h-5 text-rose-500" />
              Quản Lý Kết Nối API & Tự Động Chia Sẻ (Auto-Share)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase">
              Tích Hợp Sẵn
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cấu hình xác thực đăng nhập Google/Facebook OAuth, tự động phát sóng chương mới lên Telegram, Fanpage, Zalo và ping Google Indexing API.
          </p>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{saving ? "Đang lưu..." : "Lưu Toàn Bộ Cấu Hình"}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: CẤU HÌNH ĐĂNG NHẬP OAUTH (GOOGLE & FACEBOOK) */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-5">
        <div className="border-b border-border/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Cấu Hình Đăng Nhập Mạng Xã Hội (Google & Facebook OAuth)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Độc giả có thể đăng nhập tức thì bằng tài khoản Google hoặc Facebook chỉ với 1 cú click.
            </p>
          </div>

          <a
            href="https://supabase.com/dashboard/project/bqvffeqjgjtzprouwshd/auth/providers"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 shrink-0"
          >
            Mở Supabase Auth Providers <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Callback URLs helper box */}
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Đường Dẫn Callback Cần Thêm Vào Google Cloud Console & Meta for Developers:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">
                1. Supabase Callback URL (Bắt buộc cho OAuth)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={oauth.supabaseCallbackUrl}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-[11px] select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(oauth.supabaseCallbackUrl, "supabase_cb")}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer shrink-0"
                  title="Sao chép"
                >
                  {copiedKey === "supabase_cb" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">
                2. Site Redirect URL (Trang nhận kết quả)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={oauth.siteRedirectUrl}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-[11px] select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(oauth.siteRedirectUrl, "site_cb")}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer shrink-0"
                  title="Sao chép"
                >
                  {copiedKey === "site_cb" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Google & Facebook credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Google OAuth Block */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-foreground">Đăng Nhập Google</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={oauth.googleEnabled}
                  onChange={(e) => updateOauth({ googleEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">Google Client ID</label>
              <input
                type="text"
                value={oauth.googleClientId || ""}
                onChange={(e) => updateOauth({ googleClientId: e.target.value })}
                placeholder="xxxxxxxxx-xxxxxxxxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/70 text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">Google Client Secret</label>
              <input
                type="password"
                value={oauth.googleClientSecret || ""}
                onChange={(e) => updateOauth({ googleClientSecret: e.target.value })}
                placeholder="GOCSPX-••••••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/70 text-xs font-mono"
              />
            </div>
          </div>

          {/* Facebook OAuth Block */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-bold text-foreground">Đăng Nhập Facebook</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={oauth.facebookEnabled}
                  onChange={(e) => updateOauth({ facebookEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">Facebook App ID</label>
              <input
                type="text"
                value={oauth.facebookAppId || ""}
                onChange={(e) => updateOauth({ facebookAppId: e.target.value })}
                placeholder="123456789012345"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/70 text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-muted-foreground">Facebook App Secret</label>
              <input
                type="password"
                value={oauth.facebookAppSecret || ""}
                onChange={(e) => updateOauth({ facebookAppSecret: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/70 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: TELEGRAM BOT & CHANNEL AUTO BROADCAST */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="border-b border-border/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Telegram Bot & Kênh Phát Sóng Tự Động</h3>
              <p className="text-[11px] text-muted-foreground">Tự động phát thông báo khi xuất bản truyện hoặc chương mới</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Telegram Bot Token (từ @BotFather)</label>
            <input
              type="text"
              value={social.telegram?.botToken || ""}
              onChange={(e) =>
                updateSocial({
                  telegram: { ...social.telegram, botToken: e.target.value },
                })
              }
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Channel ID / Chat ID</label>
            <input
              type="text"
              value={social.telegram?.channelId || "@doctruyenvip"}
              onChange={(e) =>
                updateSocial({
                  telegram: { ...social.telegram, channelId: e.target.value },
                })
              }
              placeholder="@doctruyenvip hoặc -100123456789"
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <label className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={social.telegram?.autoBroadcastStory ?? true}
              onChange={(e) =>
                updateSocial({
                  telegram: { ...social.telegram, autoBroadcastStory: e.target.checked },
                })
              }
              className="rounded text-rose-500 focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-foreground">Tự động phát sóng khi có Truyện Mới</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={social.telegram?.autoBroadcastChapter ?? true}
              onChange={(e) =>
                updateSocial({
                  telegram: { ...social.telegram, autoBroadcastChapter: e.target.checked },
                })
              }
              className="rounded text-rose-500 focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-foreground">Tự động phát sóng khi có Chương Mới</span>
          </label>
        </div>

        {/* Template & Test block */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-bold text-foreground">Mẫu Tin Nhắn Telegram (Hỗ trợ Markdown)</label>
          <textarea
            rows={2}
            value={social.telegram?.messageTemplate || ""}
            onChange={(e) =>
              updateSocial({
                telegram: { ...social.telegram, messageTemplate: e.target.value },
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
          />
        </div>

        {/* Test Telegram button */}
        <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={tgTestMsg}
              onChange={(e) => setTgTestMsg(e.target.value)}
              placeholder="Nhập nội dung tin nhắn thử nghiệm (để trống sẽ dùng tin mẫu)..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={testingTg || !social.telegram?.botToken}
            className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
          >
            {testingTg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Gửi Tin Thử Nghiệm</span>
          </button>
        </div>

        {tgResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              tgResult.startsWith("Lỗi")
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
            }`}
          >
            {tgResult.startsWith("Lỗi") ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{tgResult}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: FACEBOOK FANPAGE & GROUP AUTO SHARE */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="border-b border-border/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              f
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Facebook Fanpage & Group API (Auto-Share)</h3>
              <p className="text-[11px] text-muted-foreground">Tự động đăng bài lên Fanpage và Group Facebook khi có nội dung mới</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Facebook Fanpage ID</label>
            <input
              type="text"
              value={social.facebook?.pageId || ""}
              onChange={(e) =>
                updateSocial({
                  facebook: { ...social.facebook, pageId: e.target.value },
                })
              }
              placeholder="1000987654321"
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-foreground">Page Access Token (Permanent / Long-lived)</label>
            <input
              type="password"
              value={social.facebook?.pageAccessToken || ""}
              onChange={(e) =>
                updateSocial({
                  facebook: { ...social.facebook, pageAccessToken: e.target.value },
                })
              }
              placeholder="EAAB••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <label className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={social.facebook?.autoShareStory ?? true}
              onChange={(e) =>
                updateSocial({
                  facebook: { ...social.facebook, autoShareStory: e.target.checked },
                })
              }
              className="rounded text-rose-500 focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-foreground">Tự động đăng lên Fanpage khi có Truyện Mới</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer">
            <input
              type="checkbox"
              checked={social.facebook?.autoShareChapter ?? false}
              onChange={(e) =>
                updateSocial({
                  facebook: { ...social.facebook, autoShareChapter: e.target.checked },
                })
              }
              className="rounded text-rose-500 focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-foreground">Tự động đăng lên Fanpage khi có Chương Mới</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestFacebook}
            disabled={testingFb || !social.facebook?.pageId || !social.facebook?.pageAccessToken}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {testingFb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Kiểm Tra Kết Nối Facebook Fanpage</span>
          </button>
        </div>

        {fbResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              fbResult.startsWith("Lỗi")
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
            }`}
          >
            {fbResult.startsWith("Lỗi") ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{fbResult}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: GOOGLE INDEXING API (AUTO PING SEARCH CONSOLE) */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="border-b border-border/50 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Google Indexing API (Tự Động Báo Lập Chỉ Mục)</h3>
              <p className="text-[11px] text-muted-foreground">Tự động thông báo Googlebot crawl và index truyện / chương mới trong vòng 5 phút</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={social.googleIndexing?.enabled ?? true}
              onChange={(e) =>
                updateSocial({
                  googleIndexing: { ...social.googleIndexing, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-foreground">Google Service Account JSON Content</label>
          <textarea
            rows={3}
            value={social.googleIndexing?.serviceAccountKey || ""}
            onChange={(e) =>
              updateSocial({
                googleIndexing: { ...social.googleIndexing, serviceAccountKey: e.target.value },
              })
            }
            placeholder='{ "type": "service_account", "project_id": "...", "client_email": "...", "private_key": "..." }'
            className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestGoogleIndexing}
            disabled={testingGoogle || !social.googleIndexing?.serviceAccountKey}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {testingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Kiểm Tra File Service Account JSON</span>
          </button>
        </div>

        {googleResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              googleResult.startsWith("Lỗi")
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
            }`}
          >
            {googleResult.startsWith("Lỗi") ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{googleResult}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 5: SOCIAL SHARE BUTTONS CONFIGURATION */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="border-b border-border/50 pb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-rose-500" />
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Cấu Hình Nút Chia Sẻ Mạng Xã Hội Trên Trang Truyện</h3>
            <p className="text-[11px] text-muted-foreground">Bật/tắt các nút chia sẻ mạng xã hội hiển thị cho độc giả</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: "enableFacebook", label: "Facebook Share" },
            { key: "enableTelegram", label: "Telegram Share" },
            { key: "enableZalo", label: "Zalo Share" },
            { key: "enableTwitter", label: "Twitter (X) Share" },
            { key: "enablePinterest", label: "Pinterest Pin" },
            { key: "enableCopyLink", label: "Nút Sao Chép Link" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={social.shareButtons?.[item.key] ?? true}
                onChange={(e) =>
                  updateSocial({
                    shareButtons: {
                      ...social.shareButtons,
                      [item.key]: e.target.checked,
                    },
                  })
                }
                className="rounded text-rose-500 focus:ring-rose-500"
              />
              <span className="text-xs font-bold text-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end pt-2 pb-6">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{saving ? "Đang lưu cấu hình..." : "Lưu Toàn Bộ Cấu Hình Mạng Xã Hội & API"}</span>
        </button>
      </div>
    </div>
  );
}
