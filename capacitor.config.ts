import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vip.doctruyen.app",
  appName: "DocTruyen.vip",
  webDir: "public",
  server: {
    // Points directly to the live production server (https://doctruyen.vip)
    // Guarantees real-time sync with web, instant updates without re-submitting to App Store,
    // and full access to Next.js API routes (TTS, Supabase auth, VietQR).
    url: "https://doctruyen.vip",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090b",
    },
  },
};

export default config;
