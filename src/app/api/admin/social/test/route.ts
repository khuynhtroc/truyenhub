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

      const cleanToken = String(pageAccessToken).trim();
      const cleanPageId = String(pageId).trim();

      // 1. Try querying /me (standard for Page Access Tokens)
      let fbRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,link&access_token=${encodeURIComponent(cleanToken)}`,
        { headers: { "User-Agent": "DocTruyenVip/1.0" } }
      );
      let fbData = await fbRes.json();

      // 2. If /me failed, try querying with the specific page ID
      if (fbData.error && cleanPageId) {
        fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${cleanPageId}?fields=id,name,link&access_token=${encodeURIComponent(cleanToken)}`,
          { headers: { "User-Agent": "DocTruyenVip/1.0" } }
        );
        fbData = await fbRes.json();
      }

      if (fbData.error) {
        const code = fbData.error.code;
        const msg = fbData.error.message;

        let guide = `Lỗi Facebook Graph API: ${msg} (Mã lỗi: ${code})`;
        if (code === 1 || code === 190 || code === 100) {
          guide += `\n\n📌 Nguyên nhân: Token bạn nhập không phải là "Page Access Token" hoặc chưa được cấp quyền quản trị Fanpage này.\n\n👉 Cách khắc phục:\n1. Vào Graph API Explorer: https://developers.facebook.com/tools/explorer/\n2. Chọn đúng App của bạn ở góc phải (App ID: 1591946348610071).\n3. Ở ô "User or Page", bấm chọn "Get Page Access Token" (KHÔNG chọn User Token).\n4. Tích chọn Fanpage của bạn và cấp quyền: pages_manage_posts, pages_read_engagement.\n5. Sao chép Page Token dán lại vào ô này.`;
        }

        return NextResponse.json(
          {
            success: false,
            error: guide,
            rawError: fbData.error,
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
