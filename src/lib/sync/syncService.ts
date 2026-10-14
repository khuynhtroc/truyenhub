import { createClient } from "@/lib/supabase/client";

export interface SyncBookmarkItem {
  id: string;
  slug: string;
  title: string;
  cover_url: string;
  author_name: string;
  type: string;
  last_chapter_number?: number;
  last_chapter_id?: string;
  last_chapter?: string | number;
  total_chapters?: number;
  progress_percent?: number;
  updated_at?: string;
}

const STORAGE_KEY_BOOKMARKS = "doctruyen_bookmarks";
const LEGACY_KEY_BOOKMARKS = "truyenhub_bookmarks";
const STORAGE_KEY_HISTORY = "doctruyen_history";

/**
 * Get locally stored bookmarks (supports backward compatibility with legacy key)
 */
export function getLocalBookmarks(): SyncBookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_BOOKMARKS) ||
      localStorage.getItem(LEGACY_KEY_BOOKMARKS) ||
      "[]";
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save bookmarks to localStorage
 */
export function saveLocalBookmarks(items: SyncBookmarkItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(items));
    // Also update legacy key for backward compatibility
    localStorage.setItem(LEGACY_KEY_BOOKMARKS, JSON.stringify(items));
  } catch (_) {}
}

/**
 * Cloud Sync: Syncs user bookmarks & reading history with Supabase database.
 * Merges local and cloud data seamlessly.
 */
export async function syncUserCloudData(userId: string): Promise<SyncBookmarkItem[]> {
  const supabase = createClient();
  const localItems = getLocalBookmarks();

  try {
    // 1. Fetch cloud reading history & bookmarks
    const { data: cloudHistory, error } = await supabase
      .from("reading_history")
      .select(`
        story_id,
        last_chapter_id,
        progress_percent,
        is_bookmarked,
        updated_at,
        stories (
          id,
          title,
          slug,
          cover_url,
          author_name,
          type
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.warn("Could not fetch cloud reading history:", error.message);
      return localItems;
    }

    // 2. Map cloud bookmarks
    const cloudBookmarkMap = new Map<string, SyncBookmarkItem>();
    if (cloudHistory) {
      for (const row of cloudHistory) {
        if (row.is_bookmarked && row.stories) {
          const s: any = row.stories;
          cloudBookmarkMap.set(s.id, {
            id: s.id,
            slug: s.slug,
            title: s.title,
            cover_url: s.cover_url,
            author_name: s.author_name || "Chưa rõ",
            type: s.type,
            last_chapter_id: row.last_chapter_id,
            progress_percent: row.progress_percent || 0,
            updated_at: row.updated_at,
          });
        }
      }
    }

    // 3. Merge: If item exists locally but not in cloud, upload it to cloud
    const toUpload: any[] = [];
    for (const item of localItems) {
      if (item.id && !cloudBookmarkMap.has(item.id)) {
        cloudBookmarkMap.set(item.id, item);
        toUpload.push({
          user_id: userId,
          story_id: item.id,
          is_bookmarked: true,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (toUpload.length > 0) {
      // Asynchronously upsert to cloud without blocking
      supabase
        .from("reading_history")
        .upsert(toUpload, { onConflict: "user_id, story_id" })
        .then(() => {});
    }

    // 4. Update localStorage with full merged list
    const mergedList = Array.from(cloudBookmarkMap.values());
    saveLocalBookmarks(mergedList);
    return mergedList;
  } catch (e) {
    console.warn("Sync error:", e);
    return localItems;
  }
}

/**
 * Toggle bookmark state for a story.
 * Updates both localStorage and cloud (if user is authenticated).
 */
export async function toggleStoryBookmark(
  story: {
    id: string;
    slug: string;
    title: string;
    cover_url: string;
    author_name?: string;
    type: string;
  },
  userId?: string | null
): Promise<boolean> {
  const list = getLocalBookmarks();
  const exists = list.some((i) => i.id === story.id || i.slug === story.slug);
  let nextList: SyncBookmarkItem[];
  let isBookmarked: boolean;

  if (exists) {
    nextList = list.filter((i) => i.id !== story.id && i.slug !== story.slug);
    isBookmarked = false;
  } else {
    nextList = [
      {
        id: story.id,
        slug: story.slug,
        title: story.title,
        cover_url: story.cover_url,
        author_name: story.author_name || "Chưa rõ",
        type: story.type,
        updated_at: new Date().toISOString(),
      },
      ...list,
    ];
    isBookmarked = true;
  }

  saveLocalBookmarks(nextList);

  // Sync to Supabase if logged in
  if (userId) {
    const supabase = createClient();
    supabase
      .from("reading_history")
      .upsert(
        {
          user_id: userId,
          story_id: story.id,
          is_bookmarked: isBookmarked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, story_id" }
      )
      .then(() => {});
  }

  return isBookmarked;
}

/**
 * Record reading progress across web & mobile.
 */
export async function recordReadingProgress(
  storyId: string,
  chapterId: string,
  progressPercent: number = 0,
  userId?: string | null
) {
  if (typeof window === "undefined") return;

  // Local storage history
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY) || "{}";
    const history = JSON.parse(raw);
    history[storyId] = {
      chapterId,
      progressPercent,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (_) {}

  // Sync to cloud if user is logged in
  if (userId) {
    const supabase = createClient();
    supabase
      .from("reading_history")
      .upsert(
        {
          user_id: userId,
          story_id: storyId,
          last_chapter_id: chapterId,
          progress_percent: Math.min(100, Math.max(0, Math.round(progressPercent))),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, story_id" }
      )
      .then(() => {});
  }
}
