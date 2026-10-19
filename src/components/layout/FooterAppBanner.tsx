"use client";

import { useState } from "react";
import { Smartphone, Download, Sparkles, QrCode, ArrowRight } from "lucide-react";
import { AppInstallModal } from "@/components/common/AppInstallModal";

export function FooterAppBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTab, setTargetTab] = useState<"android" | "ios">("android");

  const openForPlatform = (tab: "android" | "ios") => {
    setTargetTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <div className="w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-card via-card/90 to-card border border-border/80 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Title & Value Proposition */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 max-w-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Mobile App VIP
                </span>
                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 inline" /> Miễn Phí 100%
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground mt-1">
                Tải Ứng Dụng DocTruyen.vip Cho Điện Thoại
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Đọc truyện tranh full HD và tiểu thuyết cực nhanh, hỗ trợ đọc toàn màn hình, tải chương mượt mà, lưu lịch sử đọc không bao giờ mất.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons & QR Code */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 w-full lg:w-auto">
            {/* Android APK Button */}
            <a
              href="https://media.doctruyen.vip/DocTruyen-VIP.apk"
              download="DocTruyen-VIP.apk"
              className="flex-1 sm:flex-initial flex items-center gap-3 py-3 px-4.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all group"
            >
              <div className="text-2xl">🤖</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  Tải Về Android
                </span>
                <span className="text-xs font-black">File APK (6.1 MB)</span>
              </div>
              <Download className="w-4 h-4 ml-1 opacity-80 group-hover:translate-y-0.5 transition-transform" />
            </a>

            {/* iOS Button */}
            <button
              onClick={() => openForPlatform("ios")}
              className="flex-1 sm:flex-initial flex items-center gap-3 py-3 px-4.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all group"
            >
              <div className="text-2xl">🍏</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                  Dành Cho iPhone
                </span>
                <span className="text-xs font-black">Cài Màn Hình Chính</span>
              </div>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* QR Code thumbnail */}
            <button
              onClick={() => openForPlatform("android")}
              className="hidden sm:flex flex-col items-center justify-center p-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 text-foreground shrink-0 transition-colors"
              title="Quét mã QR tải app"
            >
              <div className="w-11 h-11 bg-white p-0.5 rounded-lg shadow-sm">
                <img
                  src="https://media.doctruyen.vip/qr-tai-app.png"
                  alt="QR Code"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground mt-1 flex items-center gap-0.5">
                <QrCode className="w-2.5 h-2.5" /> Quét mã
              </span>
            </button>
          </div>
        </div>
      </div>

      <AppInstallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={targetTab}
      />
    </>
  );
}
