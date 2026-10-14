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

def main():
    root = r"F:\Truyện Tranh\Truyện Tranh\Thần Đồng Đất Việt"
    slug = "than-dong-dat-viet"
    story_id = "67fc4779-c77e-4e5e-8cc8-68ec47d74160"
    s3 = get_s3()

    print("=========================================================================")
    print("📚 BẮT ĐẦU NẠP TRỌN BỘ THẦN ĐỒNG ĐẤT VIỆT (161 TẬP)")
    print("=========================================================================")

    # 1. Thu thập tất cả các chương
    all_chapters = []
    for sub in sorted(os.listdir(root)):
        sub_path = os.path.join(root, sub)
        if os.path.isdir(sub_path):
            for ch in sorted(os.listdir(sub_path)):
                ch_path = os.path.join(sub_path, ch)
                if os.path.isdir(ch_path):
                    # Extract chapter number
                    m = re.search(r'(?:tap|tddv)\s*(\d+)', ch.lower())
                    if m:
                        num = int(m.group(1))
                    else:
                        m2 = re.search(r'\d+', ch)
                        num = int(m2.group(0)) if m2 else 999
                    
                    # Extract title clean
                    clean_title = ch.replace("Tap", "Tập").replace("TDDV", "Tập").strip()
                    all_chapters.append({
                        "num": num,
                        "title": clean_title,
                        "path": ch_path,
                        "sub": sub
                    })

    # Sắp xếp theo số tập tăng dần
    all_chapters.sort(key=lambda x: x["num"])
    print(f"✓ Đã định vị tổng cộng {len(all_chapters)} tập Thần Đồng Đất Việt trên PC.")

    # 2. Kiểm tra các chương đã có trên Supabase
    existing = supabase_get(f"chapters?story_id=eq.{story_id}&select=chapter_number")
    existing_nums = {c["chapter_number"] for c in existing}
    print(f"✓ Đã có sẵn trên Supabase: {len(existing_nums)} tập.")

    count_success = 0
    count_skip = 0

    for idx, chap in enumerate(all_chapters, start=1):
        c_num = chap["num"]
        c_path = chap["path"]
        c_title = chap["title"]

        if c_num in existing_nums and c_num <= 4:
            print(f"[{idx}/{len(all_chapters)}] -> Tập {c_num} đã có trong DB, bỏ qua.", flush=True)
            count_skip += 1
            continue

        img_files = sorted(
            [f for f in os.listdir(c_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))],
            key=natural_sort_key
        )
        if not img_files:
            print(f"[{idx}/{len(all_chapters)}] ⚠️ Tập {c_num}: Không tìm thấy file ảnh!", flush=True)
            continue

        print(f"\n[{idx}/{len(all_chapters)}] Đang xử lý Tập {c_num}: '{c_title}' ({len(img_files)} trang)...", flush=True)
        t0 = time.time()

        upload_tasks = []
        for p_idx, fname in enumerate(img_files, start=1):
            fpath = os.path.join(c_path, fname)
            try:
                with Image.open(fpath) as img:
                    img = img.convert("RGB")
                    if img.width > 950:
                        new_h = int((950 / img.width) * img.height)
                        img = img.resize((950, new_h), Image.Resampling.LANCZOS)
                    buf = BytesIO()
                    img.save(buf, "WEBP", quality=70)
                    data = buf.getvalue()
                r2_key = f"comics/{slug}/chap-{c_num}/page-{p_idx:03d}.webp"
                upload_tasks.append((data, r2_key))
            except Exception as e:
                print(f"    Lỗi đọc ảnh {fname}: {e}")

        # Tải song song lên Cloudflare R2
        page_urls = [None] * len(upload_tasks)
        with ThreadPoolExecutor(max_workers=14) as executor:
            future_to_idx = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
            for future in as_completed(future_to_idx):
                i = future_to_idx[future]
                page_urls[i] = future.result()

        # Lưu vào Supabase
        rec = {
            "story_id": story_id,
            "chapter_number": c_num,
            "title": f"Tập {c_num} - {c_title}" if not c_title.lower().startswith("tập") else c_title,
            "is_locked": c_num > 3,
            "price_coins": 10 if c_num > 3 else 0,
            "pages_images": json.dumps(page_urls)
        }
        res = supabase_upsert("chapters", [rec], on_conflict="story_id,chapter_number")
        dt = time.time() - t0
        if res:
            count_success += 1
            print(f"   ✓ Hoàn tất Tập {c_num}: {len(page_urls)} trang tải lên R2 & Supabase thành công trong {dt:.1f}s!", flush=True)
        else:
            print(f"   ✗ Lỗi cập nhật Supabase cho Tập {c_num}", flush=True)

    # Cập nhật tổng số chương của bộ truyện
    update_data = {"total_chapters": max(len(all_chapters), 161)}
    url_up = f"{SUPABASE_URL}/rest/v1/stories?id=eq.{story_id}"
    req_up = urllib.request.Request(url_up, data=json.dumps(update_data).encode("utf-8"), headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }, method="PATCH")
    try:
        urllib.request.urlopen(req_up)
        print(f"\n🎉 Đã cập nhật tổng số tập Thần Đồng Đất Việt = {max(len(all_chapters), 161)} tập!")
    except Exception as e:
        print(f"Lỗi update story count: {e}")

    print("=========================================================================")
    print(f"🎉 HOÀN TẤT NẠP THẦN ĐỒNG ĐẤT VIỆT: {count_success} tập mới, {count_skip} tập có sẵn!")
    print("=========================================================================")

if __name__ == "__main__":
    main()
