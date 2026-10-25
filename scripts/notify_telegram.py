import os
import sys
import json
import urllib.request
from datetime import datetime

# Configure UTF-8 for console output on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_env(env_path):
    env = {}
    if not os.path.exists(env_path):
        return env
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"\'')
    return env

def send_telegram_update(title, details, tags=None):
    # Find .env.local
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.abspath(os.path.join(current_dir, '..'))
    env_file = os.path.join(project_dir, '.env.local')
    env = load_env(env_file)

    token = env.get('TELEGRAM_BOT_TOKEN', '8602790652:AAFnwuorZgo0D75VMCzOFObSjlNbUZKk08I')
    chat_id = env.get('TELEGRAM_CHAT_ID', '8612893214')

    now_str = datetime.now().strftime('%H:%M:%S - %d/%m/%Y')
    
    msg_lines = [
        f"🚀 <b>[DocTruyen.vip] CẬP NHẬT HỆ THỐNG MỚI</b>",
        f"⏱ <i>Thời gian: {now_str}</i>",
        f"━━━━━━━━━━━━━━━━━━",
        f"📌 <b>Nội dung cập nhật:</b>",
        f"<b>{title}</b>\n",
    ]

    if isinstance(details, list):
        for item in details:
            msg_lines.append(f"• {item}")
    else:
        msg_lines.append(str(details))

    msg_lines.append(f"\n━━━━━━━━━━━━━━━━━━")
    msg_lines.append(f"🌐 <i>Website: https://doctruyen.vip</i>")
    if tags:
        msg_lines.append(f"🏷 {tags}")
    else:
        msg_lines.append(f"🏷 #doctruyenvip #update #deployment")

    text = "\n".join(msg_lines)

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok"):
                print("✓ Đã gửi thông báo Telegram thành công!")
                return True
            else:
                print("X Lỗi gửi Telegram:", data)
                return False
    except Exception as e:
        print("X Ngoại lệ khi gửi Telegram:", e)
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        title = sys.argv[1]
        details = sys.argv[2:] if len(sys.argv) > 2 else ["Hệ thống đã cập nhật thành công."]
        send_telegram_update(title, details)
    else:
        # Default report of latest changes
        send_telegram_update(
            "Đổi thông tin nhận tiền VPBank & Thêm tính năng Chuyển khoản nhảy App ngân hàng",
            [
                "<b>Cập nhật thông tin nhận tiền:</b> VP Bank (VPBank) - STK: <code>10011918888</code> - Chủ TK: <code>mimiclothing</code>.",
                "<b>Thêm nút Chuyển khoản qua App:</b> Tự động điền STK, số tiền và nội dung vào app ngân hàng khi bấm.",
                "<b>Bộ chọn ngân hàng kiểu Zalo (Bank Picker):</b> Hỗ trợ 21+ ngân hàng (VCB, MB, Techcombank, VPBank, BIDV, ACB, TPBank...).",
                "<b>Chỉnh sửa nội dung chuyển khoản:</b> Cho phép giữ nguyên hoặc sửa lời nhắn linh hoạt với mã QR cập nhật thời gian thực.",
                "<b>Triển khai thành công:</b> Đã đồng bộ lên Cloudflare Workers (doctruyen.vip) và CSDL Supabase."
            ]
        )
