import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "site_config";

const DEFAULT_SETTINGS = {
  // Brand & Colors
  primaryColor: "#f43f5e", // Rose 500
  accentColor: "#f59e0b", // Amber 500
  themeMode: "dark",
  logoUrl: "https://media.doctruyen.vip/covers/logo.png",
  faviconUrl: "/favicon.ico",
  siteName: "DocTruyen.vip",
  siteTagline: "Đọc truyện tranh, truyện chữ, sách online đỉnh cao",
  siteDescription:
    "DocTruyen.vip - Kho truyện tranh bản đẹp, truyện chữ chọn lọc và sách hay với giọng đọc AI thông minh, cập nhật liên tục mỗi ngày.",

  // SEO & Schema JSON-LD
  schemaOrganization: {
    name: "DocTruyen.vip",
    url: "https://doctruyen.vip",
    logo: "https://media.doctruyen.vip/covers/logo.png",
    sameAs: [
      "https://facebook.com/doctruyenvip",
      "https://t.me/doctruyenvip",
    ],
  },

  // Frequently Asked Questions
  faqs: [
    {
      id: "faq-1",
      question: "DocTruyen.vip đọc truyện có mất phí không?",
      answer:
        "DocTruyen.vip cung cấp hàng ngàn bộ truyện tranh và truyện chữ hoàn toàn miễn phí. Một số chương VIP đặc biệt có thể mở khóa bằng số xu tích lũy hoặc nạp ủng hộ tác giả.",
    },
    {
      id: "faq-2",
      question: "Làm thế nào để nghe truyện chữ bằng giọng đọc AI?",
      answer:
        "Khi mở bất kỳ chương truyện chữ nào, bạn chỉ cần bấm nút 'Nghe AI' ở thanh điều khiển để hệ thống tự động phát audio giọng đọc truyền cảm với tùy chọn nhiều giọng đọc khác nhau.",
    },
    {
      id: "faq-3",
      question: "Tôi có thể đọc truyện trên điện thoại (Android, iPhone) không?",
      answer:
        "Có! Bạn có thể cài đặt trực tiếp ứng dụng PWA từ trình duyệt điện thoại hoặc tải file cài đặt APK (Android) / TestFlight (iOS) để đọc mượt mà và tự động đồng bộ tủ truyện.",
    },
  ],

  // Mobile App Links
  mobileApps: {
    showAppBanner: true,
    androidApkUrl: "https://media.doctruyen.vip/apps/doctruyen-release.apk",
    googlePlayUrl: "",
    iosAppStoreUrl: "",
    iosTestFlightUrl: "",
  },

  // VietQR & Banking Configuration
  banking: {
    bankId: "970422",
    bankName: "MBBank (Ngân Hàng Quân Đội)",
    accountNo: "0388888888",
    accountName: "DOCTRUYENVIP",
    coinRate: 1000, // 1,000 VND = 100 xu
    qrTemplate: "compact2",
  },
};

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Could not load settings from DB, using defaults:", error.message);
    }

    const currentSettings = data?.value ? { ...DEFAULT_SETTINGS, ...data.value } : DEFAULT_SETTINGS;

    return NextResponse.json({
      success: true,
      settings: currentSettings,
    });
  } catch (error: any) {
    console.error("GET admin settings error:", error);
    return NextResponse.json(
      { success: true, settings: DEFAULT_SETTINGS },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.from("settings").upsert({
      key: SETTINGS_KEY,
      value: body,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu toàn bộ cấu hình website thành công!",
      settings: body,
    });
  } catch (error: any) {
    console.error("POST admin settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi lưu cấu hình" },
      { status: 500 }
    );
  }
}
