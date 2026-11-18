import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/tai-khoan/", "/auth/"],
      },
    ],
    sitemap: "https://www.doctruyen.vip/sitemap.xml",
    host: "https://www.doctruyen.vip",
  };
}
