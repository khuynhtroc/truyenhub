/**
 * DocTruyen.vip - VIP Classification, Tiers, Perks & Reading Rights System
 */

export interface VipTierInfo {
  level: number;
  id: string;
  name: string;
  title: string;
  badge: string;
  iconName: string;
  colorHex: string;
  gradientClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  minSpending: number; // Tích lũy tối thiểu (VNĐ)
  conditionDesc: string;
  maxFreeChapterCoins: number; // Chapters with price_coins <= this are free for this VIP
  perks: string[];
  readingRights: string[];
}

export const VIP_TIERS: Record<number, VipTierInfo> = {
  0: {
    level: 0,
    id: "free",
    name: "Độc Giả Thường",
    title: "Thành Viên Cơ Bản",
    badge: "Free",
    iconName: "User",
    colorHex: "#94a3b8",
    gradientClass: "from-slate-500/10 to-slate-600/5",
    borderClass: "border-slate-500/30",
    textClass: "text-slate-400",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    minSpending: 0,
    conditionDesc: "Đăng ký tài khoản miễn phí",
    maxFreeChapterCoins: 0,
    perks: [
      "Đọc tất cả các chương truyện miễn phí",
      "Lưu tủ truyện & lịch sử đọc đồng bộ đám mây",
      "Bình luận, đánh giá, tương tác cộng đồng",
      "Điểm danh nhận xu tích lũy mỗi ngày",
    ],
    readingRights: [
      "Đọc tất cả các chương truyện tranh & truyện chữ miễn phí (0 Xu)",
      "Không bao gồm các chương trả phí hoặc truyện độc quyền VIP",
      "Giọng đọc AI Google tiêu chuẩn (có giới hạn)",
    ],
  },
  1: {
    level: 1,
    id: "bronze",
    name: "VIP Đồng",
    title: "Độc Giả Khám Phá",
    badge: "VIP 1",
    iconName: "Award",
    colorHex: "#cd7f32",
    gradientClass: "from-amber-700/20 via-amber-800/10 to-transparent",
    borderClass: "border-amber-700/40",
    textClass: "text-amber-600 dark:text-amber-500",
    badgeClass: "bg-amber-700/15 text-amber-600 dark:text-amber-400 border-amber-700/30",
    minSpending: 50000,
    conditionDesc: "Tích lũy nạp từ 50.000đ hoặc mua gói VIP Tuần (29.000đ / 30 Xu) hoặc nhập Code Give Away",
    maxFreeChapterCoins: 5,
    perks: [
      "Đọc MIỄN PHÍ toàn bộ chương VIP Cấp 1 (đến 5 Xu/chương)",
      "Tặng thêm 5 lượt đọc chương trả phí cao cấp mỗi ngày",
      "Trải nghiệm đọc sạch sẽ, tắt toàn bộ banner & popup quảng cáo",
      "Huy hiệu Đồng (VIP 1) nổi bật trong bình luận",
    ],
    readingRights: [
      "Miễn phí toàn bộ chương truyện chữ & truyện tranh VIP Cấp 1 (giá ≤ 5 Xu)",
      "Tặng 5 vé đọc chương VIP Cấp cao bất kỳ trong ngày",
      "Tốc độ tải ảnh truyện tranh máy chủ siêu tốc CDN",
    ],
  },
  2: {
    level: 2,
    id: "silver",
    name: "VIP Bạc",
    title: "Độc Giả Thân Thiết",
    badge: "VIP 2",
    iconName: "ShieldCheck",
    colorHex: "#94a3b8",
    gradientClass: "from-slate-300/20 via-cyan-500/10 to-transparent",
    borderClass: "border-cyan-500/40",
    textClass: "text-cyan-600 dark:text-cyan-400",
    badgeClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30",
    minSpending: 150000,
    conditionDesc: "Tích lũy nạp từ 150.000đ hoặc mua gói VIP Tháng (79.000đ / 80 Xu) hoặc nhận Give Away VIP Bạc",
    maxFreeChapterCoins: 10,
    perks: [
      "Đọc KHÔNG GIỚI HẠN toàn bộ chương VIP Cấp 1 & Cấp 2 (đến 10 Xu/chương)",
      "Đọc sớm trước 2 chương các bộ truyện tranh & tiểu thuyết hot nhất",
      "Mở khóa TOÀN BỘ 15 giọng đọc AI cao cấp Neural Edge (Hoài My, Nam Minh, Vân Hi...)",
      "Giảm 20% giá Xu khi mở khóa trọn bộ tác phẩm",
      "Huy hiệu VIP Bạc lấp lánh và nổi bật",
    ],
    readingRights: [
      "Đọc không giới hạn toàn bộ truyện tranh & tiểu thuyết VIP 1 & 2 (giá ≤ 10 Xu)",
      "Đọc trước độc quyền 2 chương vừa ra mắt",
      "Nghe Audio AI toàn bộ tác phẩm truyện chữ chất lượng cao",
    ],
  },
  3: {
    level: 3,
    id: "gold",
    name: "VIP Vàng",
    title: "Độc Giả Tinh Anh",
    badge: "VIP 3",
    iconName: "Crown",
    colorHex: "#f59e0b",
    gradientClass: "from-amber-400/25 via-yellow-500/15 to-amber-600/10",
    borderClass: "border-amber-400/50 shadow-amber-500/10 shadow-lg",
    textClass: "text-amber-500 dark:text-amber-400",
    badgeClass: "bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30",
    minSpending: 300000,
    conditionDesc: "Tích lũy nạp từ 300.000đ hoặc mua gói VIP Quý 3 Tháng (199.000đ / 200 Xu) hoặc Give Away VIP Vàng",
    maxFreeChapterCoins: 20,
    perks: [
      "Mở khóa TOÀN BỘ kho truyện tranh màu VIP & Tiểu thuyết hot (đến 20 Xu/chương)",
      "Mở khóa TOÀN BỘ Kho Sách eBook Bản Quyền & Sách Nói Premium",
      "Đọc sớm trước 5 chương so với độc giả thông thường",
      "Nghe Audio AI không giới hạn số lượng chương và tốc độ siêu tốc",
      "Giảm 40% giá Xu trọn bộ",
      "Huy hiệu VIP Vàng Hoàng Gia có viền động tỏa sáng",
    ],
    readingRights: [
      "Đọc thả ga toàn bộ kho sách, tiểu thuyết & truyện tranh VIP (giá ≤ 20 Xu)",
      "Đặc quyền đọc sớm trước 5 chương mới xuất bản",
      "Truy cập toàn bộ kho sách eBook và Sách nói độc quyền DocTruyen.vip",
    ],
  },
  4: {
    level: 4,
    id: "diamond",
    name: "VIP Kim Cương",
    title: "Đặc Quyền Tối Thượng",
    badge: "VIP 4",
    iconName: "Sparkles",
    colorHex: "#a855f7",
    gradientClass: "from-purple-500/30 via-pink-500/20 to-rose-600/15",
    borderClass: "border-purple-500/60 shadow-purple-500/20 shadow-xl ring-2 ring-purple-500/30",
    textClass: "text-purple-500 dark:text-purple-300",
    badgeClass: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 dark:text-pink-300 border-purple-500/50 ring-2 ring-pink-500/20",
    minSpending: 500000,
    conditionDesc: "Tích lũy nạp từ 500.000đ hoặc mua gói VIP Năm (499.000đ / 500 Xu) hoặc Code Give Away Kim Cương",
    maxFreeChapterCoins: 99999,
    perks: [
      "ĐẶC QUYỀN TỐI THƯỢNG: Đọc MỌI truyện tranh, tiểu thuyết, sách eBook, chương độc quyền VIP mới nhất 100% MIỄN PHÍ",
      "Tải trọn bộ offline đọc mượt mà không cần internet",
      "Tặng 200 Xu thưởng mỗi tháng tự động vào tài khoản",
      "Kênh hỗ trợ riêng 1-1 với Admin qua Zalo/Telegram 24/7",
      "Huy hiệu VIP Kim Cương Thần Thoại viền hào quang gradient huyền ảo",
    ],
    readingRights: [
      "Đặc quyền tối cao: Không giới hạn bất kỳ tác phẩm hoặc chương nào trên hệ thống",
      "Đọc trước tất cả các chương độc quyền vừa phát hành",
      "Tải trọn bộ về thiết bị đọc offline mọi lúc mọi nơi",
      "Toàn quyền nghe giọng đọc AI không giới hạn băng thông",
    ],
  },
};

