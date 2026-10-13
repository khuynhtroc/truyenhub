import os
import sys
import re
import json
import zipfile
import mimetypes
import urllib.request
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import pypdfium2 as pdfium

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# ========================================================
# CẤU HÌNH ĐƯỜNG DẪN DỮ LIỆU
# ========================================================
NOVEL_ROOT = r"F:\Truyện Chữ"
MANGA_ROOT = r"F:\Truyện Tranh\Truyện Tranh"
PROGRESS_FILE = r"F:\Antigravity\truyenhub\scripts\ingest_progress.json"

def load_env(filepath=r"F:\Antigravity\truyenhub\.env.local"):
    env = {}
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip("\"'")
    return env

ENV = load_env()
R2_BUCKET = ENV.get("R2_BUCKET_NAME", "truyenhub-media")
R2_DOMAIN = ENV.get("R2_PUBLIC_DOMAIN", "https://pub-96c72b024c5547b594279f6245a7a6a5.r2.dev").rstrip("/")
SUPABASE_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL", "https://tvgipyhvvtovgttnyivw.supabase.co").rstrip("/")
SUPABASE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or ENV.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def get_s3():
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{ENV.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=ENV.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=ENV.get("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[áàảãạăắằẳẵặâấầẩẫậ]', 'a', text)
    text = re.sub(r'[éèẻẽẹêếềểễệ]', 'e', text)
    text = re.sub(r'[íìỉĩị]', 'i', text)
    text = re.sub(r'[óòỏõọôốồổỗộơớờởỡợ]', 'o', text)
    text = re.sub(r'[úùủũụưứừửữự]', 'u', text)
    text = re.sub(r'[ýỳỷỹỵ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"novels": {}, "manga": {}}

def save_progress(data):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def upload_buffer_r2(s3, buffer, r2_key, content_type="image/webp"):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=buffer,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable"
    )
    return f"{R2_DOMAIN}/{r2_key}"

def supabase_upsert(table, records):
    """Gửi bản ghi lên Supabase qua PostgREST"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    payload = json.dumps(records).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return None


# ========================================================
# 1. BÓC TÁCH TOÀN BỘ 778 TRUYỆN CHỮ (.EPUB)
# ========================================================
def ingest_novels(limit=None):
    print("\n" + "=" * 65)
    print("📚 BẮT ĐẦU QUÉT VÀ NẠP TRUYỆN CHỮ (F:\\Truyện Chữ)")
    print("=" * 65)

    progress = load_progress()
    epubs = []
    for root, dirs, files in os.walk(NOVEL_ROOT):
        for f in files:
            if f.lower().endswith(".epub"):
                epubs.append(os.path.join(root, f))

    print(f"-> Tìm thấy tổng cộng {len(epubs)} tác phẩm .epub.")
    if limit:
        epubs = epubs[:limit]
        print(f"-> Chế độ giới hạn: Xử lý {limit} cuốn đầu tiên.")

    s3 = get_s3()
    success_count = 0

    for idx, epub_path in enumerate(epubs):
        fname = os.path.basename(epub_path)
        if fname in progress["novels"] and progress["novels"][fname].get("status") == "completed":
            continue

        try:
            book = epub.read_epub(epub_path)
            meta_title = book.get_metadata('DC', 'title')
            title = meta_title[0][0] if meta_title else os.path.splitext(fname)[0]
            meta_creator = book.get_metadata('DC', 'creator')
            author = meta_creator[0][0] if meta_creator else "Đang cập nhật"
            meta_desc = book.get_metadata('DC', 'description')
            desc = meta_desc[0][0] if meta_desc else f"Bộ tiểu thuyết hấp dẫn {title} của tác giả {author}."
            slug = slugify(title)

            # Upload cover nếu có
            cover_url = ""
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_COVER or "cover" in item.get_name().lower():
                    try:
                        img = Image.open(BytesIO(item.get_content()))
                        out_buf = BytesIO()
                        img.save(out_buf, "WEBP", quality=85)
                        r2_cover_key = f"covers/novels/{slug}.webp"
                        cover_url = upload_buffer_r2(s3, out_buf.getvalue(), r2_cover_key)
                        break
                    except Exception:
                        pass

            if not cover_url:
                cover_url = f"{R2_DOMAIN}/covers/13-67-cover.webp"

            # Bóc tách các chương
            chapters = []
            ch_num = 1
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_content(), "html.parser")
                    paras = [p.get_text().strip() for p in soup.find_all("p") if p.get_text().strip()]
                    text = "\n\n".join(paras)
                    if len(text) > 800:
                        h = soup.find(["h1", "h2", "h3"])
                        ch_title = h.get_text().strip() if h else f"Chương {ch_num}"
                        is_locked = ch_num > 3
                        chapters.append({
                            "chapter_number": ch_num,
                            "title": ch_title[:100],
                            "is_locked": is_locked,
                            "price_coins": 5 if is_locked else 0,
                            "content_text": text
                        })
                        ch_num += 1

            # Nạp vào Supabase nếu có bảng
            story_record = {
                "title": title,
                "slug": slug,
                "type": "novel",
                "description": desc[:500],
                "cover_url": cover_url,
                "author_name": author,
                "status": "completed",
                "genres": ["Tiểu thuyết", "Truyện Chữ"],
                "total_chapters": len(chapters)
            }
            res_story = supabase_upsert("stories", [story_record])

            # Nếu lưu thành công vào Supabase, nạp tiếp chapters
            if res_story and len(res_story) > 0:
                story_id = res_story[0]["id"]
                # Cắt mảng chapters thành từng mẩu 20 để insert
                for c_i in range(0, len(chapters), 20):
                    batch_c = []
                    for ch in chapters[c_i:c_i+20]:
                        batch_c.append({
                            "story_id": story_id,
                            "chapter_number": ch["chapter_number"],
                            "title": ch["title"],
                            "is_locked": ch["is_locked"],
                            "price_coins": ch["price_coins"],
                            "content_text": ch["content_text"]
                        })
                    supabase_upsert("chapters", batch_c)

            progress["novels"][fname] = {
                "title": title,
                "author": author,
                "slug": slug,
                "cover_url": cover_url,
                "total_chapters": len(chapters),
                "status": "completed"
            }
            save_progress(progress)
            success_count += 1
            print(f"[{idx+1}/{len(epubs)}] ✓ {title[:35]} ({len(chapters)} chương)")

        except Exception as e:
            print(f"[{idx+1}/{len(epubs)}] ✗ Lỗi {fname}: {e}")

    print(f"\n🎉 Hoàn thành quét truyện chữ: {success_count} tác phẩm đã được nạp!")


# ========================================================
# 2. XỬ LÝ TRUYỆN TRANH (PDF HOẶC ZIP -> WEBP -> R2)
# ========================================================
def ingest_manga_series(series_folder_name, max_chapters=5):
    series_path = os.path.join(MANGA_ROOT, series_folder_name)
    if not os.path.exists(series_path):
        print(f"[!] Không tìm thấy thư mục: {series_path}")
        return

    print(f"\n--- Đang xử lý truyện tranh: {series_folder_name} (Tối đa {max_chapters} tập) ---")
    s3 = get_s3()
    slug = slugify(series_folder_name)
    progress = load_progress()

    # Tìm các file tập / chap (đệ quy để bắt cả các thư mục con như Doraemon, Thần Đồng Đất Việt)
    target_files = []
    for root, dirs, f_list in os.walk(series_path):
        for f in f_list:
            if f.lower().endswith((".pdf", ".zip", ".cbz")):
                target_files.append(os.path.join(root, f))
    
    target_files.sort()
    pdf_count = sum(1 for f in target_files if f.lower().endswith(".pdf"))
    zip_count = len(target_files) - pdf_count
    print(f"-> Tìm thấy {len(target_files)} tập/chương ({pdf_count} PDF, {zip_count} ZIP/CBZ).")

    cover_url = f"{R2_DOMAIN}/covers/{slug}.webp"
    first_cover_extracted = False

    chapters_to_db = []

    for ch_idx, file_path in enumerate(target_files[:max_chapters]):
        file_name = os.path.basename(file_path)
        chap_num = ch_idx + 1
        r2_prefix = f"comics/{slug}/chap-{chap_num}"
        print(f"  + Xử lý Tập {chap_num}: {file_name}")

        page_urls = []

        if file_name.lower().endswith(".pdf"):
            try:
                pdf = pdfium.PdfDocument(file_path)
                for page_idx, page in enumerate(pdf):
                    pil_image = page.render(scale=1.5).to_pil()
                    if pil_image.width > 1080:
                        new_h = int((1080 / pil_image.width) * pil_image.height)
                        pil_image = pil_image.resize((1080, new_h), Image.Resampling.LANCZOS)
                    
                    buf = BytesIO()
                    pil_image.save(buf, "WEBP", quality=80)
                    r2_key = f"{r2_prefix}/page-{page_idx+1:03d}.webp"
                    url = upload_buffer_r2(s3, buf.getvalue(), r2_key)
                    page_urls.append(url)

                    # Lưu trang đầu tiên làm cover truyện nếu chưa có
                    if not first_cover_extracted and ch_idx == 0 and page_idx == 0:
                        c_key = f"covers/{slug}.webp"
                        cover_url = upload_buffer_r2(s3, buf.getvalue(), c_key)
                        first_cover_extracted = True

                print(f"    -> Đã nén & upload {len(page_urls)} trang PDF lên R2.")
            except Exception as e:
                print(f"    -> Lỗi xử lý PDF {file_name}: {e}")

        elif file_name.lower().endswith((".zip", ".cbz")):
            try:
                with zipfile.ZipFile(file_path, "r") as z:
                    imgs = sorted([f for f in z.namelist() if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.startswith('__MACOSX')])
                    for page_idx, img_name in enumerate(imgs):
                        img_data = z.read(img_name)
                        img = Image.open(BytesIO(img_data))
                        if img.width > 1080:
                            new_h = int((1080 / img.width) * img.height)
                            img = img.resize((1080, new_h), Image.Resampling.LANCZOS)
                        
                        buf = BytesIO()
                        img.save(buf, "WEBP", quality=80)
                        r2_key = f"{r2_prefix}/page-{page_idx+1:03d}.webp"
                        url = upload_buffer_r2(s3, buf.getvalue(), r2_key)
                        page_urls.append(url)

                        if not first_cover_extracted and ch_idx == 0 and page_idx == 0:
                            c_key = f"covers/{slug}.webp"
                            cover_url = upload_buffer_r2(s3, buf.getvalue(), c_key)
                            first_cover_extracted = True

                print(f"    -> Đã nén & upload {len(page_urls)} trang ZIP lên R2.")
            except Exception as e:
                print(f"    -> Lỗi xử lý ZIP {file_name}: {e}")

        if page_urls:
            chapters_to_db.append({
                "chapter_number": chap_num,
                "title": f"Tập {chap_num} - {os.path.splitext(file_name)[0]}",
                "is_locked": chap_num > 3,
                "price_coins": 10 if chap_num > 3 else 0,
                "pages_images": page_urls
            })

    # Nạp vào Supabase
    story_record = {
        "title": series_folder_name,
        "slug": slug,
        "type": "comic",
        "description": f"Bộ truyện tranh kinh điển {series_folder_name} được phát hành định dạng full HD trên TruyenHub.",
        "cover_url": cover_url,
        "author_name": "Nhiều tác giả",
        "status": "ongoing",
        "genres": ["Truyện Tranh", "Manga"],
        "total_chapters": len(target_files)
    }
    res_story = supabase_upsert("stories", [story_record])
    if res_story and len(res_story) > 0:
        story_id = res_story[0]["id"]
        for ch in chapters_to_db:
            ch_data = {
                "story_id": story_id,
                "chapter_number": ch["chapter_number"],
                "title": ch["title"],
                "is_locked": ch["is_locked"],
                "price_coins": ch["price_coins"],
                "pages_images": json.dumps(ch["pages_images"])
            }
            supabase_upsert("chapters", [ch_data])

    if "manga" not in progress:
        progress["manga"] = {}
    progress["manga"][series_folder_name] = {
        "title": series_folder_name,
        "slug": slug,
        "cover_url": cover_url,
        "processed_chapters": len(chapters_to_db),
        "total_files": len(target_files),
        "status": "completed"
    }
    save_progress(progress)
    print(f"✓ Hoàn tất bộ truyện: {series_folder_name} ({len(chapters_to_db)} tập đã lên Cloudflare R2)")


def list_all_manga():
    if not os.path.exists(MANGA_ROOT):
        print(f"Không tìm thấy thư mục {MANGA_ROOT}")
        return
    items = sorted(os.listdir(MANGA_ROOT))
    print(f"\n📋 DANH SÁCH {len(items)} BỘ TRUYỆN TRANH TRONG F:\\Truyện Tranh:")
    for idx, name in enumerate(items):
        full = os.path.join(MANGA_ROOT, name)
        if os.path.isdir(full):
            files = []
            for root, dirs, f_list in os.walk(full):
                for f in f_list:
                    if f.lower().endswith(('.pdf', '.zip', '.cbz')):
                        files.append(f)
            print(f"  {idx+1:02d}. {name:<35} ({len(files)} tập)")


if __name__ == "__main__":
    print("=" * 65)
    print("TRUYENHUB BATCH INGESTION ENGINE")
    print("=" * 65)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--novels":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
        ingest_novels(limit=limit)
    elif len(sys.argv) > 1 and sys.argv[1].startswith("--manga="):
        series = sys.argv[1].split("=")[1]
        max_ch = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        ingest_manga_series(series, max_chapters=max_ch)
    elif len(sys.argv) > 1 and sys.argv[1] == "--list-manga":
        list_all_manga()
    else:
        print("\nCách dùng:")
        print("  python scripts/batch_ingest_all.py --list-manga")
        print("  python scripts/batch_ingest_all.py --novels [so_luong]")
        print("  python scripts/batch_ingest_all.py --manga=Conan [so_tap]")
