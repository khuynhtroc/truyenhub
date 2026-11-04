export type MissionActionType =
  | "share"
  | "like_story"
  | "comment"
  | "like_comment"
  | "read_chapter"
  | "bookmark"
  | "read_time_15"
  | "read_time_30";

export interface MissionDefinition {
  id: MissionActionType;
  title: string;
  description: string;
  reward_coins: number;
  daily_limit: number;
  unit: string;
  actionLabel: string;
  iconName: string;
  badge: string;
  href?: string;
}

export interface DailyMissionLog {
  id: string;
  user_id: string;
  action: MissionActionType;
  date: string; // YYYY-MM-DD
  coins_reward: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export const MISSIONS_KEY = "daily_mission_logs";

export const MISSION_DEFINITIONS: Record<MissionActionType, MissionDefinition> = {
  share: {
    id: "share",
    title: "Chia sẻ với bạn bè",
    description: "Giới thiệu DocTruyen.vip cho bạn bè nhận ngay 100 Point",
    reward_coins: 100,
    daily_limit: 1,
    unit: "lượt",
    actionLabel: "Chia Sẻ Nhận 100 Point",
    iconName: "Share2",
    badge: "Hot Nhất +100 Point",
  },
  comment: {
    id: "comment",
    title: "Bình luận & Thảo luận truyện",
    description: "Viết bình luận, cảm nhận hoặc review chương truyện",
    reward_coins: 15,
    daily_limit: 3,
    unit: "bình luận",
    actionLabel: "Viết Bình Luận",
    iconName: "MessageSquare",
    badge: "+15 Point / lần",
    href: "/kham-pha",
  },
  like_story: {
    id: "like_story",
    title: "Thả tim yêu thích truyện",
    description: "Thả tim ủng hộ tác phẩm truyện tranh hoặc truyện chữ",
    reward_coins: 10,
    daily_limit: 3,
    unit: "lượt thích",
    actionLabel: "Thả Tim Ngay",
    iconName: "Heart",
    badge: "+10 Point / lần",
    href: "/kham-pha",
  },
  like_comment: {
    id: "like_comment",
    title: "Thích bình luận độc giả",
    description: "Thả tim tương tác với các bình luận hay trong cộng đồng",
    reward_coins: 5,
    daily_limit: 3,
    unit: "lượt",
    actionLabel: "Tương Tác",
    iconName: "ThumbsUp",
    badge: "+5 Point / lần",
    href: "/kham-pha",
  },
  read_chapter: {
    id: "read_chapter",
    title: "Đọc chương truyện mới",
    description: "Thưởng thức các chương truyện tranh hoặc tiểu thuyết",
    reward_coins: 10,
    daily_limit: 3,
    unit: "chương",
    actionLabel: "Đọc Truyện",
    iconName: "BookOpen",
    badge: "+10 Point / lần",
    href: "/kham-pha",
  },
  bookmark: {
    id: "bookmark",
    title: "Lưu truyện vào tủ sách",
    description: "Thêm bộ truyện yêu thích vào tủ truyện cá nhân",
    reward_coins: 10,
    daily_limit: 1,
    unit: "truyện",
    actionLabel: "Lưu Tủ Sách",
    iconName: "Bookmark",
    badge: "+10 Point / lần",
    href: "/tu-truyen",
  },
  read_time_15: {
    id: "read_time_15",
    title: "Đọc truyện 15 phút liên tục",
    description: "Duy trì đọc truyện hoặc tiểu thuyết 15 phút nhận Rương Point sơ cấp",
    reward_coins: 30,
    daily_limit: 1,
    unit: "lần",
    actionLabel: "Nhận Rương 15 Phút",
    iconName: "Clock",
    badge: "🎁 +30 Point",
    href: "/kham-pha",
  },
  read_time_30: {
    id: "read_time_30",
    title: "Tu luyện đọc truyện 30 phút",
    description: "Đọc truyện say mê đạt mốc 30 phút mở Rương Point Thượng Phẩm",
    reward_coins: 80,
    daily_limit: 1,
    unit: "lần",
    actionLabel: "Nhận Rương 30 Phút",
    iconName: "Award",
    badge: "🔥 +80 Point",
    href: "/kham-pha",
  },
};

export function getVietnamDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Triggers a mission reward on the client side.
 * Returns null if not logged in or request fails, or data object on success.
 */
export async function recordMissionActivity(
  action: MissionActionType,
  metadata?: Record<string, any>
): Promise<{ success: boolean; already_completed?: boolean; coins_reward?: number; new_balance?: number; message?: string } | null> {
  try {
    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, metadata }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("recordMissionActivity error:", err);
    return null;
  }
}
