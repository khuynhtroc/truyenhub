import os
import sys
import json
import zipfile
from io import BytesIO
from PIL import Image
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

os.makedirs(r"F:\Antigravity\truyenhub\src\lib\data", exist_ok=True)

# 1. 13.67 Chapters
print("Extracting 13.67...")
epub_path = r"F:\Truyện Chữ\# Chan Ho Kei\13.67 - Chan Ho Kei & Minh Thu (dịch).epub"
book = epub.read_epub(epub_path)
docs = [it for it in book.get_items() if it.get_type() == ebooklib.ITEM_DOCUMENT]

cases = [
    {"num": 1, "doc_idx": 3, "title": "Chương 1: Đen và Trắng (Năm 2013)", "locked": False, "coins": 0},
    {"num": 2, "doc_idx": 4, "title": "Chương 2: Đạo Nghĩa Giang Hồ (Năm 2003)", "locked": False, "coins": 0},
    {"num": 3, "doc_idx": 5, "title": "Chương 3: Ngày Dài Nhất (Năm 1997)", "locked": False, "coins": 0},
    {"num": 4, "doc_idx": 6, "title": "Chương 4: Cán Cân Themis (Năm 1989)", "locked": True, "coins": 5},
    {"num": 5, "doc_idx": 7, "title": "Chương 5: Borrowed Place (Năm 1977)", "locked": True, "coins": 5},
    {"num": 6, "doc_idx": 8, "title": "Chương 6: Borrowed Time (Năm 1967)", "locked": True, "coins": 5},
    {"num": 7, "doc_idx": 9, "title": "Chương 7: Lời Bạt Của Tác Giả", "locked": False, "coins": 0},
]

chapters_1367 = []
for c in cases:
    item = docs[c["doc_idx"]]
    soup = BeautifulSoup(item.get_content(), "html.parser")
    paras = [p.get_text().strip() for p in soup.find_all(["p", "h1", "h2", "h3"]) if p.get_text().strip()]
    full_text = "\n\n".join(paras)
    chapters_1367.append({
        "id": f"13-67-ch-{c['num']}",
        "story_id": "2",
        "chapter_number": c["num"],
        "title": c["title"],
        "is_locked": c["locked"],
        "price_coins": c["coins"],
        "content_text": full_text,
        "created_at": "2026-02-01T00:00:00Z"
    })

with open(r"F:\Antigravity\truyenhub\src\lib\data\chapters-13-67.json", "w", encoding="utf-8") as f:
    json.dump(chapters_1367, f, ensure_ascii=False, indent=2)
print("Saved chapters-13-67.json!")

# 2. Dragon Ball Chapters (4 Chapters)
print("Extracting Dragon Ball...")
dragon_ball_chapters = []
titles = {
    1: "Chương 1: Bulma và Son Goku",
    2: "Chương 2: Không Có Ngọc Rồng!",
    3: "Chương 3: Cân Đẩu Vân của Quy Lão",
    4: "Chương 4: Ô Long Xuất Hiện (VIP)"
}

for ch in [1, 2, 3, 4]:
    chap_dir = rf"F:\Antigravity\truyenhub\public\comics\dragon-ball\chap-{ch}"
    if os.path.exists(chap_dir):
        pages = [f"/comics/dragon-ball/chap-{ch}/{f}" for f in sorted(os.listdir(chap_dir)) if f.endswith(".webp")]
    else:
        pages = []
    
    dragon_ball_chapters.append({
        "id": f"db-{ch}",
        "story_id": "1",
        "chapter_number": ch,
        "title": titles.get(ch, f"Chương {ch}"),
        "is_locked": ch > 3,
        "price_coins": 5 if ch > 3 else 0,
        "pages_images": pages,
        "created_at": f"2026-01-0{ch}T00:00:00Z"
    })

with open(r"F:\Antigravity\truyenhub\src\lib\data\chapters-dragon-ball.json", "w", encoding="utf-8") as f:
    json.dump(dragon_ball_chapters, f, ensure_ascii=False, indent=2)
print("Saved chapters-dragon-ball.json!")
