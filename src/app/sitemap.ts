import { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { MOCK_STORIES } from "@/lib/mock-data";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      url: `${baseUrl}/nap-xu`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
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

  return [...staticRoutes, ...storyRoutes];
}

