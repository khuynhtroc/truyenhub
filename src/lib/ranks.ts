export interface UserRank {
  id: string;
  name: string;
  shortName: string;
  minPoints: number;
  maxPoints?: number;
  badge: string;
  borderClass: string;
  badgeClass: string;
  avatarRingClass: string;
  titleColor: string;
  description: string;
}

export const USER_RANKS: UserRank[] = [
  {
    id: "tap_su",
    name: "Độc Giả Tập Sự",
    shortName: "Tập Sự",
    minPoints: 0,
    maxPoints: 999,
    badge: "🥉",
    borderClass: "border-slate-300 dark:border-slate-700",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
    avatarRingClass: "ring-2 ring-slate-400/50",
    titleColor: "text-slate-600 dark:text-slate-400",
    description: "Bước đầu bước vào thế giới văn học và manga",
  },
  {
    id: "truc_co",
    name: "Trúc Cơ Kỳ · Học Giả",
    shortName: "Trúc Cơ",
    minPoints: 1000,
    maxPoints: 4999,
    badge: "🥈",
    borderClass: "border-cyan-400 dark:border-cyan-500",
    badgeClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 shadow-sm",
    avatarRingClass: "ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]",
    titleColor: "text-cyan-600 dark:text-cyan-400 font-bold",
    description: "Độc giả tích cực, đã xây dựng nền móng đọc truyện vững chắc",
  },
  {
    id: "kim_dan",
    name: "Kim Đan Kỳ · Tinh Anh",
    shortName: "Kim Đan",
    minPoints: 5000,
    maxPoints: 19999,
    badge: "🥇",
    borderClass: "border-amber-400 dark:border-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-600 shadow-sm",
    avatarRingClass: "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]",
    titleColor: "text-amber-600 dark:text-amber-400 font-extrabold",
    description: "Độc giả tinh anh, đam mê và am hiểu sâu sắc các bộ truyện",
  },
  {
    id: "nguyen_anh",
    name: "Nguyên Anh Kỳ · Đại Sư",
    shortName: "Nguyên Anh",
    minPoints: 20000,
    maxPoints: 49999,
    badge: "💎",
    borderClass: "border-purple-400 dark:border-purple-500",
    badgeClass: "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-600 shadow-md",
    avatarRingClass: "ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.7)]",
    titleColor: "text-purple-600 dark:text-purple-400 font-extrabold",
    description: "Bậc thầy đàm đạo, một trong những cây đại thụ của cộng đồng",
  },
  {
    id: "dai_thua",
    name: "Đại Thừa Kỳ · Huyền Thoại",
    shortName: "Đại Thừa",
    minPoints: 50000,
    badge: "👑",
    borderClass: "border-rose-500",
    badgeClass: "bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/50 shadow-md",
    avatarRingClass: "ring-2 ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.9)] animate-pulse",
    titleColor: "text-rose-600 dark:text-rose-400 font-black tracking-wide",
    description: "Huyền thoại sống của DocTruyen.VIP, nhân vật danh trấn giang hồ",
  },
];

export function getUserRank(points: number = 0): UserRank {
  const p = Math.max(0, points);
  for (let i = USER_RANKS.length - 1; i >= 0; i--) {
    if (p >= USER_RANKS[i].minPoints) {
      return USER_RANKS[i];
    }
  }
  return USER_RANKS[0];
}

export function getNextRank(points: number = 0): { nextRank: UserRank | null; pointsNeeded: number; progressPercent: number } {
  const currentRank = getUserRank(points);
  const currentIndex = USER_RANKS.findIndex((r) => r.id === currentRank.id);

  if (currentIndex >= USER_RANKS.length - 1) {
    return { nextRank: null, pointsNeeded: 0, progressPercent: 100 };
  }

  const nextRank = USER_RANKS[currentIndex + 1];
  const range = nextRank.minPoints - currentRank.minPoints;
  const earnedInRange = points - currentRank.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInRange / range) * 100)));
  const pointsNeeded = Math.max(0, nextRank.minPoints - points);

  return { nextRank, pointsNeeded, progressPercent };
}
