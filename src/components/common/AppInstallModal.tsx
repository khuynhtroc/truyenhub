"use client";

import { useState } from "react";
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "android" | "ios";
}

export function AppInstallModal({ isOpen, onClose, defaultTab = "android" }: AppInstallModalProps) {
  const [activeTab, setActiveTab] = useState<"android" | "ios">(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("https://doctruyen.vip");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header with gradient bar */}
        <div className="relative p-4 sm:p-6 pb-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-600/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-card border border-border/80 p-1 flex items-center justify-center shadow-lg shadow-rose-500/10">
                <img src="/logo-icon.png" alt="App Icon" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                  Cài Đặt App DocTruyen
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                    VIP
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Trải nghiệm đọc full màn hình, tải siêu tốc, không quảng cáo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-muted/60 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveTab("android")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "android"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base">🤖</span>
              <span>Android (File APK)</span>
            </button>
            <button
              onClick={() => setActiveTab("ios")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "ios"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base">🍏</span>
              <span>iOS (iPhone / iPad)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === "android" ? (
            /* TAB ANDROID */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    File APK Gốc Từ DocTruyen.vip
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Dung lượng siêu nhẹ ~6.1 MB, an toàn 100%, không virus, tối ưu tải truyện 4K cực mượt.
                  </p>
                </div>
              </div>

              {/* Download CTA Button */}
              <a
                href="https://media.doctruyen.vip/DocTruyen-VIP.apk"
                download="DocTruyen-VIP.apk"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Tải File APK Ngay (Miễn Phí)</span>
              </a>

              {/* 3 Steps Guide */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3 Bước Cài Đặt Đơn Giản:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p className="text-muted-foreground">
                      Bấm nút <strong>"Tải File APK Ngay"</strong> ở trên và đợi vài giây để máy tải xong file.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="text-muted-foreground">
                      Bấm mở tệp vừa tải. Nếu máy hỏi <em>"Cho phép cài đặt ứng dụng từ nguồn này"</em> $\rightarrow$ Chọn <strong>Cho phép</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p className="text-muted-foreground">
                      Bấm <strong>Cài đặt</strong> $\rightarrow$ Mở App DocTruyen.vip từ màn hình chính để đọc truyện thả ga!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB IOS */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">
                    Cài Đặt Trực Tiếp Trên iPhone & iPad (PWA)
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Không cần máy tính Mac, không cần Jailbreak, mở ra toàn màn hình như ứng dụng App Store!
                  </p>
                </div>
              </div>

              {/* 4 Steps Guide for iOS */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Hướng Dẫn Cài Đặt (Chỉ mất 10 giây):
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div className="text-muted-foreground">
                      Mở trang web <strong>doctruyen.vip</strong> bằng trình duyệt <strong>Safari</strong> trên iPhone/iPad.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span>Bấm vào nút</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border font-bold text-foreground">
                        <Share2 className="w-3.5 h-3.5 text-blue-500 inline" /> Chia sẻ
                      </span>
                      <span>ở thanh công cụ phía dưới màn hình Safari.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span>Cuộn xuống danh sách tùy chọn, bấm</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border font-bold text-foreground">
                        <PlusSquare className="w-3.5 h-3.5 text-rose-500 inline" /> Thêm vào MH chính
                      </span>
                      <span>(Add to Home Screen).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      4
                    </span>
                    <div className="text-muted-foreground">
                      Bấm nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Logo DocTruyen sẽ xuất hiện trên màn hình điện thoại của bạn!
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy Link Helper */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 px-3 rounded-xl bg-muted hover:bg-muted/80 border border-border/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">Đã sao chép liên kết!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                      <span>Sao chép link doctruyen.vip (để dán vào Safari)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick QR Code for PC users */}
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-4 bg-muted/20 p-3 rounded-2xl border border-border/30">
            <div className="w-16 h-16 bg-white p-1 rounded-xl shadow shrink-0 flex items-center justify-center">
              <img
                src="https://media.doctruyen.vip/qr-tai-app.png"
                alt="QR Code Tải App DocTruyen.vip"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="text-xs">
              <p className="font-bold text-foreground flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-rose-500" />
                <span>Quét mã QR bằng camera điện thoại</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Mở camera trên điện thoại Android hoặc iPhone quét mã để tự động nhận diện thiết bị và tải app ngay.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-muted/30 border-t border-border/40 text-center text-[11px] text-muted-foreground">
          Được bảo mật và phân phối chính thức qua hạ tầng Cloudflare R2 tốc độ cao.
        </div>
      </div>
    </div>
  );
}
