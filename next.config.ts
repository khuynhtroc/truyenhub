import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.doctruyen.vip",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "api.vietqr.io",
      },
      {
        protocol: "https",
        hostname: "img.vietqr.io",
      },
      {
        protocol: "https",
        hostname: "cdn.vietqr.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=120",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=120",
          },
        ],
      },
      {
        source: "/truyen/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=600, stale-while-revalidate=1200",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=600",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=600",
          },
        ],
      },
      {
        source: "/tai-app",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=600, stale-while-revalidate=1200",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=600",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=600",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "doctruyen.vip",
          },
        ],
        destination: "https://www.doctruyen.vip/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
