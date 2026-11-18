import { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const revalidate = 3600; // Revalidate sitemap every hour

const gSitemap = globalThis as any;
const SITEMAP_TTL_MS = 30 * 60 * 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (gSitemap.__sitemapCache && Date.now() - gSitemap.__sitemapCache.ts < SITEMAP_TTL_MS) {
    return gSitemap.__sitemapCache.data;
  }
  const baseUrl = "https://www.doctruyen.vip";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kham-pha`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  let storyRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminSupabaseClient();
    const { data: dbStories } = await supabase
      .from("stories")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (dbStories && dbStories.length > 0) {
      storyRoutes = dbStories.map((story) => ({
        url: `${baseUrl}/truyen/${story.slug}`,
        lastModified: story.updated_at ? new Date(story.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Failed to generate story routes for sitemap:", error);
  }

  // Blog post URLs
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminSupabaseClient();
    const { data: blogPosts } = await supabase
      .from("posts")
      .select("slug, updated_at")
      .eq("type", "blog")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (blogPosts && blogPosts.length > 0) {
      blogRoutes = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to generate blog routes for sitemap:", error);
  }

  const result = [...staticRoutes, ...storyRoutes, ...blogRoutes];
  gSitemap.__sitemapCache = { data: result, ts: Date.now() };
  return result;
}
