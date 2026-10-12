export type StoryType = "comic" | "novel";

export interface Story {
  id: string;
  title: string;
  slug: string;
  type: StoryType;
  description: string;
  cover_url: string;
  author_name: string;
  status: "ongoing" | "completed";
  genres: string[];
  total_views: number;
  total_likes: number;
  total_chapters: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  is_locked: boolean;
  price_coins: number;
  content_text?: string | null; // For novel
  pages_images?: string[] | null; // For comic
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  coins_balance: number;
  vip_until?: string | null;
  vip_level: number;
}

export interface ReadingProgress {
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  progress_percent: number;
  updated_at: string;
}
