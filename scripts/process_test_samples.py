import os
import sys
import re
import zipfile
from io import BytesIO
from PIL import Image
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def process_test_novel():
    print("=" * 60)
    print("1. ĐANG XỬ LÝ TRUYỆN CHỮ MẪU TỪ Ổ F: (13.67 - Chan Ho Kei)")
    print("=" * 60)

    epub_path = r"F:\Truyện Chữ\# Chan Ho Kei\13.67 - Chan Ho Kei & Minh Thu (dịch).epub"
    if not os.path.exists(epub_path):
        # Fallback search
        for root, dirs, files in os.walk(r"F:\Truyện Chữ"):
            for f in files:
                if "13.67" in f and f.endswith(".epub"):
                    epub_path = os.path.join(root, f)
                    break
            if os.path.exists(epub_path):
                break

    print(f"Path: {epub_path}")
    book = epub.read_epub(epub_path)

    # Metadata
    title = "13.67 - Vụ Án Thế Kỷ"
    author = "Chan Ho Kei"
    slug = "13-67-chan-ho-kei"

    # Save cover if available
    os.makedirs(r"F:\Antigravity\truyenhub\public\covers", exist_ok=True)
    cover_dest = r"F:\Antigravity\truyenhub\public\covers\13-67-cover.webp"

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_COVER or "cover" in item.get_name().lower():
            try:
                img = Image.open(BytesIO(item.get_content()))
                img.save(cover_dest, "WEBP", quality=85)
                print(f"-> Đã bóc tách bìa truyện: {cover_dest}")
                break
            except Exception as e:
                pass

    chapters = []
    ch_num = 1

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            content_bytes = item.get_content()
            soup = BeautifulSoup(content_bytes, "html.parser")

            # Extract headings
            h = soup.find(["h1", "h2", "h3", "h4"])
            ch_title = h.get_text().strip() if h else f"Chương {ch_num}"

            # Extract paragraphs
            paras = [p.get_text().strip() for p in soup.find_all("p") if p.get_text().strip()]
            full_text = "\n\n".join(paras)

            # Filter out tiny metadata / TOC items
            if len(full_text) > 400:
                is_locked = ch_num > 3
                chapters.append({
                    "id": f"13-67-ch-{ch_num}",
                    "story_id": "2",
                    "chapter_number": ch_num,
                    "title": ch_title if len(ch_title) < 80 else f"Chương {ch_num}",
                    "is_locked": is_locked,
                    "price_coins": 5 if is_locked else 0,
                    "content_text": full_text,
                    "created_at": "2026-10-10T00:00:00Z"
                })
                print(f"   + Bóc tách thành công Chương {ch_num}: {ch_title[:40]}... ({len(full_text):,} ký tự)")
                ch_num += 1

    print(f"-> Tổng số chương truyện chữ trích xuất được: {len(chapters)}")
    return chapters


def process_test_comic():
    print("\n" + "=" * 60)
    print("2. ĐANG XỬ LÝ TRUYỆN TRANH MẪU TỪ Ổ G: (Dragon Ball Chap 1)")
    print("=" * 60)

    candidates = [
        r"F:\Truyện Tranh\Truyện Tranh\Dragon Ball\JPG_CHAP\1. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYÊN GỐC - CHAP 1_DOANH_NAM ĐỊNH.zip",
        r"F:\Truyện Tranh\Dragon Ball\JPG_CHAP\1. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYÊN GỐC - CHAP 1_DOANH_NAM ĐỊNH.zip",
        r"G:\Truyện Tranh\Truyện Tranh\Dragon Ball\JPG_CHAP\1. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYÊN GỐC - CHAP 1_DOANH_NAM ĐỊNH.zip",
        r"G:\Truyện Tranh\Dragon Ball\JPG_CHAP\1. DRAGON BALL BẢN VIP - BẢN ĐẸP NGUYÊN GỐC - CHAP 1_DOANH_NAM ĐỊNH.zip",
    ]
    zip_path = next((p for p in candidates if os.path.exists(p)), candidates[0])
    print(f"Path: {zip_path}")

    out_dir = r"F:\Antigravity\truyenhub\public\comics\dragon-ball\chap-1"
    os.makedirs(out_dir, exist_ok=True)

    page_urls = []

    with zipfile.ZipFile(zip_path, 'r') as z:
        image_files = sorted([
            f for f in z.namelist() 
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.startswith('__MACOSX')
        ])
        print(f"-> Tìm thấy {len(image_files)} trang ảnh gốc trong file ZIP.")

        for idx, img_name in enumerate(image_files):
            img_data = z.read(img_name)
            img = Image.open(BytesIO(img_data))

            # Resize to webtoon friendly width (max 1080px)
            if img.width > 1080:
                new_h = int((1080 / img.width) * img.height)
                img = img.resize((1080, new_h), Image.Resampling.LANCZOS)

            webp_filename = f"page-{idx+1:03d}.webp"
            out_file = os.path.join(out_dir, webp_filename)
            img.save(out_file, "WEBP", quality=80, method=4)

            # Web URL
            rel_url = f"/comics/dragon-ball/chap-1/{webp_filename}"
            page_urls.append(rel_url)

            if (idx + 1) % 5 == 0 or (idx + 1) == len(image_files):
                print(f"   + Đã nén WebP: {idx+1}/{len(image_files)} trang -> {webp_filename}")

    print(f"-> Hoàn tất nén toàn bộ {len(page_urls)} trang ảnh sang WebP vào thư mục public/")
    return page_urls


if __name__ == "__main__":
    novel_chapters = process_test_novel()
    comic_pages = process_test_comic()

    # Save to a local json file for easy verification and import
    summary_path = r"F:\Antigravity\truyenhub\scripts\processed_sample_data.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump({
            "novel_13_67_chapters": novel_chapters,
            "dragon_ball_chap_1_pages": comic_pages
        }, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("HOÀN TẤT THỬ NGHIỆM! Dữ liệu đã lưu tại:")
    print(summary_path)
    print("=" * 60)
