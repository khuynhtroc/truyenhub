import os
import sys
import re
import json
import time
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
import pypdfium2 as pdfium
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

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
SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

def get_s3():
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{ENV.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=ENV.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=ENV.get("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4", max_pool_connections=30),
        region_name="auto"
    )

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

def upload_buffer_r2(s3, buffer, r2_key, content_type="image/webp"):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=buffer,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable"
    )
    return f"{R2_DOMAIN}/{r2_key}"

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def supabase_upsert(table, records, on_conflict=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if on_conflict:
        url += f"?on_conflict={on_conflict}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
    }
    req = urllib.request.Request(url, data=json.dumps(records).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Supabase upsert error: {e}", flush=True)
        return None

def process_pdf_volume(file_path, chap_num, slug, s3):
    r2_prefix = f"comics/{slug}/chap-{chap_num}"
    pdf = pdfium.PdfDocument(file_path)
    total_pages = len(pdf)
    
    upload_tasks = []
    for page_idx in range(total_pages):
        page = pdf[page_idx]
        w, h = page.get_size()
        scale = min(1.5, 950.0 / w) if w > 0 else 1.0
        pil_image = page.render(scale=scale).to_pil()
        if pil_image.width > 950:
            new_h = int((950 / pil_image.width) * pil_image.height)
            pil_image = pil_image.resize((950, new_h), Image.Resampling.LANCZOS)
        
        buf = BytesIO()
        pil_image.save(buf, "WEBP", quality=70)
        data = buf.getvalue()
        r2_key = f"{r2_prefix}/page-{page_idx+1:03d}.webp"
        upload_tasks.append((data, r2_key))

    # Parallel upload
    page_urls = [None] * len(upload_tasks)
    with ThreadPoolExecutor(max_workers=14) as executor:
        future_to_idx = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            page_urls[idx] = future.result()

    return page_urls

def ingest_pdf_series(series_title, slug, folder_path, s3):
    print(f"\n=========================================================================")
    print(f"📖 BẮT ĐẦU NẠP TRUYỆN: {series_title} (slug: {slug})")
    print(f"   Thư mục: {folder_path}")
    print(f"=========================================================================")

    if not os.path.exists(folder_path):
        print(f"❌ Không tìm thấy thư mục: {folder_path}")
        return

    # 1. Tìm Story ID
    stories = supabase_get(f"stories?slug=eq.{slug}&select=id,title")
    if not stories:
        print(f"❌ Không tìm thấy story trong Supabase với slug: {slug}")
        return
    story_id = stories[0]["id"]
    print(f"✓ Story ID: {story_id}")

    # 2. Quét file PDF
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(".pdf")], key=natural_sort_key)
    print(f"✓ Tìm thấy {len(files)} file PDF.")

    # 3. Lấy các chương đã nạp
    existing = supabase_get(f"chapters?story_id=eq.{story_id}&select=chapter_number")
    existing_nums = {c["chapter_number"] for c in existing}
    print(f"✓ Đã có trong DB: {len(existing_nums)} tập.")

    count = 0
    for idx, fname in enumerate(files, start=1):
        # Extract chapter number
        m = re.search(r'(?:tap[-_\s]*(\d+)|vol[-_\s]*(\d+)|^(\d+))', fname.lower())
        if m:
            c_num = int(m.group(1) or m.group(2) or m.group(3))
        else:
            c_num = idx

        if c_num in existing_nums:
            print(f"[{idx}/{len(files)}] -> Tập {c_num} ({fname}) đã có trong DB, bỏ qua.", flush=True)
            continue

        fpath = os.path.join(folder_path, fname)
        print(f"\n[{idx}/{len(files)}] Đang bóc tách & tải lên Tập {c_num}: {fname}...", flush=True)
        t0 = time.time()
        try:
            page_urls = process_pdf_volume(fpath, c_num, slug, s3)
            clean_name = os.path.splitext(fname)[0]
            rec = {
                "story_id": story_id,
                "chapter_number": c_num,
                "title": f"Tập {c_num} - {clean_name}" if not clean_name.lower().startswith("tập") else clean_name,
                "is_locked": c_num > 3,
                "price_coins": 10 if c_num > 3 else 0,
                "pages_images": json.dumps(page_urls)
            }
            supabase_upsert("chapters", [rec], on_conflict="story_id,chapter_number")
            dt = time.time() - t0
            print(f"   ✓ Hoàn tất Tập {c_num}: {len(page_urls)} trang lên R2 & Supabase ({dt:.1f}s)!", flush=True)
            count += 1
        except Exception as e:
            print(f"   ✗ Lỗi Tập {c_num}: {e}", flush=True)

    # Cập nhật total chapters
    supabase_upsert("stories", [{"id": story_id, "total_chapters": max(len(files), len(existing_nums) + count)}], on_conflict="id")
    print(f"🎉 Hoàn tất bộ '{series_title}'! Tổng cộng {len(files)} tập.")

