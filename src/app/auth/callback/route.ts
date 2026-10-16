import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  if (errorParam) {
    console.error("OAuth Provider Error:", errorParam, errorDesc);
    return NextResponse.redirect(
      `${origin}/?auth_error=1&msg=${encodeURIComponent(errorDesc || errorParam)}`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const targetHost = isLocalEnv
        ? origin
        : forwardedHost
        ? `https://${forwardedHost}`
        : origin;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Đăng nhập thành công | DocTruyen.vip</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #f43f5e; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
  <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
  <h2 style="margin: 0 0 8px;">Đăng Nhập Thành Công!</h2>
  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 16px;">Đang đưa bạn trở lại DocTruyen VIP...</p>
  <a class="btn" href="${targetHost}${next}">Quay lại đọc truyện</a>
  <script>
    try {
      window.location.href = "vip.doctruyen.app://auth/callback";
    } catch (_) {}
    setTimeout(function() {
      window.location.href = "${targetHost}${next}";
    }, 500);
  </script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } else {
      console.error("exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${origin}/?auth_error=1&msg=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
