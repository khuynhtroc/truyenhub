import os
import sys
import re
import json
import zipfile
from io import BytesIO
from PIL import Image
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# ========================================================
# 1. TRÍCH XUẤT 13.67 (TRUYỆN CHỮ) CHUẨN XÁC 100%
# ========================================================
def extract_13_67():
    print("--- 1. Đang trích xuất 13.67 - Chan Ho Kei ---")
    epub_path = r"F:\Truyện Chữ\# Chan Ho Kei\13.67 - Chan Ho Kei & Minh Thu (dịch).epub"
    book = epub.read_epub(epub_path)

    # 1.1 Lưu bìa truyện chuẩn
    cover_dir = r"F:\Antigravity\truyenhub\public\covers"
    os.makedirs(cover_dir, exist_ok=True)
    cover_file = os.path.join(cover_dir, "13-67-cover.webp")
    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_COVER or "cover" in item.get_name().lower():
            try:
                img = Image.open(BytesIO(item.get_content()))
                img.save(cover_file, "WEBP", quality=85)
                print(f"-> Đã lưu ảnh bìa 13.67: {cover_file}")
                break
            except Exception:
                pass

    # 1.2 Trích xuất 6 Đại Vụ Án + Lời Bạt
    # Docs in epub:
    # doc 3 -> Chương 1: 1. Đen và Trắng
    # doc 4 -> Chương 2: 2. Đạo Nghĩa Giang Hồ
    # doc 5 -> Chương 3: 3. Ngày Dài Nhất (The Longest Day)
    # doc 6 -> Chương 4: 4. Cán Cân Themis (The Balance of Themis)
    # doc 7 -> Chương 5: 5. Borrowed Place
    # doc 8 -> Chương 6: 6. Borrowed Time
    # doc 9 -> Chương 7: Lời Bạt Của Chan Ho Kei
    # doc 10,11,12 -> Chương 8: Chú Thích Của Ban Biên Tập

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

    chapters = []
    for c in cases:
        item = docs[c["doc_idx"]]
        soup = BeautifulSoup(item.get_content(), "html.parser")
        paras = [p.get_text().strip() for p in soup.find_all(["p", "h1", "h2", "h3"]) if p.get_text().strip()]
        full_text = "\n\n".join(paras)
        chapters.append({
            "id": f"13-67-ch-{c['num']}",
            "story_id": "2",
            "chapter_number": c["num"],
            "title": c["title"],
            "is_locked": c["locked"],
            "price_coins": c["coins"],
            "content_text": full_text,
            "created_at": "2026-02-01T00:00:00Z"
        })
        print(f"-> Đã bóc tách thành công {c['title']} ({len(full_text):,} ký tự)")

    return chapters


# ========================================================
# 2. TRÍCH XUẤT DRAGON BALL (TRUYỆN TRANH) TỪ CHAP 1 ĐẾN CHAP 4
# ========================================================
def extract_dragon_ball():
    print("\n--- 2. Đang trích xuất Dragon Ball (Chap 1 -> Chap 4) ---")
    base_zip_dir = r"G:\Truyện Tranh\Truyện Tranh\Dragon Ball\JPG_CHAP"
    
    # 2.1 Tạo bìa Dragon Ball chuẩn
    cover_dest = r"F:\Antigravity\truyenhub\public\covers\dragon-ball-cover.webp"
    
    # Chap zip files:
    # 1. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYEN GỐC - CHAP 1...
    # 2. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYEN GỐC - CHAP 2...
    # 3. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYEN GỐC - CHAP 3...
    # 4. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYEN GỐC - CHAP 4...
    
    zip_files_all = os.listdir(base_zip_dir)
    
    def find_zip_for_chap(chap_num):
        pattern = rf"^{chap_num}\.\s*DRAGON BALL.*\.zip$"
        for f in zip_files_all:
            if re.match(pattern, f, re.IGNORECASE):
                return os.path.join(base_zip_dir, f)
        # Fallback
        for f in zip_files_all:
            if f"CHAP {chap_num}_" in f.upper():
                return os.path.join(base_zip_dir, f)
        return None

    comic_chapters = []

    for chap_num in [1, 2, 3, 4]:
        zip_path = find_zip_for_chap(chap_num)
        if not zip_path:
            print(f"[!] Không tìm thấy zip cho chap {chap_num}")
            continue

        print(f"Xử lý Chap {chap_num}: {os.path.basename(zip_path)}")
        out_dir = rf"F:\Antigravity\truyenhub\public\comics\dragon-ball\chap-{chap_num}"
        os.makedirs(out_dir, exist_ok=True)

        pages = []
        with zipfile.ZipFile(zip_path, "r") as z:
            img_names = sorted([
                f for f in z.namelist() 
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.startswith('__MACOSX')
            ])

            for idx, img_name in enumerate(img_names):
                webp_name = f"page-{idx+1:03d}.webp"
                dest_path = os.path.join(out_dir, webp_name)
                
                # Nén nếu chưa tồn tại
                if not os.path.exists(dest_path):
                    raw_data = z.read(img_name)
                    img = Image.open(BytesIO(raw_data))
                    if img.width > 1080:
                        new_h = int((1080 / img.width) * img.height)
                        img = img.resize((1080, new_h), Image.Resampling.LANCZOS)
                    img.save(dest_path, "WEBP", quality=80, method=4)

                    # Lưu trang 1 của chap 1 làm bìa truyện Dragon Ball
                    if chap_num == 1 and idx == 0 and not os.path.exists(cover_dest):
                        img.save(cover_dest, "WEBP", quality=85)
                        print(f"-> Đã tạo ảnh bìa chuẩn Dragon Ball: {cover_dest}")

                pages.append(f"/comics/dragon-ball/chap-{chap_num}/{webp_name}")

        is_locked = chap_num > 3
        titles = {
            1: "Chương 1: Bulma và Son Goku",
            2: "Chương 2: Không Có Ngọc Rồng!",
            3: "Chương 3: Cân Đẩu Vân của Quy Lão",
            4: "Chương 4: Ô Long Xuất Hiện (VIP)"
        }
        comic_chapters.append({
            "id": f"db-{chap_num}",
            "story_id": "1",
            "chapter_number": chap_num,
            "title": titles.get(chap_num, f"Chương {chap_num}"),
            "is_locked": is_locked,
            "price_coins": 5 if is_locked else 0,
            "pages_images": pages,
            "created_at": f"2026-01-0{chap_num}T00:00:00Z"
        })
        print(f"-> Chap {chap_num}: Hoàn tất {len(pages)} trang.")

    # Đảm bảo ảnh bìa Dragon Ball tồn tại
    if os.path.exists(rf"F:\Antigravity\truyenhub\public\comics\dragon-ball\chap-1\page-001.webp"):
        Image.open(rf"F:\Antigravity\truyenhub\public\comics\dragon-ball\chap-1\page-001.webp").save(cover_dest, "WEBP", quality=90)
        print("-> Đã xuất ảnh bìa Dragon Ball vào public/covers/dragon-ball-cover.webp")

    return comic_chapters