export interface VipPackage {
  id: string;
  name: string;
  tierLevel: number;
  tierName: string;
  durationDays: number;
  durationLabel: string;
  priceVnd: number;
  priceCoins: number;
  discountBadge?: string;
  popular?: boolean;
  description: string;
}

export const VIP_PACKAGES: VipPackage[] = [
  {
    id: "vip1_week",
    name: "VIP Đồng - 7 Ngày",
    tierLevel: 1,
    tierName: "VIP 1 (Đồng)",
    durationDays: 7,
    durationLabel: "7 Ngày (1 Tuần)",
    priceVnd: 29000,
    priceCoins: 30,
    discountBadge: "Trải nghiệm",
    description: "Mở khóa toàn bộ chương VIP Cấp 1, không quảng cáo, tặng 5 chương cao cấp/ngày",
  },
  {
    id: "vip2_month",
    name: "VIP Bạc - 30 Ngày",
    tierLevel: 2,
    tierName: "VIP 2 (Bạc)",
    durationDays: 30,
    durationLabel: "30 Ngày (1 Tháng)",
    priceVnd: 79000,
    priceCoins: 80,
    popular: true,
    discountBadge: "Phổ biến nhất",
    description: "Đọc không giới hạn VIP 1 & 2, mở 15 giọng AI, đọc sớm 2 chương hot, giảm 20% xu",
  },
  {
    id: "vip3_quarter",
    name: "VIP Vàng - 90 Ngày",
    tierLevel: 3,
    tierName: "VIP 3 (Vàng)",
    durationDays: 90,
    durationLabel: "90 Ngày (3 Tháng)",
    priceVnd: 199000,
    priceCoins: 200,
    discountBadge: "Tiết kiệm 20%",
    description: "Mở toàn bộ kho truyện VIP & Sách eBook, đọc sớm 5 chương, nghe AI không giới hạn",
  },
  {
    id: "vip4_year",
    name: "VIP Kim Cương - 365 Ngày",
    tierLevel: 4,
    tierName: "VIP 4 (Kim Cương)",
    durationDays: 365,
    durationLabel: "365 Ngày (1 Năm)",
    priceVnd: 499000,
    priceCoins: 500,
    discountBadge: "Ưu đãi lớn -50%",
    description: "Đặc quyền tối thượng: Đọc MỌI tác phẩm 100% miễn phí, tải offline, tặng 200 xu/tháng, hỗ trợ 1-1",
  },
];

