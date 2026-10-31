"use client";

import { useEffect } from "react";

interface StoryViewTrackerProps {
  slug: string;
  storyId?: string;
}

export function StoryViewTracker({ slug, storyId }: StoryViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    try {
      const storageKey = `dt_view_${slug}`;
      const lastViewTime = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Debounce tracking: Only 1 view per 5 minutes per session to prevent spamming
      if (lastViewTime && now - parseInt(lastViewTime, 10) < 5 * 60 * 1000) {
        return;
      }

      sessionStorage.setItem(storageKey, now.toString());

      // Send beacon or fetch in background
      fetch("/api/stories/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, storyId }),
        keepalive: true,
      }).catch(() => {
        // Silent catch for background metric
      });
    } catch (_) {
      // Storage unavailable or disabled
    }
  }, [slug, storyId]);

  return null;
}
