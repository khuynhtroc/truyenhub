import type { Metadata } from "next";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/mock-data";
import { ComicReader } from "@/components/reader/ComicReader";
import { NovelReader } from "@/components/reader/NovelReader";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Story, Chapter } from "@/types";
import { notFound, redirect } from "next/navigation";

const SLUG_REDIRECTS: Record<string, string> = {
  "bac-si-quai-di": "bac-si-quai-di-ban-moi",
  "doraemon": "doraemon-truyen-ngan",
  "jindo-con-loc-san-co": "jindo-1-duong-dan-den-khung-thanh",
  "o-long-vien": "o-long-vien-bo-kinh-dien",
  "co-be-tinh-nghich-asari": "co-be-tinh-nghich",
};

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}): Promise<Metadata> {
  const { slug, chapterNumber } = await params;
  const num = parseFloat(chapterNumber);
  let storyTitle = "Đọc Truyện";
  let chapTitle = `Chương ${num}`;

  try {
    const supabase = getPublicSupabase();
    const { data: story } = await supabase
      .from("stories")
      .select("id, title")
      .eq("slug", slug)
      .maybeSingle();
    if (story) {
      storyTitle = story.title;
      const { data: chap } = await supabase
        .from("chapters")
        .select("title")
        .eq("story_id", story.id)
        .eq("chapter_number", num)
        .maybeSingle();
      if (chap && chap.title) chapTitle = chap.title;
    }
  } catch (_) {}

  const title = `${chapTitle} - ${storyTitle}`;
  const fullTitle = `${title} | DocTruyen.vip`;
  const description = `Đọc ${chapTitle} bộ truyện ${storyTitle} online chất lượng cao, hình ảnh sắc nét, tốc độ tải siêu tốc tại DocTruyen.vip.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://doctruyen.vip/truyen/${slug}/${chapterNumber}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: `https://doctruyen.vip/truyen/${slug}/${chapterNumber}`,
      siteName: "DocTruyen.vip",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const { slug, chapterNumber } = await params;
  if (SLUG_REDIRECTS[slug]) {
    redirect(`/truyen/${SLUG_REDIRECTS[slug]}/${chapterNumber}`);
  }
  const num = parseFloat(chapterNumber);

  let story: Story | null = null;
  let chapters: Chapter[] = [];
  let chapter: Chapter | null = null;

  try {
    const supabase = getPublicSupabase();
    const { data: dbStory } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (dbStory) {
      story = dbStory as unknown as Story;

      // Lấy danh sách chương nhẹ để điều hướng (không tải text/ảnh nặng của toàn bộ chương)
      const { data: dbChapters } = await supabase
        .from("chapters")
        .select("id, story_id, chapter_number, title, is_locked, price_coins, created_at")
        .eq("story_id", story.id)
        .order("chapter_number", { ascending: true });

      if (dbChapters) {
        chapters = dbChapters as Chapter[];
      }

      // Lấy chi tiết chương hiện tại với nội dung đầy đủ (ảnh hoặc text)
      const { data: dbChapter } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", story.id)
        .eq("chapter_number", num)
        .maybeSingle();

      if (dbChapter) {
        let pages = dbChapter.pages_images;
        if (typeof pages === "string") {
          try {
            pages = JSON.parse(pages);
          } catch {
            pages = [];
          }
        }
        chapter = {
          ...dbChapter,
          pages_images: Array.isArray(pages) ? pages : [],
        } as Chapter;
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
