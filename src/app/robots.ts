import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/tai-khoan/", "/auth/"],
      },
    ],
    sitemap: "https://doctruyen.vip/sitemap.xml",
    host: "https://doctruyen.vip",
  };
}
