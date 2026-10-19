import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Resolves Supabase Facebook authorize URL to the direct Facebook OAuth URL
 * and constructs native mobile app deep links (Android Intent & iOS fb:// scheme).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authUrl = searchParams.get("url");

  if (!authUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    // Follow redirect to obtain the Facebook OAuth dialog URL
    const res = await fetch(authUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          req.headers.get("user-agent") ||
          "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    });

    const location = res.headers.get("location") || "";
    if (!location) {
      // Fallback: return original authUrl
      return NextResponse.json({ fbUrl: authUrl, intentUrl: authUrl, fbAppUrl: authUrl });
    }

    const parsed = new URL(location);
    // Optimize for mobile touch screens
    parsed.searchParams.set("display", "touch");
    parsed.searchParams.set("fbapp_pres", "1");
    const fbUrl = parsed.toString();

    // Android Intent URL targeting native com.facebook.katana with browser fallback
    const intentUrl = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=https;package=com.facebook.katana;S.browser_fallback_url=${encodeURIComponent(
      fbUrl
    )};end`;

    // iOS custom scheme for Facebook app faceweb modal
    const fbAppUrl = `fb://facewebmodal/f?href=${encodeURIComponent(fbUrl)}`;

    return NextResponse.json({
      fbUrl,
      intentUrl,
      fbAppUrl,
    });
  } catch (err: any) {
    console.error("[Facebook Redirect API] Error:", err.message);
    return NextResponse.json({ fbUrl: authUrl, intentUrl: authUrl, fbAppUrl: authUrl });
  }
}
