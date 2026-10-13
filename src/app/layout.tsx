import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
};

export const metadata: Metadata = {
  title: {
    default: "TruyenHub - Nền Tảng Đọc Truyện Tranh & Truyện Chữ Online",
    template: "%s | TruyenHub",
  },
  description:
    "Đọc truyện tranh webtoon full HD và tiểu thuyết truyện chữ phong phú, cập nhật chương mới liên tục mỗi ngày tại TruyenHub. Tốc độ cao, không giật lag.",
  keywords: [
    "đọc truyện",
    "truyện tranh",
    "truyện chữ",
    "manga",
    "webtoon",
    "tiên hiệp",
    "trinh thám",
    "truyen online",
  ],
  authors: [{ name: "TruyenHub Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://truyenhub.vn",
    siteName: "TruyenHub",
    title: "TruyenHub - Nền Tảng Đọc Truyện Tranh & Truyện Chữ Online",
    description:
      "Đọc truyện tranh và tiểu thuyết truyện chữ chất lượng cao, cập nhật chương mới liên tục tại TruyenHub.",
    images: [
      {
        url: "https://pub-996745da873f42adb3c8b53c9ed97e85.r2.dev/covers/dragon-ball-cover.webp",
        width: 1200,
        height: 630,
        alt: "TruyenHub Cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruyenHub - Nền Tảng Đọc Truyện Tranh & Truyện Chữ Online",
    description: "Đọc truyện tranh và truyện chữ trực tuyến tốc độ cao.",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
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
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
