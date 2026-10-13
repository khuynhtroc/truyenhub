import os
import sys
import mimetypes
import boto3
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def get_s3_client(env):
    account_id = env.get("R2_ACCOUNT_ID")
    access_key = env.get("R2_ACCESS_KEY_ID")
    secret_key = env.get("R2_SECRET_ACCESS_KEY")
    if not (account_id and access_key and secret_key):
        raise ValueError("Thieu thong tin R2 trong file .env.local")
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def upload_single_file(s3, bucket, local_path, r2_key):
    content_type = "image/webp" if local_path.endswith(".webp") else mimetypes.guess_type(local_path)[0] or "application/octet-stream"
    s3.upload_file(
        local_path,
        bucket,
        r2_key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": "public, max-age=31536000, immutable"
        }
    )
    return r2_key

def sync_local_covers_and_samples():
    print("=" * 65)
    print("🚀 TRUYENHUB - ĐỒNG BỘ MEDIA LÊN CLOUDFLARE R2")
    print("=" * 65)

    env = load_env()
    bucket = env.get("R2_BUCKET_NAME", "truyenhub-media")
    s3 = get_s3_client(env)

    print(f"Bucket đích: {bucket}")
    print(f"Cloudflare Account ID: {env.get('R2_ACCOUNT_ID')[:8]}...")

    # Thu thập file cần đồng bộ
    files_to_upload = []

    # 1. Bìa truyện trong public/covers/
    covers_dir = r"F:\Antigravity\truyenhub\public\covers"
    if os.path.exists(covers_dir):
        for f in os.listdir(covers_dir):
            if f.endswith((".webp", ".png", ".jpg", ".jpeg")):
                full = os.path.join(covers_dir, f)
                files_to_upload.append((full, f"covers/{f}"))

    # 2. Các chương truyện tranh mẫu đã nén trong public/comics/
    comics_dir = r"F:\Antigravity\truyenhub\public\comics"
    if os.path.exists(comics_dir):
        for root, dirs, files in os.walk(comics_dir):
            for f in files:
                if f.endswith((".webp", ".png", ".jpg", ".jpeg")):
                    full = os.path.join(root, f)
                    rel = os.path.relpath(full, r"F:\Antigravity\truyenhub\public").replace("\\", "/")
                    files_to_upload.append((full, rel))

    print(f"\nTìm thấy tổng cộng {len(files_to_upload)} file media cần đồng bộ lên R2.")
    print("Đang tiến hành tải lên với tốc độ cao (Multi-threading)...\n")

    uploaded = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(upload_single_file, s3, bucket, local_p, key): key for local_p, key in files_to_upload}
        for future in as_completed(futures):
            key = futures[future]
            try:
                future.result()
                uploaded += 1
                if uploaded % 10 == 0 or uploaded == len(files_to_upload):
                    print(f"  ✓ Đã đồng bộ: {uploaded}/{len(files_to_upload)} files -> {key}")
            except Exception as e:
                print(f"  ✗ Lỗi file {key}: {e}")

    print("\n" + "=" * 65)
    print(f"🎉 HOÀN TẤT ĐỒNG BỘ: {uploaded}/{len(files_to_upload)} FILES ĐÃ LÊN CLOUDFLARE R2!")
    print(f"Bucket name: {bucket}")
    print("=" * 65)

if __name__ == "__main__":
    sync_local_covers_and_samples()
