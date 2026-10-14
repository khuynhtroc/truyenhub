"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  getLocalBookmarks, 
  syncUserCloudData, 
  toggleStoryBookmark, 
  recordReadingProgress,
  SyncBookmarkItem 
} from "./syncService";

export function useSyncState() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<SyncBookmarkItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial local load
    setBookmarks(getLocalBookmarks());

    // Check supabase auth
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setIsSyncing(true);
        syncUserCloudData(user.id)
          .then((merged) => setBookmarks(merged))
          .finally(() => setIsSyncing(false));
      }
    });

    // Listen for auth state changes (login / logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        syncUserCloudData(currentUser.id)
          .then((merged) => setBookmarks(merged))
          .finally(() => setIsSyncing(false));
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleToggleBookmark = async (story: {
    id: string;
    slug: string;
    title: string;
    cover_url: string;
    author_name?: string;
    type: string;
  }) => {
    const isBookmarked = await toggleStoryBookmark(story, user?.id);
    setBookmarks(getLocalBookmarks());
    return isBookmarked;
  };

  const handleSaveProgress = (
    storyId: string,
    chapterId: string,
    progressPercent: number = 0
  ) => {
    recordReadingProgress(storyId, chapterId, progressPercent, user?.id);
  };

  const isStoryBookmarked = (storyIdOrSlug: string) => {
    return bookmarks.some((b) => b.id === storyIdOrSlug || b.slug === storyIdOrSlug);
  };

  return {
    user,
    bookmarks,
    isSyncing,
    toggleBookmark: handleToggleBookmark,
    saveProgress: handleSaveProgress,
    isStoryBookmarked,
    refreshBookmarks: () => setBookmarks(getLocalBookmarks()),
  };
}
