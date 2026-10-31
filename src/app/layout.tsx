import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { CapacitorAppHandler } from "@/components/common/CapacitorAppHandler";
import { AppInstallFloatWidget } from "@/components/common/AppInstallFloatWidget";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DocTruyen.vip",
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  metadataBase: new URL("https://www.doctruyen.vip"),
  title: {
    default: "DocTruyen.vip - Đọc Truyện Tranh & Truyện Chữ Online Miễn Phí",
    template: "%s | DocTruyen.vip",
  },
  description:
    "Kho truyện tranh Webtoon, Manga full HD và tiểu thuyết truyện chữ phong phú hàng đầu Việt Nam. Cập nhật chương mới mỗi ngày tại DocTruyen.vip. Đọc mượt mà, hỗ trợ AI đọc truyện tự nhiên.",
  keywords: [
    "đọc truyện",
    "đọc truyện online",
    "doctruyen.vip",
    "truyện tranh",
    "truyện chữ",
    "manga",
    "webtoon",
    "manhwa",
    "tiên hiệp",
    "kiếm hiệp",
    "ngôn tình",
    "thám tử lừng danh conan",
    "one piece",
    "doraemon",
    "thần đồng đất việt",
    "audio truyện",
  ],
  authors: [{ name: "DocTruyen.vip Team", url: "https://doctruyen.vip" }],
  creator: "DocTruyen.vip",
  publisher: "DocTruyen.vip",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://doctruyen.vip",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://doctruyen.vip",
    siteName: "DocTruyen.vip",
    title: "DocTruyen.vip - Đọc Truyện Tranh & Truyện Chữ Online Miễn Phí",
    description:
      "Kho truyện tranh Manga/Webtoon full HD và tiểu thuyết phong phú. Nghe truyện với giọng đọc AI thông minh trên DocTruyen.vip.",
    images: [
      {
        url: "https://media.doctruyen.vip/covers/doraemon-cover.webp",
        width: 1200,
        height: 630,
        alt: "DocTruyen.vip Cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocTruyen.vip - Đọc Truyện Tranh & Truyện Chữ Online Miễn Phí",
    description:
      "Kho truyện tranh và tiểu thuyết truyện chữ phong phú, đọc mượt mà tại DocTruyen.vip.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let customCss = "";
  let customHeadCode = "";
  let customBodyCode = "";
  let customFooterCode = "";

  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site_config")
      .single();
    if (data?.value) {
      customCss = data.value.customCss || "";
      customHeadCode = data.value.customHeadCode || "";
      customBodyCode = data.value.customBodyCode || "";
      customFooterCode = data.value.customFooterCode || "";
    }
  } catch (err) {
    // Graceful fallback if database unavailable during static export
  }

  return (
    <html lang="vi" suppressHydrationWarning className={`${beVietnamPro.variable} h-full antialiased`}>
      <head>
        {/* Custom Head Injected Code & CSS */}
        {customCss && (
          <style id="custom-site-css" dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
        {customHeadCode && (
          <div dangerouslySetInnerHTML={{ __html: customHeadCode }} />
        )}
        {/* Anti-FOUC Dark Mode script: applies dark class before page renders to prevent white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        {/* Google & Multi-Search Favicon Specification */}
        <link rel="icon" type="image/png" sizes="48x48" href="https://www.doctruyen.vip/favicon-48x48.png" />
        <link rel="icon" type="image/x-icon" href="https://www.doctruyen.vip/favicon.ico" />
        <link rel="shortcut icon" href="https://www.doctruyen.vip/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://www.doctruyen.vip/apple-touch-icon.png" />

        {/* JSON-LD Schema.org Structured Data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.doctruyen.vip/#website",
                  "url": "https://www.doctruyen.vip",
                  "name": "DocTruyen.vip",
                  "description":
                    "Nền tảng đọc truyện tranh Webtoon, Manga full HD và tiểu thuyết truyện chữ phong phú",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.doctruyen.vip/kham-pha?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                  "inLanguage": "vi-VN",
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.doctruyen.vip/#organization",
                  "name": "DocTruyen.vip",
                  "url": "https://www.doctruyen.vip",
                  "logo": "https://www.doctruyen.vip/icon-192.png",
                },
              ],
            }),
          }}
        />
        {/* Google Tag Manager (GTM-N7TTTGPL) (Excluded on /admin) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){
if(w.location&&w.location.pathname&&w.location.pathname.startsWith('/admin'))return;
w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N7TTTGPL');`,
          }}
        />

        {/* Google Analytics 4 Multi-Platform Tracking (Excluded on /admin) */}
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                window['ga-disable-G-0CBF77MVXY'] = true;
              } else {
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-0CBF77MVXY';
                document.head.appendChild(s);

                var ua = navigator.userAgent || '';
                var isCapacitor = window.Capacitor !== undefined || /Capacitor/i.test(ua);
                var isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                var isIOSStandalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

                var platformType = 'website';
                if (isCapacitor && /Android/i.test(ua)) {
                  platformType = 'android_app';
                } else if (isCapacitor && isIOSDevice) {
                  platformType = 'ios_app';
                } else if (isIOSDevice && isIOSStandalone) {
                  platformType = 'ios_pwa';
                }

                gtag('config', 'G-0CBF77MVXY', {
                  page_path: window.location.pathname,
                  platform_type: platformType,
                  user_properties: {
                    app_platform: platformType
                  }
                });
              }
            `,
          }}
        />
        {/* Register Service Worker for PWA (iOS & Android) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-150">
        {/* Custom Body Open Injected Code */}
        {customBodyCode && (
          <div dangerouslySetInnerHTML={{ __html: customBodyCode }} />
        )}

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N7TTTGPL"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {children}

        {/* Custom Footer Injected Code */}
        {customFooterCode && (
          <div dangerouslySetInnerHTML={{ __html: customFooterCode }} />
        )}

        {/* Native Capacitor App Handlers (Status bar, Android Back button) */}
        <CapacitorAppHandler />

        {/* Floating App Install Widget for Mobile & Desktop */}
        <AppInstallFloatWidget />

        {/* Global Cookie Consent & Privacy Notice Banner */}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
