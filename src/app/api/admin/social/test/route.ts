import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, config } = body;

    if (platform === "telegram") {
      const { botToken, channelId, message } = config || {};
      if (!botToken || !channelId) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập Bot Token và Channel ID Telegram." },
          { status: 400 }
        );
      }

      const text = message || "🚀 [DocTruyen.vip] Kiểm tra kết nối Telegram Bot tự động thành công!\nHệ thống sẵn sàng gửi thông báo chương mới.";
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      });

      const tgData = await tgRes.json();
      if (!tgData.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Lỗi Telegram: ${tgData.description || "Không thể gửi tin nhắn"} (Mã: ${tgData.error_code})`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã gửi tin nhắn thử nghiệm tới ${channelId} thành công!`,
        result: tgData.result,
      });
    }

    if (platform === "facebook") {
      const { pageId, pageAccessToken } = config || {};
      if (!pageId || !pageAccessToken) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập Page ID và Page Access Token Facebook." },
          { status: 400 }
        );
      }

      // Verify page access token
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=name,category,link&access_token=${pageAccessToken}`
      );
      const fbData = await fbRes.json();

      if (fbData.error) {
        return NextResponse.json(
          {
            success: false,
            error: `Lỗi Facebook Graph API: ${fbData.error.message} (Code: ${fbData.error.code})`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Kết nối thành công Fanpage: "${fbData.name}" (ID: ${fbData.id})!`,
        page: fbData,
      });
    }

    if (platform === "google_indexing") {
      const { serviceAccountKey } = config || {};
      if (!serviceAccountKey) {
        return NextResponse.json(
          { success: false, error: "Vui lòng dán nội dung JSON Service Account của Google." },
          { status: 400 }
        );
      }

      try {
        const parsed = JSON.parse(serviceAccountKey);
        if (!parsed.client_email || !parsed.private_key) {
          return NextResponse.json(
            { success: false, error: "File JSON không hợp lệ (thiếu client_email hoặc private_key)." },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          message: `Cấu hình Google Service Account hợp lệ! Client Email: ${parsed.client_email}`,
        });
      } catch (err: any) {
        return NextResponse.json(
          { success: false, error: "Nội dung JSON Service Account sai định dạng." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: false, error: "Nền tảng không hỗ trợ" }, { status: 400 });
  } catch (error: any) {
    console.error("Test social connection error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý kiểm tra kết nối" },
      { status: 500 }
    );
  }
}
