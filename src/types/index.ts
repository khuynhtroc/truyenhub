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
  versions?: StoryVersion[];
}

export interface StoryVersion {
  id: string;
  title: string;
  slug: string;
  version_name: string;
  total_chapters: number;
  type?: StoryType;
}

export interface Chapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  is_locked: boolean;
  price_coins: number;
  content_text?: string | null; // For novel
  pages_images?: string[] | string | null; // For comic
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

export interface Voucher {
  id: string;
  code: string;
  title: string;
  reward_coins: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_code: string;
  user_id: string;
  user_email?: string;
  reward_coins: number;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD (Vietnam time)
  streak_days: number;
  reward_coins: number;
  created_at: string;
}

