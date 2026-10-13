import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/mock-data";
import { ComicReader } from "@/components/reader/ComicReader";
import { NovelReader } from "@/components/reader/NovelReader";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Story, Chapter } from "@/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const { slug, chapterNumber } = await params;
  const num = parseFloat(chapterNumber);

  let story: Story | null = null;
  let chapters: Chapter[] = [];
  let chapter: Chapter | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: dbStory } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (dbStory) {
      story = dbStory as unknown as Story;
      const { data: dbChapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", story.id)
        .order("chapter_number", { ascending: true });

      if (dbChapters) {
        chapters = dbChapters as unknown as Chapter[];
        chapter = chapters.find((c) => Number(c.chapter_number) === num) || null;
      }
    }
  } catch (error) {
    console.error("Failed to query chapter from Supabase:", error);
  }

  if (!story) {
    story = MOCK_STORIES.find((s) => s.slug === slug) || null;
    if (story) {
      chapters = MOCK_CHAPTERS[slug] || [];
      chapter = chapters.find((c) => c.chapter_number === num) || null;
    }
  }

  if (!story) notFound();

  if (!chapter) {
    // If not found in mock, create a placeholder chapter
    const fallbackChapter = {
      id: `ch-${num}`,
      story_id: story.id,
      chapter_number: num,
      title: `Chương ${num}`,
      is_locked: num > 3,
      price_coins: num > 3 ? 5 : 0,
      content_text: story.type === "novel" ? "Nội dung chương đang được cập nhật..." : null,
      pages_images: story.type === "comic" ? [
        "https://pub-996745da873f42adb3c8b53c9ed97e85.r2.dev/comics/update/6143/page-001-1791627430507987271.webp"
      ] : null,
      created_at: new Date().toISOString(),
    };

    if (story.type === "comic") {
      return <ComicReader story={story} chapter={fallbackChapter} allChapters={chapters} />;
    }
    return <NovelReader story={story} chapter={fallbackChapter} allChapters={chapters} />;
  }

  if (story.type === "comic") {
    return <ComicReader story={story} chapter={chapter} allChapters={chapters} />;
  }

  return <NovelReader story={story} chapter={chapter} allChapters={chapters} />;
}
