<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DocTruyen.VIP (truyenhub) Project Rules

## 1. Telegram Notification Bot (truyenvip)
**QUY TẮC BẮT BUỘC**: Riêng trong project `truyenhub` này, mỗi khi thực hiện bất kỳ thay đổi nào (thêm tính năng mới, sửa lỗi, cập nhật cơ sở dữ liệu, sửa giao diện, hoặc triển khai deployment lên Cloudflare Workers / production), AI Agent PHẢI tự động gửi thông báo cập nhật qua bot Telegram `truyenvip`.

### Hướng dẫn thực hiện:
Sau khi hoàn tất thay đổi hoặc triển khai, chạy script:
```bash
python scripts/notify_telegram.py "<Tiêu đề cập nhật ngắn gọn>" "<Chi tiết 1>" "<Chi tiết 2>" ...
```
- Bot Token: cấu hình trong `.env.local` (`TELEGRAM_BOT_TOKEN`)
- Chat ID: cấu hình trong `.env.local` (`TELEGRAM_CHAT_ID=8612893214`)
- Đảm bảo script báo `✓ Đã gửi thông báo Telegram thành công!`.

## 2. Thông tin thanh toán & Ngân hàng
- Ngân hàng mặc định: **VPBank (Ngân hàng Việt Nam Thịnh Vượng)**, VietQR BIN: `970432`, mã: `vpb`
- Số tài khoản: `10011918888`
- Tên thụ hưởng: `mimiclothing`
- Tính năng chuyển khoản hỗ trợ mở ứng dụng ngân hàng tự động (deep link `https://dl.vietqr.io/pay?app=...`) kèm danh sách 21+ ngân hàng và cho phép chỉnh sửa nội dung chuyển khoản linh hoạt.

