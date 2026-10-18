import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vip.doctruyen.app",
  appName: "DocTruyen.vip",
  webDir: "mobile-dist",
  server: {
    // Points directly to the live production server (https://www.doctruyen.vip)
    // Guarantees real-time sync with web, instant updates without re-submitting to App Store,
    // and full access to Next.js API routes (TTS, Supabase auth, VietQR).
    url: "https://www.doctruyen.vip",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "*.doctruyen.vip",
      "doctruyen.vip",
      "*.supabase.co",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "*.facebook.com",
      "*.m.facebook.com",
      "m.facebook.com"
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#09090b",
    },
  },
};

export default config;
