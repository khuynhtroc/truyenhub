import os
import sys
import re
import json
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
        config=Config(signature_version="s3v4", max_pool_connections=25),
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

def supabase_post(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")

def process_volume(file_path, chap_num, slug, s3):
    file_name = os.path.basename(file_path)
    r2_prefix = f"comics/{slug}/chap-{chap_num}"
    
    pdf = pdfium.PdfDocument(file_path)
    total_pages = len(pdf)
    
    upload_tasks = []
    cover_bytes = None
    
    for page_idx in range(total_pages):
        page = pdf[page_idx]
        pil_image = page.render(scale=1.4).to_pil()
        if pil_image.width > 1000:
            new_h = int((1000 / pil_image.width) * pil_image.height)
            pil_image = pil_image.resize((1000, new_h), Image.Resampling.LANCZOS)
        
        buf = BytesIO()
        pil_image.save(buf, "WEBP", quality=75)
        r2_key = f"{r2_prefix}/page-{page_idx+1:03d}.webp"
        data = buf.getvalue()
        upload_tasks.append((data, r2_key))
        if chap_num == 1 and page_idx == 0:
            cover_bytes = data
            
    # Upload images with ThreadPoolExecutor
    page_urls = [None] * len(upload_tasks)
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_idx = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            page_urls[idx] = future.result()
            
    return page_urls, cover_bytes

def main():
    series_name = "Đội Quân Nhí Nhố"
    slug = "doi-quan-nhi-nho"
    series_dir = r"F:\Truyện Tranh\Truyện Tranh\Đội Quân Nhí Nhố"
    
    s3 = get_s3()
    
    # 1. Tìm hoặc tạo Story trong Supabase
    url = f"{SUPABASE_URL}/rest/v1/stories?slug=eq.{slug}&select=id"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        stories = json.loads(resp.read().decode("utf-8"))
    
    if not stories:
        print(f"Không tìm thấy truyện {slug}")
        return
    story_id = stories[0]["id"]
    print(f"Story ID cho {series_name}: {story_id}")
    
    # 2. Lấy danh sách file PDF
    files = sorted([f for f in os.listdir(series_dir) if f.lower().endswith(".pdf")], key=natural_sort_key)
    print(f"Tổng số tập tìm thấy: {len(files)}")
    
    # Kiểm tra các chương đã có trên Supabase
    url_ch = f"{SUPABASE_URL}/rest/v1/chapters?story_id=eq.{story_id}&select=chapter_number"
    req_ch = urllib.request.Request(url_ch, headers=headers)
    with urllib.request.urlopen(req_ch) as resp:
        existing_chaps = {c["chapter_number"] for c in json.loads(resp.read().decode("utf-8"))}
    print(f"Các tập đã có sẵn trên Supabase: {sorted(list(existing_chaps))}")
    
    for idx, fname in enumerate(files):
        chap_num = idx + 1
        if chap_num in existing_chaps and chap_num <= 3:
            # Chap 1-3 đã có, nhưng nếu muốn kiểm tra số trang
            print(f"-> Tập {chap_num} ({fname}) đã nạp trước đó, bỏ qua.")
            continue
            
        fpath = os.path.join(series_dir, fname)
        print(f"\n[{chap_num}/{len(files)}] Đang bóc tách & upload: {fname}...", flush=True)
        try:
            page_urls, _ = process_volume(fpath, chap_num, slug, s3)
            
            # Ghi vào Supabase
            ch_data = {
                "story_id": story_id,
                "chapter_number": chap_num,
                "title": f"Tập {chap_num} - {os.path.splitext(fname)[0]}",
                "is_locked": chap_num > 3,
                "price_coins": 10 if chap_num > 3 else 0,
                "pages_images": json.dumps(page_urls)
            }
            supabase_post("chapters", [ch_data])
            print(f"  ✓ Hoàn tất Tập {chap_num}: {len(page_urls)} trang đã lên R2 & Supabase!", flush=True)
        except Exception as e:
            print(f"  ✗ Lỗi Tập {chap_num}: {e}", flush=True)
            
    # Cập nhật lại total_chapters của story
    update_data = {"total_chapters": len(files)}
    url_up = f"{SUPABASE_URL}/rest/v1/stories?id=eq.{story_id}"
    req_up = urllib.request.Request(url_up, data=json.dumps(update_data).encode("utf-8"), headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }, method="PATCH")
    with urllib.request.urlopen(req_up) as resp:
        print(f"\n🎉 Đã cập nhật tổng số tập Đội Quân Nhí Nhố = {len(files)} tập!")

if __name__ == "__main__":
    main()
