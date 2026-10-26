"use client";

import { useState, useRef } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Bell,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Upload,
  RefreshCw,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface UserPreferences {
  notify_new_chapter: boolean;
  notify_new_story: boolean;
  notify_coins: boolean;
  notify_promotions: boolean;
}

export interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    user_metadata?: any;
  } | null;
  onProfileUpdated?: (updated: { displayName?: string; avatarUrl?: string }) => void;
}

const PRESET_AVATARS = [
  { name: "Kiếm Hiệp", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=KiemHiep&backgroundColor=b6e3f4,c0aede" },
  { name: "Tiên Tôn", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=TienTon&backgroundColor=ffd5dc,ffdfbf" },
  { name: "Nữ Hiệp", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=NuHiep&backgroundColor=d1d4f9,c0aede" },
  { name: "Phong Vân", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=PhongVan&backgroundColor=b6e3f4,ffd5dc" },
  { name: "Thánh Nữ", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=ThanhNu&backgroundColor=ffdfbf,ffd5dc" },
  { name: "Linh Nhi", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=LinhNhi&backgroundColor=d1d4f9,b6e3f4" },
  { name: "Hào Kiệt", url: "https://api.dicebear.com/7.x/micah/svg?seed=HaoKiet&backgroundColor=ffd5dc,d1d4f9" },
  { name: "Cyber Ninja", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberMecha&backgroundColor=c0aede,b6e3f4" },
];

export function UserSettingsModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preferences state
  const initialPrefs: UserPreferences = {
    notify_new_chapter: user?.user_metadata?.preferences?.notify_new_chapter ?? true,
    notify_new_story: user?.user_metadata?.preferences?.notify_new_story ?? true,
    notify_coins: user?.user_metadata?.preferences?.notify_coins ?? true,
    notify_promotions: user?.user_metadata?.preferences?.notify_promotions ?? true,
  };
  const [preferences, setPreferences] = useState<UserPreferences>(initialPrefs);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local avatar file upload with automatic client-side compression (max 256x256, < 30KB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Kích thước ảnh tối đa là 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setProfileMsg({ type: "error", text: "Không thể đọc tệp ảnh này." });
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data url if Image failed to load
        const result = reader.result as string;
        setAvatarBase64(result);
        setAvatarUrl(result);
      };
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let compressed = canvas.toDataURL("image/webp", 0.85);
          if (!compressed.startsWith("data:image/webp")) {
            compressed = canvas.toDataURL("image/jpeg", 0.85);
          }
          setAvatarBase64(compressed);
          setAvatarUrl(compressed);
        } else {
          const result = reader.result as string;
          setAvatarBase64(result);
          setAvatarUrl(result);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile & Avatar
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsUpdatingProfile(true);
    setProfileMsg(null);

    const newDisplayName = displayName.trim();
    let finalAvatar = avatarUrl;

    try {
      let apiSuccess = false;

      // 1. Try updating via API route
      try {
        const res = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            displayName: newDisplayName,
            avatarUrl: avatarBase64 ? undefined : avatarUrl,
            avatarBase64: avatarBase64 || undefined,
          }),
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.warn("API returned non-JSON response:", res.status, text.slice(0, 200));
        }

        if (res.ok && data?.success) {
          apiSuccess = true;
          if (data.avatarUrl) {
            finalAvatar = data.avatarUrl;
          }
        }
      } catch (fetchErr) {
        console.warn("Update profile API call failed, attempting direct Supabase fallback:", fetchErr);
      }

      // 2. Direct Supabase Client fallback if API didn't succeed
      if (!apiSuccess) {
        const supabase = createClient();
        const profileUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (newDisplayName) profileUpdate.display_name = newDisplayName;
        if (!avatarBase64 && avatarUrl) profileUpdate.avatar_url = avatarUrl;

        const { error: sbErr } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user.id);

        if (sbErr) {
          throw new Error(sbErr.message || "Không thể cập nhật hồ sơ vào cơ sở dữ liệu.");
        }

        // Also update auth user metadata
        try {
          await supabase.auth.updateUser({
            data: {
              display_name: newDisplayName,
              full_name: newDisplayName,
              avatar_url: (!avatarBase64 && avatarUrl) ? avatarUrl : undefined,
            },
          });
        } catch (metaErr) {
          console.warn("Auth metadata update warn:", metaErr);
        }
      }

      setProfileMsg({ type: "success", text: "Đã cập nhật ảnh đại diện và tên hiển thị thành công!" });
      setAvatarUrl(finalAvatar);
      setAvatarBase64(null);

      if (onProfileUpdated) {
        onProfileUpdated({
          displayName: newDisplayName,
          avatarUrl: finalAvatar,
        });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Lỗi khi cập nhật hồ sơ." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit Email Change
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailMsg({ type: "error", text: "Vui lòng nhập địa chỉ email hợp lệ." });
      return;
    }
    if (cleanEmail === user?.email?.toLowerCase()) {
      setEmailMsg({ type: "error", text: "Email mới trùng với email hiện tại." });
      return;
    }

    setIsUpdatingEmail(true);
    setEmailMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: cleanEmail });
      if (error) throw error;

      setEmailMsg({
        type: "success",
        text: `Hệ thống đã gửi liên kết xác nhận tới ${cleanEmail}. Vui lòng mở hộp thư và nhấn xác nhận để hoàn tất đổi email!`,
      });
      setNewEmail("");
    } catch (err: any) {
      setEmailMsg({ type: "error", text: err.message || "Lỗi khi gửi yêu cầu đổi email." });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Submit Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải có tối thiểu 6 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg({ type: "success", text: "Đã đổi mật khẩu thành công!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Lỗi khi đổi mật khẩu." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Submit Notification Preferences
  const handleSavePreferences = async () => {
    if (!user?.id) return;
    setIsSavingPrefs(true);
    setPrefsMsg(null);

    try {
      let apiSuccess = false;
      try {
        const res = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            preferences,
          }),
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.warn("Preferences non-JSON:", res.status, text.slice(0, 100));
        }

        if (res.ok && data?.success) {
          apiSuccess = true;
        }
      } catch (fErr) {
        console.warn("Preferences API fetch failed, fallback to direct Supabase:", fErr);
      }

      // Direct Supabase fallback
      if (!apiSuccess) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { preferences },
        });
      }

      setPrefsMsg({ type: "success", text: "Đã lưu cài đặt nhận thông báo thành công!" });
    } catch (err: any) {
      setPrefsMsg({ type: "error", text: err.message || "Lỗi lưu cài đặt thông báo." });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Sửa Đổi Thông Tin Cá Nhân</h2>
              <p className="text-xs text-muted-foreground">Quản lý hồ sơ, bảo mật và cài đặt thông báo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center border-b border-border bg-muted/20 px-4 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "profile"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ảnh & Tên Hiển Thị</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "security"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Email & Mật Khẩu</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "notifications"
                ? "border-rose-500 text-rose-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Cài Đặt Thông Báo</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PROFILE & AVATAR */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                  }`}
                >
                  {profileMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Avatar Preview & Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-rose-500/40 bg-muted flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Đổi ảnh</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Ảnh Đại Diện Cá Nhân</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Tải ảnh từ máy (PNG, JPG, WebP tối đa 3MB) hoặc chọn mẫu có sẵn bên dưới.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải ảnh từ máy</span>
                    </button>
                    {avatarBase64 && (
                      <span className="text-[10px] text-emerald-500 font-medium">✓ Đã chọn ảnh mới</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hoặc chọn mẫu Avatar độc quyền:</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((item, idx) => {
                    const isSelected = avatarUrl === item.url && !avatarBase64;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(item.url);
                          setAvatarBase64(null);
                        }}
                        className={`relative rounded-xl overflow-hidden border p-1 transition-all ${
                          isSelected
                            ? "border-rose-500 ring-2 ring-rose-500/30 scale-105"
                            : "border-border/60 hover:border-rose-500/40 hover:scale-102"
                        }`}
                        title={item.name}
                      >
                        <img src={item.url} alt={item.name} className="w-full h-auto aspect-square rounded-lg object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px]">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Tên hiển thị (Biệt danh):</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên hiển thị của bạn..."
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground">Tên này sẽ hiển thị khi bạn bình luận, nạp xu và tương tác trên ĐọcTruyện.VIP.</p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu Thay Đổi Hồ Sơ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EMAIL & PASSWORD */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Email */}
              <form onSubmit={handleSaveEmail} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-500" />
                  <h4 className="text-xs font-bold text-foreground">Thay Đổi Địa Chỉ Email</h4>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Email hiện tại: <span className="font-bold text-foreground">{user?.email || "Chưa thiết lập"}</span>
                </div>

                {emailMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      emailMsg.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                    }`}
                  >
                    {emailMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{emailMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email mới..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Link xác thực sẽ được gửi tới hòm thư mới để đảm bảo quyền sở hữu.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi xác thực...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Cập Nhật Email</span>
                    </>
                  )}
                </button>
              </form>

              {/* Change Password */}
              <form onSubmit={handleSavePassword} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-foreground">Đổi Mật Khẩu Đăng Nhập</h4>
                </div>

                {passwordMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                    }`}
                  >
                    {passwordMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-amber-500 pr-10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu mới..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang đổi mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Lưu Mật Khẩu Mới</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS PREFERENCES */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-foreground">Cài Đặt Nhận Tin Nhắn & Thông Báo</h4>
                <p className="text-[11px] text-muted-foreground">
                  Chọn những thông báo bạn muốn nhận tự động từ hệ thống ĐọcTruyện.VIP.
                </p>
              </div>

              {prefsMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    prefsMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                  }`}
                >
                  {prefsMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{prefsMsg.text}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* 1. New Chapter Notification */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>🔔 Thông Báo Chương Mới</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Nhận tin nhắn khi các bộ truyện trong Tủ truyện của bạn ra mắt chương mới.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.notify_new_chapter}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notify_new_chapter: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {/* 2. New Story Recommendations */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>📚 Đề Xuất Truyện Mới & Thịnh Hành</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Gợi ý truyện mới hay, tác phẩm đề cử và bảng xếp hạng tuần theo thể loại yêu thích.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.notify_new_story}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notify_new_story: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {/* 3. Coins & Transactions */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>🪙 Biến Động Số Dư & Nạp Xu</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Thông báo khi nạp tiền thành công, Admin duyệt lệnh nạp xu, hoàn thành nhiệm vụ.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.notify_coins}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notify_coins: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {/* 4. Promotions & Giftcodes */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>🎁 Khuyến Mãi & Giftcode VIP</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Nhận mã giảm giá nạp xu, voucher quà tặng ngày lễ và ưu đãi gói đọc VIP không giới hạn.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.notify_promotions}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notify_promotions: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={isSavingPrefs}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPrefs ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu cài đặt...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu Cài Đặt Thông Báo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
