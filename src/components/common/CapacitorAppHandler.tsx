"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function CapacitorAppHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let appListener: any = null;

    const setupCapacitor = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Ensure safe top padding for Xiaomi / Android status bar
        document.documentElement.style.setProperty("--app-safe-top", "38px");
        document.documentElement.classList.add("native-app");

        // Configure native status bar
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#09090b" });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (_) {}

        // Listen for deep link return (e.g. vip.doctruyen.app://auth/callback)
        const { App } = await import("@capacitor/app");
        App.addListener("appUrlOpen", (data: any) => {
          if (data?.url) {
            try {
              const parsed = new URL(data.url);
              const path = parsed.pathname || "/";
              const search = parsed.search || "";
              router.push(path + search);
            } catch (_) {}
          }
        });

        // Configure native Android Back Button
        appListener = await App.addListener("backButton", ({ canGoBack }) => {
          // If a modal or popup is open, close it first
          const modalBackdrop = document.querySelector(".fixed.inset-0");
          if (modalBackdrop) {
            const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
            window.dispatchEvent(escEvent);
            return;
          }

          if (pathname === "/") {
            App.exitApp();
          } else if (canGoBack) {
            window.history.back();
          } else {
            router.push("/");
          }
        });
      } catch (_) {}
    };

    setupCapacitor();

    return () => {
      if (appListener && typeof appListener.remove === "function") {
        appListener.remove();
      }
    };
  }, [pathname, router]);

  return null;
}
