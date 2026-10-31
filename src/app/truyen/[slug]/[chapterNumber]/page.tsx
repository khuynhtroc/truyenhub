import type { Metadata } from "next";
import { cache } from "react";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/mock-data";
import { ComicReader } from "@/components/reader/ComicReader";
import { NovelReader } from "@/components/reader/NovelReader";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Story, Chapter } from "@/types";
import { notFound, redirect } from "next/navigation";
import { StoryViewTracker } from "@/components/common/StoryViewTracker";

const SLUG_REDIRECTS: Record<string, string> = {
  "bac-si-quai-di": "bac-si-quai-di-ban-moi",
  "doraemon": "doraemon-truyen-ngan",
  "jindo-con-loc-san-co": "jindo-1-duong-dan-den-khung-thanh",
  "o-long-vien": "o-long-vien-bo-kinh-dien",
  "co-be-tinh-nghich-asari": "co-be-tinh-nghich",
};

export const revalidate = 300;

const getStoryWithChapterMetadata = cache(async (slug: string, num: number) => {
  try {
    const supabase = getPublicSupabase();
    const { data: story } = await supabase
      .from("stories")
      .select("id, title, type, slug, cover_url, author_name, status, genres")
      .eq("slug", slug)
      .maybeSingle();

    if (!story) return { story: null, chapTitle: null };

    const { data: chap } = await supabase
      .from("chapters")
      .select("title")
      .eq("story_id", story.id)
      .eq("chapter_number", num)
      .maybeSingle();

    return {
      story: story as unknown as Story,
      chapTitle: chap?.title || null,
    };
  } catch {
    return { story: null, chapTitle: null };
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}): Promise<Metadata> {
  const { slug, chapterNumber } = await params;
  const num = parseFloat(chapterNumber);
  let storyTitle = "Đọc Truyện";
  let chapTitle = `Chương ${num}`;

  const { story, chapTitle: dbChapTitle } = await getStoryWithChapterMetadata(slug, num);
  if (story) {
    storyTitle = story.title;
    if (dbChapTitle) chapTitle = dbChapTitle;
  }

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
    const { story: dbStory } = await getStoryWithChapterMetadata(slug, num);

    if (dbStory) {
      story = dbStory;
      const supabase = getPublicSupabase();

      // Tải song song danh sách chương nhẹ và nội dung chương hiện tại
      const [chaptersRes, chapterRes] = await Promise.all([
        supabase
          .from("chapters")
          .select("id, story_id, chapter_number, title, is_locked, price_coins, created_at")
          .eq("story_id", dbStory.id)
          .order("chapter_number", { ascending: true }),
        supabase
          .from("chapters")
          .select("*")
          .eq("story_id", dbStory.id)
          .eq("chapter_number", num)
          .maybeSingle(),
      ]);

      if (chaptersRes.data) {
        chapters = chaptersRes.data as Chapter[];
      }

      const dbChapter = chapterRes.data;
      if (dbChapter) {
        let contentText = dbChapter.content_text;

        // If content is offloaded to Cloudflare R2 (content_text is null, empty or 'r2')
        if ((!contentText || contentText === "r2" || contentText.startsWith("r2:")) && dbStory.type !== "comic") {
          try {
            const r2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN || "https://media.doctruyen.vip";
            const r2Url = `${r2Domain}/chapters/${dbStory.id}/${num}.txt`;
            const r2Res = await fetch(r2Url, {
              next: { revalidate: 86400 },
              headers: { "User-Agent": "DocTruyenVip-Server/1.0" },
            });
            if (r2Res.ok) {
              contentText = await r2Res.text();
            }
          } catch (r2Err) {
            console.warn("Fetch chapter from R2 warn:", r2Err);
          }
        }

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
          content_text: contentText,
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

  return (
    <>
      <StoryViewTracker slug={story.slug} storyId={story.id} />
      {story.type === "comic" ? (
        <ComicReader story={story} chapter={chapter} allChapters={chapters} />
      ) : (
        <NovelReader story={story} chapter={chapter} allChapters={chapters} />
      )}
    </>
  );
}
