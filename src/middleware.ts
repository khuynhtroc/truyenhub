import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || request.nextUrl.hostname;

  // 1. Redirect apex domain (doctruyen.vip) -> www.doctruyen.vip (HTTP 301 Permanent Redirect)
  if (host === "doctruyen.vip" || host.startsWith("doctruyen.vip:") || request.nextUrl.hostname === "doctruyen.vip") {
    const url = request.nextUrl.clone();
    url.hostname = "www.doctruyen.vip";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Public HTML pages: Edge CDN cache with stale-while-revalidate
  const isPublicPage =
    pathname === "/" ||
    pathname === "/tai-app" ||
    pathname.startsWith("/truyen/") ||
    pathname.startsWith("/kham-pha") ||
    pathname.startsWith("/bang-xep-hang");

  if (request.method === "GET" && isPublicPage) {
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") || c.name.includes("auth-token"));

    if (!hasAuthCookie) {
      const edgeTTL = pathname === "/" ? 120 : 600; // 2 min for homepage, 10 min for stories
      response.headers.set(
        "Cache-Control",
        `public, max-age=60, s-maxage=${edgeTTL}, stale-while-revalidate=600`
      );
      response.headers.set("CDN-Cache-Control", `public, s-maxage=${edgeTTL}`);
      response.headers.set("Cloudflare-CDN-Cache-Control", `public, s-maxage=${edgeTTL}`);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static build files)
     * - _next/image (image optimization files)
     * - metadata and well-known files (favicon, robots, sitemap, manifest)
     * - static files with common extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|apk)$).*)",
  ],
};
