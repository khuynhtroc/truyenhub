import { Story } from '@/types';

export interface StoryFaqItem {
  question: string;
  answer: string;
  category?: string;
}

export const MASTER_DOCTRUYEN_FAQS: StoryFaqItem[] = [
  {
    category: 'Đọc truyện & Tính năng',
    question: 'Đọc truyện tranh Manga, Webtoon và tiểu thuyết trên DocTruyen.vip có miễn phí không?',
    answer:
      'Trên DocTruyen.vip, độc giả được đọc hoàn toàn miễn phí hàng ngàn bộ truyện tranh Manga, Manhwa, Webtoon độ phân giải 4K sắc nét và tiểu thuyết truyện chữ chọn lọc. Ngoài ra, hệ thống còn tặng Xu miễn phí mỗi ngày khi điểm danh, đọc chương mới hoặc bình luận để mở khóa các chương VIP sớm nhất.'
  },
  {
    category: 'Đọc truyện & Tính năng',
    question: 'Làm sao để bật tính năng AI đọc truyện tự nhiên (Audio Truyện) trên DocTruyen.vip?',
    answer:
      'Khi mở bất kỳ chương tiểu thuyết hoặc truyện chữ nào trên DocTruyen.vip, bạn chỉ cần bấm vào nút "Nghe Audio AI" trên thanh công cụ đọc truyện. Hệ thống giọng đọc AI tiếng Việt tự nhiên hỗ trợ điều chỉnh tốc độ đọc (0.8x – 2.0x), tự động chuyển chương kế tiếp và phát nền ngay cả khi tắt màn hình điện thoại.'
  },
  {
    category: 'Tác phẩm nổi bật',
    question: 'Những bộ truyện tranh kinh điển nào đang có trọn bộ Full HD trên DocTruyen.vip?',
    answer:
      'DocTruyen.vip sở hữu kho truyện tranh kinh điển trọn bộ Full HD được yêu thích nhất như: Doraemon (Truyện ngắn & Truyện dài), Thám Tử Lừng Danh Conan, Đảo Hải Tặc (One Piece), 7 Viên Ngọc Rồng (Dragon Ball), Jindo – Đường Dẫn Đến Khung Thành, Ô Long Viện, Thần Đồng Đất Việt, Bác Sĩ Quái Dị và Cậu Bé Bút Chì.'
  },
  {
    category: 'Tài khoản & Tủ truyện',
    question: 'Làm thế nào để lưu lịch sử đọc truyện và nhận thông báo khi có chương mới?',
    answer:
      'Độc giả chỉ cần đăng nhập tài khoản trên DocTruyen.vip và bấm nút "Theo Dõi / Lưu Tủ Truyện" tại trang thông tin bộ truyện. Hệ thống sẽ tự động đồng bộ vị trí chương đang đọc dở giữa điện thoại, máy tính bảng và thông báo ngay khi có chương mới hoặc qua kênh Telegram @doctruyenvip_update_bot.'
  },
  {
    category: 'Ứng dụng & Đa nền tảng',
    question: 'Cách cài đặt ứng dụng DocTruyen.vip trên điện thoại Android và iPhone (iOS)?',
    answer:
      'Bạn có thể truy cập trang https://www.doctruyen.vip/tai-app để tải trực tiếp file cài đặt ứng dụng Android (APK) hoặc chọn "Thêm vào Màn hình chính" (Add to Home Screen) trên trình duyệt Safari của iPhone/iPad để trải nghiệm chế độ toàn màn hình mượt mà, không quảng cáo làm phiền.'
  },
  {
    category: 'Điểm thưởng & VIP',
    question: 'Làm sao để nhận Xu miễn phí và nâng cấp tài khoản Độc Giả VIP trên DocTruyen.vip?',
    answer:
      'Độc giả có thể nhận Xu miễn phí mỗi ngày bằng cách điểm danh tại mục Nhiệm Vụ, tham gia bình luận hoặc nhập mã Giftcode khuyến mãi trên nhóm cộng đồng Telegram ĐọcTruyện.VIP. Để mở khóa toàn bộ kho truyện VIP không giới hạn, bạn có thể nạp Xu tự động qua VietQR 24/7 tại trang Nạp Xu.'
  }
];

export function buildContextualFaqsForStory(story: Partial<Story>, chapterCount = 0): StoryFaqItem[] {
  const title = story.title || 'Truyện hay';
  const typeLabel = story.type === 'comic' ? 'truyện tranh' : 'tiểu thuyết truyện chữ';
  const statusLabel = story.status === 'completed' ? 'đã hoàn thành trọn bộ (Full)' : 'đang được cập nhật liên tục';
  const authorName = story.author_name || 'Đang cập nhật';
  const genresText = Array.isArray(story.genres) && story.genres.length > 0 ? story.genres.join(', ') : typeLabel;

  const customFaqs: StoryFaqItem[] = [
    {
      question: `Đọc ${typeLabel} "${title}" trọn bộ chất lượng cao ở đâu?`,
      answer: `Bạn có thể đọc ${typeLabel} "${title}" của tác giả ${authorName} với chất lượng hình ảnh/văn bản sắc nét, tốc độ tải siêu nhanh hoàn toàn miễn phí tại DocTruyen.vip (đường dẫn chính thức: https://www.doctruyen.vip/truyen/${story.slug || ''}).`
    },
    {
      question: `Bộ truyện "${title}" có bao nhiêu chương và đã hoàn thành chưa?`,
      answer: `Hiện tại trên hệ thống DocTruyen.vip, tác phẩm "${title}" thuộc thể loại ${genresText} đã có ${chapterCount || story.total_chapters || 'nhiều'} chương và ở trạng thái ${statusLabel}. Độc giả có thể bấm "Đọc Từ Đầu" hoặc chọn chương bất kỳ trong Mục lục chương.`
    },
    {
      question: `Nội dung chính của bộ truyện "${title}" nói về điều gì?`,
      answer: story.description
        ? story.description.replace(/<[^>]*>/g, '').slice(0, 320).trim() + `... Đọc ngay trọn bộ "${title}" tại DocTruyen.vip.`
        : `"${title}" là một trong những tác phẩm ${typeLabel} hấp dẫn nhất thuộc thể loại ${genresText} trên DocTruyen.vip, thu hút đông đảo độc giả nhờ cốt truyện lôi cuốn và nhân vật đặc sắc.`
    }
  ];

  return [...customFaqs, ...MASTER_DOCTRUYEN_FAQS.slice(0, 3)];
}

