"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download, Sparkles, X } from "lucide-react";
import { AppInstallModal } from "./AppInstallModal";

export function AppInstallFloatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInsideApp, setIsInsideApp] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    // 1. Detect if running inside native Capacitor App or iOS PWA standalone
    const isCapacitor = typeof window !== "undefined" && (
      (window as any).Capacitor !== undefined ||
      /Capacitor/i.test(navigator.userAgent)
    );
    const isStandalone = typeof window !== "undefined" && (
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );

    if (isCapacitor || isStandalone) {
      setIsInsideApp(true);
      return;
    }

    // 2. Detect platform to open the most relevant tab
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDefaultTab("ios");
    } else {
      setDefaultTab("android");
    }
  }, []);

  // Do not show widget if user is already running the App
  if (isInsideApp || isDismissed) {
    return (
      <AppInstallModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultTab={defaultTab}
      />
    );
  }

  return (
    <>
      {/* DESKTOP FLOATING SIDE TAB (Right edge, vertically centered) */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-end group">
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 py-3 pl-3.5 pr-2.5 bg-gradient-to-l from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs rounded-l-2xl shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-x-1 transition-all active:scale-95 border-y border-l border-white/20 backdrop-blur-sm"
          title="Tải App DocTruyen.vip cho Android & iOS"
          aria-label="Tải App Mobile"
        >
          {/* Animated Glowing dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>

          <div className="flex flex-col items-start text-left leading-tight">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 inline" /> Cài Đặt App
            </span>
            <span className="text-xs font-black">Android & iOS</span>
          </div>

          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 ml-1">
            <Smartphone className="w-4 h-4 animate-bounce" />
          </div>
        </button>

        {/* Small dismiss button on desktop hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-foreground bg-card/80 px-1.5 py-0.5 rounded-l mt-1 mr-1 border border-border/40 shadow-sm"
          title="Ẩn thông báo"
        >
          Ẩn
        </button>
      </div>

      {/* MOBILE FLOATING BADGE (Fixed at bottom right, right above BottomNav) */}
      <div className="md:hidden fixed bottom-20 right-3 z-40 flex items-center gap-1">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 active:scale-95 text-white font-black text-[11px] rounded-full shadow-lg shadow-rose-500/30 border border-white/20 animate-pulse backdrop-blur-sm"
          aria-label="Cài App Mobile"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Tải App VIP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center text-[10px] shadow"
          title="Đóng"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Interactive Modal */}
      <AppInstallModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  );
}
