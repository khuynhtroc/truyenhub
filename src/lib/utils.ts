import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "k";
  }
  return num.toString();
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export const SITE_CONFIG = {
  name: "DocTruyen.vip",
  domain: "doctruyen.vip",
  url: "https://doctruyen.vip",
  mediaUrl: process.env.NEXT_PUBLIC_R2_DOMAIN || "https://media.doctruyen.vip",
  fallbackR2Url: "https://pub-96c72b024c5547b594279f6245a7a6a5.r2.dev",
  description:
    "Nền tảng đọc truyện tranh Webtoon, Manga full HD và tiểu thuyết truyện chữ phong phú hàng đầu Việt Nam. Cập nhật nhanh nhất tại DocTruyen.vip.",
};

/**
 * Normalizes any R2 / comic / cover image URL to use the custom media domain (https://media.doctruyen.vip).
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return "";
  // Map old default R2 dev URLs to the new media custom domain
  if (url.includes("pub-96c72b024c5547b594279f6245a7a6a5.r2.dev")) {
    return url.replace("https://pub-96c72b024c5547b594279f6245a7a6a5.r2.dev", SITE_CONFIG.mediaUrl);
  }
  if (url.includes("pub-996745da873f42adb3c8b53c9ed97e85.r2.dev")) {
    return url.replace("https://pub-996745da873f42adb3c8b53c9ed97e85.r2.dev", SITE_CONFIG.mediaUrl);
  }
  if (url.startsWith("/comics/") || url.startsWith("/covers/")) {
    return `${SITE_CONFIG.mediaUrl}${url}`;
  }
  return url;
}

