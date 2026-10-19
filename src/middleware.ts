import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // 1. Static Next.js chunks, fonts, and CSS: 1 year immutable edge & browser cache
  if (pathname.startsWith("/_next/static/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    response.headers.set("CDN-Cache-Control", "public, max-age=31536000, immutable");
    response.headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
    return response;
  }

  // 2. Public HTML pages: Edge CDN cache with stale-while-revalidate
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
     * - api routes (e.g. /api/...)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!api|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
