"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X, Check, Settings2, SlidersHorizontal } from "lucide-react";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("dtv_cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("dtv_cookie_consent", "accepted");
      localStorage.setItem("dtv_cookie_analytics", "true");
      localStorage.setItem("dtv_cookie_preferences", "true");

      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "granted",
        });
      }
    } catch {}
    setIsVisible(false);
    setShowSettingsModal(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem("dtv_cookie_consent", "essential");
      localStorage.setItem("dtv_cookie_analytics", "false");
      localStorage.setItem("dtv_cookie_preferences", "false");

      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
    } catch {}
    setIsVisible(false);
    setShowSettingsModal(false);
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem("dtv_cookie_consent", "custom");
      localStorage.setItem("dtv_cookie_analytics", analyticsEnabled ? "true" : "false");
      localStorage.setItem("dtv_cookie_preferences", preferencesEnabled ? "true" : "false");

      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: analyticsEnabled ? "granted" : "denied",
          ad_storage: "denied",
        });
      }
    } catch {}
    setIsVisible(false);
    setShowSettingsModal(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Bottom Bar */}
      <div
        role="dialog"
        aria-label="Thông báo Cookie và Quyền riêng tư"
        className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none transition-all duration-300"
      >
        <div className="max-w-4xl mx-auto bg-neutral-950/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-800 shadow-2xl rounded-2xl p-4 sm:p-5 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-500 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Thông báo Cookie & Quyền Riêng Tư
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Chuẩn GDPR & Meta
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                DocTruyen.vip sử dụng cookie và lưu trữ cục bộ để duy trì phiên đăng nhập, đồng bộ tủ truyện cá nhân và tối ưu hóa trải nghiệm đọc truyện của bạn. Vui lòng xem chi tiết tại{" "}
                <Link
                  href="/chinh-sach-quyen-rieng-tu"
                  className="text-rose-400 hover:text-rose-300 underline font-medium"
                >
                  Chính sách quyền riêng tư
                </Link>{" "}
                và{" "}
                <Link
                  href="/chinh-sach-cookie"
                  className="text-rose-400 hover:text-rose-300 underline font-medium"
                >
                  Chính sách Cookie
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Tùy chỉnh
            </button>
            <button
              onClick={handleAcceptEssential}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 transition-colors"
            >
              Chỉ cần thiết
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Đồng ý tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white">Tùy Chọn Cookie</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Bạn có thể lựa chọn loại cookie cho phép DocTruyen.vip lưu trữ trên thiết bị của bạn.
            </p>

            <div className="flex flex-col gap-3 py-1">
              {/* Essential */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    Cookie Bắt Buộc / Cần Thiết
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-normal">
                      Luôn bật
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Dùng cho xác thực đăng nhập (Google/Facebook), lưu tủ truyện và bảo vệ chống tấn công DDoS.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded mt-1 accent-rose-500 opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Analytics */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white">Cookie Thống Kê & Phân Tích</span>
                  <span className="text-[11px] text-neutral-400">
                    Hỗ trợ Google Analytics đo lường lượt đọc thực tế để xếp hạng truyện thịnh hành.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="rounded mt-1 accent-rose-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Preferences */}
              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white">Cookie Cá Nhân Hóa</span>
                  <span className="text-[11px] text-neutral-400">
                    Ghi nhớ kích cỡ chữ đọc truyện, chế độ giao diện sáng/tối và vị trí trang đọc dở.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesEnabled}
                  onChange={(e) => setPreferencesEnabled(e.target.checked)}
                  className="rounded mt-1 accent-rose-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
              >
                Lưu Tùy Chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