# ========================================================
# 3. GHI ĐÈ TRỰC TIẾP VÀO SRC/LIB/MOCK-DATA.TS
# ========================================================
def update_mock_data(novel_chapters, comic_chapters):
    print("\n--- 3. Cập nhật src/lib/mock-data.ts ---")
    mock_file = r"F:\Antigravity\truyenhub\src\lib\mock-data.ts"
    
    # Đọc nội dung hiện tại
    with open(mock_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Cập nhật cover_url của Dragon Ball
    content = re.sub(
        r'(id:\s*"1"[\s\S]*?cover_url:\s*")[^"]+(")',
        r'\1/covers/dragon-ball-cover.webp\2',
        content
    )

    # Cập nhật cover_url của 13.67
    content = re.sub(
        r'(id:\s*"2"[\s\S]*?cover_url:\s*")[^"]+(")',
        r'\1/covers/13-67-cover.webp\2',
        content
    )
    # Cập nhật total_chapters của 13.67 thành 7
    content = re.sub(
        r'(id:\s*"2"[\s\S]*?total_chapters:\s*)\d+,',
        r'\1 7,',
        content
    )

    # Chuẩn bị dữ liệu MOCK_CHAPTERS
    # Chúng ta thay thế toàn bộ khối MOCK_CHAPTERS
    # Lấy các chapter khác như "van-co-kiem-ton" nếu có
    van_co_match = re.search(r'("van-co-kiem-ton":\s*\[[\s\S]*?\])', content)
    van_co_str = van_co_match.group(1) if van_co_match else '"van-co-kiem-ton": []'

    db_json = json.dumps(comic_chapters, ensure_ascii=False, indent=4)
    db_indented = "\n".join("    " + line for line in db_json.split("\n"))

    novel_json = json.dumps(novel_chapters, ensure_ascii=False, indent=4)
    novel_indented = "\n".join("    " + line for line in novel_json.split("\n"))

    new_mock_chapters = f'''export const MOCK_CHAPTERS: Record<string, Chapter[]> = {{
  "dragon-ball": {db_json},
  "13-67-chan-ho-kei": {novel_json},
  {van_co_str}
}};
'''

    # Thay thế phần MOCK_CHAPTERS
    content = re.sub(
        r'export const MOCK_CHAPTERS: Record<string, Chapter\[\]> = \{[\s\S]*?\};\s*$',
        new_mock_chapters,
        content
    )

    with open(mock_file, "w", encoding="utf-8") as f:
        f.write(content)

    print("-> Đã ghi dữ liệu chuẩn vào src/lib/mock-data.ts thành công!")


if __name__ == "__main__":
    novel_chs = extract_13_67()
    comic_chs = extract_dragon_ball()
    update_mock_data(novel_chs, comic_chs)
    print("\n=== HOÀN TẤT TẤT CẢ! NỘI DUNG 2 TRUYỆN ĐÃ CHUẨN XÁC 100% ===")