/**
 * Check if a user's VIP membership is currently active
 */
export function isUserVipActive(vipUntil?: string | null): boolean {
  if (!vipUntil) return false;
  return new Date(vipUntil).getTime() > Date.now();
}

/**
 * Get remaining VIP days
 */
export function getRemainingVipDays(vipUntil?: string | null): number {
  if (!vipUntil) return 0;
  const diffMs = new Date(vipUntil).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine the minimum VIP tier required to read a chapter
 */
export function getRequiredVipTierForChapter(priceCoins: number, isLocked: boolean): VipTierInfo {
  if (!isLocked || priceCoins <= 0) {
    return VIP_TIERS[0];
  }
  if (priceCoins <= 5) {
    return VIP_TIERS[1];
  }
  if (priceCoins <= 10) {
    return VIP_TIERS[2];
  }
  if (priceCoins <= 20) {
    return VIP_TIERS[3];
  }
  return VIP_TIERS[4];
}

/**
 * Check whether a user has permission to read a chapter based on their VIP status
 */
export function canUserReadChapter(
  userVipLevel: number,
  vipUntil: string | null | undefined,
  chapterPriceCoins: number,
  isLocked: boolean
): {
  allowed: boolean;
  requiredTier: VipTierInfo;
  userTier: VipTierInfo;
  isVipActive: boolean;
  reason?: string;
} {
  const requiredTier = getRequiredVipTierForChapter(chapterPriceCoins, isLocked);
  const active = isUserVipActive(vipUntil);
  const effectiveLevel = active ? userVipLevel : 0;
  const userTier = VIP_TIERS[effectiveLevel] || VIP_TIERS[0];

  // 1. If chapter is free, always allowed
  if (requiredTier.level === 0) {
    return {
      allowed: true,
      requiredTier,
      userTier,
      isVipActive: active,
      reason: "Chương miễn phí cho tất cả độc giả",
    };
  }

  // 2. If user has active VIP with tier >= required tier
  if (active && userVipLevel >= requiredTier.level) {
    return {
      allowed: true,
      requiredTier,
      userTier,
      isVipActive: true,
      reason: `Đặc quyền ${userTier.name} đã mở khóa miễn phí chương này!`,
    };
  }

  // 3. User does not have sufficient VIP
  return {
    allowed: false,
    requiredTier,
    userTier,
    isVipActive: active,
    reason: active
      ? `Chương này yêu cầu cấp bậc ${requiredTier.name} (cấp hiện tại của bạn: ${userTier.name})`
      : `Chương trả phí. Yêu cầu ${requiredTier.name} hoặc mở khóa bằng ${chapterPriceCoins} Xu`,
  };
}
