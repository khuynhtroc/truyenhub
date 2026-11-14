import { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { MOCK_STORIES } from "@/lib/mock-data";

export const revalidate = 3600; // Revalidate sitemap every hour

const gSitemap = globalThis as any;
const SITEMAP_TTL_MS = 30 * 60 * 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (gSitemap.__sitemapCache && Date.now() - gSitemap.__sitemapCache.ts < SITEMAP_TTL_MS) {
    return gSitemap.__sitemapCache.data;
  }
  const baseUrl = "https://doctruyen.vip";

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
      url: `${baseUrl}/kham-pha?type=comic`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kham-pha?type=novel`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tu-truyen`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
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

  // Fallback to MOCK_STORIES if DB is empty/fails
  if (storyRoutes.length === 0) {
    storyRoutes = MOCK_STORIES.map((story) => ({
      url: `${baseUrl}/truyen/${story.slug}`,
      lastModified: new Date(story.updated_at),
      changeFrequency: "daily",
      priority: 0.9,
    }));
  }

  const result = [...staticRoutes, ...storyRoutes];
  gSitemap.__sitemapCache = { data: result, ts: Date.now() };
  return result;
}