def main():
    s3 = get_s3()
    # List of targeted PDF series for Phase 3
    targets = [
        # Trạng Quỳnh
        ("Trạng Quỳnh", "trang-quynh", r"F:\Truyện Tranh\Truyện Tranh\Trạng Quỳnh"),
        # Ô Long Viện
        ("Ô Long Viện - 12 Tập Bộ Kinh Điển", "o-long-vien-bo-kinh-dien", r"F:\Truyện Tranh\Truyện Tranh\Ô Long Viện\12 Tập-Bộ Kinh Điển"),
        ("Ô Long Viện - Siêu Buồn Cười", "o-long-vien-sieu-buon-cuoi", r"F:\Truyện Tranh\Truyện Tranh\Ô Long Viện\phần Siêu Buồn Cười-Bản PDF"),
        ("Ô Long Viện - Tình Huynh Đệ", "o-long-vien-tinh-huynh-de", r"F:\Truyện Tranh\Truyện Tranh\Ô Long Viện\phần Tình Huynh Đệ-Bản PDF"),
        ("Ô Long Viện - Linh Vật Sống", "o-long-vien-linh-vat-song", r"F:\Truyện Tranh\Truyện Tranh\Ô Long Viện\phần Linh Vật Sống-Bản PDF"),
        # Doraemon
        ("Doraemon Truyện Dài", "doraemon-truyen-dai", r"F:\Truyện Tranh\Truyện Tranh\Doraemon\Doraemon Truyện Dài"),
        ("Doraemon Truyện Ngắn", "doraemon-truyen-ngan", r"F:\Truyện Tranh\Truyện Tranh\Doraemon\Doraemon Truyện Ngắn"),
        ("Đội Quân Doraemon", "doi-quan-doraemon", r"F:\Truyện Tranh\Truyện Tranh\Doraemon\Doraemon Quân Đội"),
        ("Doraemon Lite Edition", "doraemon-lite-edition", r"F:\Truyện Tranh\Truyện Tranh\Doraemon\Doraemon Lite"),
        # Jindo & Fantasista
        ("Jindo 1 - Đường Dẫn Đến Khung Thành", "jindo-1-duong-dan-den-khung-thanh", r"F:\Truyện Tranh\Truyện Tranh\Jindo - Cơn Lốc Sân Cỏ\Jindo 1 - Cơn Lốc Sân Cỏ"),
        ("Jindo 2 - Cơn Lốc Sân Cỏ", "jindo-2-con-loc-san-co", r"F:\Truyện Tranh\Truyện Tranh\Jindo - Cơn Lốc Sân Cỏ\Jindo 2 - Cơn Lốc Sân Cỏ"),
        ("Fantasista 1 - Vũ Điệu Sân Cỏ", "fantasista-vu-dieu-san-co", r"F:\Truyện Tranh\Truyện Tranh\Fantasista - Vũ Điệu Sân Cỏ\Fantasista 1 - Vũ Điệu Sân Cỏ"),
        # Bác Sĩ Quái Dị
        ("Bác Sĩ Quái Dị (Kim Đồng 2006)", "bac-si-quai-di-kim-dong-2006", r"F:\Truyện Tranh\Truyện Tranh\Bác Sĩ Quái Dị\Version Cũ - Bác Sĩ Quái Dị - Kim Đồng 2006"),
    ]

    for title, slug, path in targets:
        ingest_pdf_series(title, slug, path, s3)

if __name__ == "__main__":
    main()
