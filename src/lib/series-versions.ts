import { StoryVersion } from "@/types";

export interface SeriesGroup {
  groupName: string;
  rootSlug: string;
  versions: {
    slug: string;
    version_name: string;
    badge?: string;
  }[];
}

export const MULTI_VERSION_SERIES: SeriesGroup[] = [
  {
    groupName: "Vũ Trụ Doraemon",
    rootSlug: "doraemon-truyen-ngan",
    versions: [
      { slug: "doraemon-truyen-ngan", version_name: "Truyện Ngắn (Kinh Điển)", badge: "45 Tập" },
      { slug: "doraemon-truyen-dai", version_name: "Truyện Dài (Điện Ảnh)", badge: "27 Tập" },
      { slug: "doraemon-bong-chay", version_name: "Doraemon Bóng Chày", badge: "13 Tập" },
      { slug: "doi-quan-doraemon", version_name: "Đội Quân Doraemon", badge: "6 Tập" },
      { slug: "doraemon-lite-edition", version_name: "Doraemon Lite Edition", badge: "45 Tập" },
      { slug: "doraemon-phi-thuyen-thoi-gian", version_name: "Phi Thuyền Thời Gian", badge: "11 Tập" },
    ],
  },
  {
    groupName: "Bác Sĩ Quái Dị (Black Jack)",
    rootSlug: "bac-si-quai-di-ban-moi",
    versions: [
      { slug: "bac-si-quai-di-ban-moi", version_name: "Bản Mới Full (181 Tập)", badge: "181 Tập" },
      { slug: "bac-si-quai-di-kim-dong-2006", version_name: "Bản Kim Đồng 2006 (22 Tập)", badge: "22 Tập" },
    ],
  },
  {
    groupName: "Jindo - Cơn Lốc Sân Cỏ",
    rootSlug: "jindo-1-duong-dan-den-khung-thanh",
    versions: [
      { slug: "jindo-1-duong-dan-den-khung-thanh", version_name: "Phần 1 - Đường Dẫn Đến Khung Thành", badge: "47 Tập" },
      { slug: "jindo-2-con-loc-san-co", version_name: "Phần 2 - Cơn Lốc Sân Cỏ", badge: "26 Tập" },
    ],
  },
  {
    groupName: "Fantasista - Vũ Điệu Sân Cỏ",
    rootSlug: "fantasista-vu-dieu-san-co",
    versions: [
      { slug: "fantasista-vu-dieu-san-co", version_name: "Phần 1 - Vũ Điệu Sân Cỏ", badge: "25 Tập" },
      { slug: "fantasista-stella", version_name: "Phần 2 - Stella", badge: "14 Tập" },
    ],
  },
  {
    groupName: "Vũ Trụ Ô Long Viện",
    rootSlug: "o-long-vien-bo-kinh-dien",
    versions: [
      { slug: "o-long-vien-bo-kinh-dien", version_name: "12 Tập - Bộ Kinh Điển", badge: "12 Tập" },
      { slug: "o-long-vien-linh-vat-song", version_name: "Phần Linh Vật Sống", badge: "43 Tập" },
      { slug: "o-long-vien-sieu-buon-cuoi", version_name: "Phần Siêu Buồn Cười", badge: "10 Tập" },
      { slug: "o-long-vien-tinh-huynh-de", version_name: "Phần Tình Huynh Đệ", badge: "27 Tập" },
    ],
  },
  {
    groupName: "Cô Bé Tinh Nghịch (Asari)",
    rootSlug: "co-be-tinh-nghich",
    versions: [
      { slug: "co-be-tinh-nghich", version_name: "Bản Truyền Thống", badge: "21 Tập" },
      { slug: "co-be-tinh-nghich-asari", version_name: "Bản Asari Full", badge: "29 Tập" },
    ],
  },
  {
    groupName: "One Piece (Đảo Hải Tặc)",
    rootSlug: "onepiece-ban-thuong",
    versions: [
      { slug: "onepiece-ban-thuong", version_name: "Bản Trắng Đen (Bản Thường)", badge: "102 Tập" },
      { slug: "onepiece-color", version_name: "Bản Màu Kỹ Thuật Số (Color)", badge: "24 Tập" },
    ],
  },
  {
    groupName: "Dragon Ball (7 Viên Ngọc Rồng)",
    rootSlug: "dragon-ball",
    versions: [
      { slug: "dragon-ball", version_name: "Bản Trọn Bộ 34 Tập (PDF)", badge: "34 Tập" },
      { slug: "dragon-ball-chap", version_name: "Bản 521 Chap Chi Tiết", badge: "521 Chap" },
    ],
  },
];

/**
 * Tìm group phiên bản cho 1 slug bất kỳ
 */
export function getSeriesGroupForSlug(slug: string): SeriesGroup | null {
  for (const group of MULTI_VERSION_SERIES) {
    if (group.versions.some((v) => v.slug === slug) || group.rootSlug === slug) {
      return group;
    }
  }
  return null;
}
