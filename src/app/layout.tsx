import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CapacitorAppHandler } from "@/components/common/CapacitorAppHandler";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
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
  metadataBase: new URL("https://doctruyen.vip"),
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <head>
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
        {/* JSON-LD Schema.org Structured Data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://doctruyen.vip/#website",
                  "url": "https://doctruyen.vip",
                  "name": "DocTruyen.vip",
                  "description":
                    "Nền tảng đọc truyện tranh Webtoon, Manga full HD và tiểu thuyết truyện chữ phong phú",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://doctruyen.vip/kham-pha?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                  "inLanguage": "vi-VN",
                },
                {
                  "@type": "Organization",
                  "@id": "https://doctruyen.vip/#organization",
                  "name": "DocTruyen.vip",
                  "url": "https://doctruyen.vip",
                },
              ],
            }),
          }}
        />
        {/* Google Tag Manager (GTM-N7TTTGPL) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N7TTTGPL');`,
          }}
        />

        {/* Google Analytics 4 (G-0CBF77MVXY) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-0CBF77MVXY"
        />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0CBF77MVXY', {
                page_path: window.location.pathname,
              });
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

        {/* Native Capacitor App Handlers (Status bar, Android Back button) */}
        <CapacitorAppHandler />

        {/* Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
