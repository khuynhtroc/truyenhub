import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/tai-khoan/"],
      },
    ],
    sitemap: "https://truyenhub.vn/sitemap.xml",
  };
}
