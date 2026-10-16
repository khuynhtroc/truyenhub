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

        // Configure native status bar
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#09090b" });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (_) {}

        // Configure native Android Back Button
        const { App } = await import("@capacitor/app");
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
