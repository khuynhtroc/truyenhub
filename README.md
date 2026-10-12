# TRUYENHUB - NỀN TẢNG ĐỌC TRUYỆN TRANH & TRUYỆN CHỮ HIỆN ĐẠI

> Kiến trúc Serverless: **GitHub + Vercel + Cloudflare + Supabase**
> Tối ưu hóa cho kho dữ liệu 125GB Truyện tranh + 7GB Truyện chữ, chi phí vận hành 0đ ban đầu.

---

## 🌟 CÁC ĐIỂM CẢI TIẾN VƯỢT TRỘI SO VỚI YEUTRUYEN.VN

1. **Giao diện & Trải nghiệm (Modern App-like UX)**:
   - Thay vì menu cổ điển, hệ thống tích hợp **Bottom Navigation Bar** chuẩn ứng dụng di động trên màn hình điện thoại.
   - Hỗ trợ chế độ nền Sáng / Tối / Warm Sepia chống mỏi mắt.
2. **Trình đọc Truyện Tranh (Comic Reader 4K)**:
   - Chế độ cuộn dọc Webtoon vô tận, tự động co giãn độ rộng ảnh (Fit Width / 80% / 100%).
   - Thanh tiến độ đọc trực quan (% và số trang đã đọc).
   - Chế độ toàn màn hình (Fullscreen) mượt mà.
3. **Trình đọc Truyện Chữ (Novel Reader Đa Năng)**:
   - Tùy biến sâu: Kiểu chữ Serif/Sans-serif, Cỡ chữ từ 14px đến 28px.
   - **Tích hợp giọng đọc AI Audio (Text-to-Speech)** ngay trong trình duyệt hoàn toàn miễn phí.
4. **Phễu Mở Khóa Chương & Nạp Xu (Paywall Freemium)**:
   - Gặp chương VIP: Thay vì chuyển hướng reload trang thô ráp, hệ thống hiển thị **Paywall Modal** làm mờ nền xem thử cực kỳ bắt mắt.
   - Lựa chọn linh hoạt: Mở 1 chương lẻ, Mở combo 10 chương (giảm 10%), Mở trọn bộ (giảm 30%).
   - Nếu thiếu xu: Tự động hiện mã **VietQR ngân hàng** chuyển khoản 3 giây tự động cộng xu.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI LÊN GITHUB & VERCEL

### Bước 1: Khởi tạo Database trên Supabase
1. Đăng ký tài khoản miễn phí tại [supabase.com](https://supabase.com).
2. Tạo một Project mới.
3. Vào mục **SQL Editor**, mở file [`supabase/schema.sql`](./supabase/schema.sql), sao chép toàn bộ nội dung và bấm **Run**.
4. Toàn bộ bảng dữ liệu (`profiles`, `stories`, `chapters`, `unlocked_chapters`, `coin_transactions`) và hàm bảo mật đã được cài đặt tự động.

### Bước 2: Đẩy mã nguồn lên GitHub
Mở Terminal trong thư mục `F:\Antigravity\truyenhub`:
```bash
git add .
git commit -m "feat: complete truyenhub platform"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/truyenhub.git
git push -u origin main
```

### Bước 3: Deploy lên Vercel
1. Vào [vercel.com](https://vercel.com), bấm **Add New...** > **Project**.
2. Chọn kho lưu trữ `truyenhub` từ GitHub vừa push.
3. Thêm các biến môi trường từ Supabase vào mục **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền `*.vercel.app` miễn phí.

### Bước 4: Trỏ Domain qua Cloudflare
1. Trong Vercel: Vào **Settings** > **Domains**, thêm tên miền của bạn (ví dụ: `truyenhub.vn`).
2. Trong Cloudflare: Thêm bản ghi CNAME trỏ về `cname.vercel-dns.com` và bật đám mây màu cam (Proxy ON).

---

## 🛠️ TOOL BÓC TÁCH DỮ LIỆU TỪ Ổ ĐĨA F: VÀ G:

Để tự động bóc tách các file `.epub` (truyện chữ) và thư mục ảnh (truyện tranh) đưa lên hệ thống:
1. Mở file [`scripts/import_local_data.py`](./scripts/import_local_data.py).
2. Điền thông tin Supabase Key và Cloudflare R2 Key.
3. Cài đặt thư viện: `pip install boto3 pillow ebooklib beautifulsoup4 supabase`.
4. Chạy script: `python scripts/import_local_data.py`.
