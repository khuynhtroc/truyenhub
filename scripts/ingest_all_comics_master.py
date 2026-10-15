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
SUPABASE_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL", "https://bqvffeqjgjtzprouwshd.supabase.co")
SUPABASE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_s3():
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{ENV.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=ENV.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=ENV.get("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4", max_pool_connections=35),
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
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{endpoint}", headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

def supabase_upsert(table, records, on_conflict=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if on_conflict:
        url += f"?on_conflict={on_conflict}"
    h = {**headers, "Prefer": "return=representation,resolution=merge-duplicates"}
    req = urllib.request.Request(url, data=json.dumps(records).encode("utf-8"), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"   ✗ Supabase upsert error: {e}", flush=True)
        return None

def supabase_patch(endpoint, data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        print(f"   ✗ Supabase patch error: {e}", flush=True)
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

    page_urls = [None] * len(upload_tasks)
    with ThreadPoolExecutor(max_workers=14) as executor:
        future_to_idx = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            page_urls[idx] = future.result()

    return page_urls

def extract_chapter_number(filename, default_idx):
    m = re.search(r'(?:tap[-_\s]*(\d+)|vol[-_\s]*(\d+)|chap[-_\s]*(\d+)|v0*(\d+)|^(\d+))', filename.lower())
    if m:
        for group in m.groups():
            if group is not None:
                return int(group)
    m2 = re.search(r'\d+', filename)
    return int(m2.group(0)) if m2 else default_idx

def ingest_series(series_title, slug, folder_path, s3):
    print(f"\n=========================================================================", flush=True)
    print(f"📖 BẮT ĐẦU: {series_title} ({slug})", flush=True)
    print(f"   📁 Thư mục: {folder_path}", flush=True)
    print(f"=========================================================================", flush=True)

    if not os.path.exists(folder_path):
        print(f"❌ Không tìm thấy thư mục: {folder_path}", flush=True)
        return

    # 1. Tìm Story ID
    stories = supabase_get(f"stories?slug=eq.{slug}&select=id,title,total_chapters")
    if not stories:
        print(f"❌ Không tìm thấy story trong Supabase với slug: {slug}", flush=True)
        return
    story_id = stories[0]["id"]

    # 2. Quét file PDF
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(".pdf")], key=natural_sort_key)
    print(f"✓ Tìm thấy {len(files)} file PDF.", flush=True)
    if not files:
        return

    # 3. Lấy danh sách các chương đã nạp trong DB
    try:
        existing = supabase_get(f"chapters?story_id=eq.{story_id}&select=chapter_number")
        existing_nums = {c["chapter_number"] for c in existing}
    except Exception as e:
        existing_nums = set()
    print(f"✓ Đã có sẵn trong DB: {len(existing_nums)} tập.", flush=True)

    success_count = 0
    skip_count = 0

    for idx, fname in enumerate(files, start=1):
        c_num = extract_chapter_number(fname, idx)

        # Skip if already exists in DB
        if c_num in existing_nums:
            skip_count += 1
            continue

        fpath = os.path.join(folder_path, fname)
        clean_name = os.path.splitext(fname)[0]
        print(f"[{idx}/{len(files)}] Đang tải Tập {c_num}: {clean_name}...", flush=True)
        t0 = time.time()
        try:
            page_urls = process_pdf_volume(fpath, c_num, slug, s3)
            rec = {
                "story_id": story_id,
                "chapter_number": c_num,
                "title": f"Tập {c_num} - {clean_name}" if not clean_name.lower().startswith("tập") else clean_name,
                "is_locked": c_num > 3,
                "price_coins": 10 if c_num > 3 else 0,
                "pages_images": json.dumps(page_urls)
            }
            res = supabase_upsert("chapters", [rec], on_conflict="story_id,chapter_number")
            dt = time.time() - t0
            if res:
                existing_nums.add(c_num)
                success_count += 1
                print(f"   ✓ Xong Tập {c_num} ({len(page_urls)} trang, {dt:.1f}s)!", flush=True)
            else:
                print(f"   ✗ Lỗi lưu Supabase Tập {c_num} ({clean_name})", flush=True)
        except Exception as e:
            print(f"   ✗ Lỗi xử lý {clean_name}: {e}", flush=True)

    # Đồng bộ total chapters
    total_now = max(len(files), len(existing_nums))
    supabase_patch(f"stories?id=eq.{story_id}", {"total_chapters": total_now})
    print(f"🎉 HOÀN TẤT '{series_title}': +{success_count} tập mới, {skip_count} tập có sẵn -> Tổng {total_now} tập!\n", flush=True)

def main():
    s3 = get_s3()
    comic_root = r"F:\Truyện Tranh\Truyện Tranh"

    # Master list of all series in priority batches
    all_series = [
        # Batch 1: Manga Siêu Sao
        ("Conan", "conan", os.path.join(comic_root, "Conan")),
        ("One Piece Bản Thường", "onepiece-ban-thuong", os.path.join(comic_root, "Onepiece Bản Thường")),
        ("One Piece Color", "onepiece-color", os.path.join(comic_root, "Onepiece Color")),
        ("Shin - Cậu Bé Bút Chì", "shin-cau-be-but-chi", os.path.join(comic_root, "Shin - Cậu Bé Bút Chì")),
        ("Bleach", "bleach", os.path.join(comic_root, "Bleach")),
        ("Fairy Tail", "fairy-tail", os.path.join(comic_root, "Fairy tail")),
        ("Pokemon Đặc Biệt", "pokemon-dac-biet", os.path.join(comic_root, "Pokemon Đặc Biệt")),

        # Batch 2: Shonen & Hành Động Huyền Thoại
        ("Ninja Loạn Thị", "ninja-loan-thi", os.path.join(comic_root, "Ninja Loạn Thị")),
        ("Siêu Quậy Tepi", "sieu-quay-tepi", os.path.join(comic_root, "Siêu Quậy Tepi")),
        ("Hunter X Hunter", "hunter-x-hunter", os.path.join(comic_root, "Hunter X Hunter")),
        ("Dấu Ấn Rồng Thiên", "dau-an-rong-thien", os.path.join(comic_root, "Dấu Ấn Rồng Thiên")),
        ("Biệt Đội Lính Cứu Hỏa", "biet-doi-linh-cuu-hoa", os.path.join(comic_root, "Biệt Đội Lính Cứu Hỏa")),
        ("Cô Bé Hạt Tiêu - Chie", "co-be-hat-tieu-chie", os.path.join(comic_root, "Cô Bé Hạt Tiêu - Chie")),
        ("Cô Bé Tinh Nghịch - Asari", "co-be-tinh-nghich", os.path.join(comic_root, "Cô Bé Tinh Nghịch - Asari")),
        ("Rurouni Kenshin", "rurouni-kenshin-1", os.path.join(comic_root, "Rurouni Kenshin 1")),
        ("Giả Kim Thuật (Fullmetal Alchemist)", "gia-kim-thuat", os.path.join(comic_root, "Giả Kim Thuật")),
        ("Basara", "basara", os.path.join(comic_root, "Basara")),
        ("Người Máy Siêu Đẳng", "nguoi-may-sieu-dang", os.path.join(comic_root, "Người Máy Siêu Đẳng")),
        ("Bách Quỷ Dạ Hành", "bach-quy-da-hanh", os.path.join(comic_root, "Bách Quỷ Dạ Hành")),
        ("Phong Thần Ký", "phong-than-ky", os.path.join(comic_root, "Phong Thần Ký")),
        ("Hiệp Sĩ Giấy", "hiep-si-giay", os.path.join(comic_root, "HIệp Sĩ Giấy")),

        # Batch 3: Manga Trung & Ngắn
        ("7 Seeds", "7-seeds", os.path.join(comic_root, "7 Seeds")),
        ("Ashita No Joe", "ashita-no-joe", os.path.join(comic_root, "Ashita No Joe")),
        ("Hành Trình U Linh Giới (Yu Yu Hakusho)", "hanh-trinh-u-linh-gioi", os.path.join(comic_root, "Hành Trình U Linh Giới")),
        ("Monster - Naoki Urasawa", "monster-naoki-urasawa", os.path.join(comic_root, "Monster - Naoki Urasawa")),
        ("B't X - Người X", "bt-x-nguoi-x", os.path.join(comic_root, "B_t X - Người X")),
        ("Flame Of Recca", "flame-of-recca", os.path.join(comic_root, "Flame Of Recca")),
        ("Märchen Awakens Romance", "mrchen-awakens-romance", os.path.join(comic_root, "Märchen Awakens Romance")),
        ("Megaman", "megaman", os.path.join(comic_root, "Megaman")),
        ("Mixim 11", "mixim-11", os.path.join(comic_root, "Mixim 11")),
        ("Phoenix - Chim Lửa", "phoenix-chim-lua", os.path.join(comic_root, "Phoenix - Chim Lửa")),
        ("Zippy Ziggy", "zippy-ziggy", os.path.join(comic_root, "Zippy Ziggy")),
        ("Ớt Bảy Màu", "ot-bay-mau-nijiiro-togarashi", os.path.join(comic_root, "Ớt Bảy Màu - Nijiiro Togarashi")),
        ("Cậu Bé Siêu Năng Lực", "cau-be-sieu-nang-luc", os.path.join(comic_root, "Cậu Bé Siêu Năng Lực")),
        ("Hellsing", "hellsing", os.path.join(comic_root, "Hellsing")),
        ("Đạo Làm Chồng Đảm", "dao-lam-chong-dam", os.path.join(comic_root, "Đạo Làm Chồng Đảm")),
        ("Inuyasha", "inuyasha", os.path.join(comic_root, "Inuyasha")),
        ("Deathtopia HD", "deathtopia-hd", os.path.join(comic_root, "Deathtopia HD")),
        ("Drifters - Những Kẻ Phiêu Bạt", "drifters-nhung-ke-phieu-bat", os.path.join(comic_root, "Drifters - Những Kẻ Phiêu Bạt")),
        ("Anh em Hồ Lô", "anh-em-ho-lo", os.path.join(comic_root, "Anh em Hồ Lô")),
        ("Magic Kaito - Kaito Kid", "magic-kaito-kaito-kid", os.path.join(comic_root, "Magic Kaito - Kaito Kid")),

        # Batch 4: Siêu Dài Kỳ
        ("Naruto (720 Chap)", "naruto", os.path.join(comic_root, "Naruto")),
    ]

    print("=========================================================================", flush=True)
    print(f"🚀 BẮT ĐẦU MASTER PIPELINE NẠP TẤT CẢ {len(all_series)} BỘ TRUYỆN TRANH CÒN LẠI", flush=True)
    print("=========================================================================\n", flush=True)

    for title, slug, path in all_series:
        try:
            ingest_series(title, slug, path, s3)
        except Exception as e:
            print(f"❌ Lỗi ngoài ý muốn với bộ {title}: {e}\n", flush=True)

    print("=========================================================================", flush=True)
    print("🎉 TẤT CẢ CÁC BỘ TRUYỆN TRANH TRÊN PC ĐÃ ĐƯỢC NẠP HOÀN TẤT 100%!", flush=True)
    print("=========================================================================", flush=True)

if __name__ == "__main__":
    main()
