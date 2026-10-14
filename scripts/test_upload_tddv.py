import os
import sys
import re
import json
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
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

def upload_buffer_r2(s3, buffer, r2_key, content_type="image/webp"):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=buffer,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable"
    )
    return f"{R2_DOMAIN}/{r2_key}"

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

def test_single_chapter():
    s3 = get_s3()
    chap_dir = r"F:\Truyện Tranh\Truyện Tranh\Thần Đồng Đất Việt\tddv 1-10\Tap 04 - Thanh chi bang da"
    chap_num = 4
    slug = "than-dong-dat-viet"
    story_id = "67fc4779-c77e-4e5e-8cc8-68ec47d74160"
    
    img_files = sorted([f for f in os.listdir(chap_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))], key=natural_sort_key)
    print(f"Testing Tap {chap_num}: {len(img_files)} images found.")
    
    upload_tasks = []
    for idx, fname in enumerate(img_files):
        fpath = os.path.join(chap_dir, fname)
        with Image.open(fpath) as img:
            img = img.convert("RGB")
            if img.width > 900:
                new_h = int((900 / img.width) * img.height)
                img = img.resize((900, new_h), Image.Resampling.LANCZOS)
            buf = BytesIO()
            img.save(buf, "WEBP", quality=70)
            data = buf.getvalue()
        
        r2_key = f"comics/{slug}/chap-{chap_num}/page-{idx+1:03d}.webp"
        upload_tasks.append((data, r2_key))

    print(f"Uploading {len(upload_tasks)} pages to Cloudflare R2...")
    page_urls = [None] * len(upload_tasks)
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
        for f in as_completed(futures):
            idx = futures[f]
            page_urls[idx] = f.result()

    print(f"Uploaded successfully! First page: {page_urls[0]}")
    
    # Supabase upsert
    ch_data = {
        "story_id": story_id,
        "chapter_number": chap_num,
        "title": "Tập 4 - Thành trì bằng đá",
        "is_locked": True,
        "price_coins": 10,
        "pages_images": json.dumps(page_urls)
    }
    url = f"{SUPABASE_URL}/rest/v1/chapters?on_conflict=story_id,chapter_number"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
    }
    req = urllib.request.Request(url, data=json.dumps([ch_data]).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"Supabase upsert result: {len(res)} chapter registered!")

if __name__ == "__main__":
    test_single_chapter()
