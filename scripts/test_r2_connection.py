import os
import sys
import boto3
from botocore.config import Config

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

env = {}
env_path = r"F:\Antigravity\giftblog\.env.local"
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k.strip()] = v.strip().strip("\"'")

acc = env.get("CLOUDFLARE_R2_ACCOUNT_ID")
ak = env.get("CLOUDFLARE_R2_ACCESS_KEY_ID")
sk = env.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
bucket = env.get("CLOUDFLARE_R2_BUCKET_NAME")

print("Account ID:", acc[:6] + "..." if acc else "None")
print("Access Key:", ak[:6] + "..." if ak else "None")

s3 = boto3.client(
    service_name="s3",
    endpoint_url=f"https://{acc}.r2.cloudflarestorage.com",
    aws_access_key_id=ak,
    aws_secret_access_key=sk,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)

try:
    res = s3.list_buckets()
    existing_buckets = [b["Name"] for b in res.get("Buckets", [])]
    print("Ket noi Cloudflare R2 thanh cong! Danh sach buckets hien co:")
    for b in existing_buckets:
        print("  -", b)

    target_bucket = "truyenhub-media"
    if target_bucket not in existing_buckets:
        print(f"\nDang tao bucket moi '{target_bucket}'...")
        s3.create_bucket(Bucket=target_bucket)
        print(f"Bucket '{target_bucket}' da duoc tao thanh cong tren Cloudflare R2!")
    else:
        print(f"\nBucket '{target_bucket}' da ton tai san tren Cloudflare R2!")

    # Write .env.local for truyenhub
    truyenhub_env = rf"""# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL={env.get('NEXT_PUBLIC_SUPABASE_URL', '')}
NEXT_PUBLIC_SUPABASE_ANON_KEY={env.get('SUPABASE_ANON_KEY', '')}
SUPABASE_SERVICE_ROLE_KEY={env.get('SUPABASE_SERVICE_ROLE_KEY', '')}

# CLOUDFLARE R2 CONFIGURATION
R2_ACCOUNT_ID={acc}
R2_ACCESS_KEY_ID={ak}
R2_SECRET_ACCESS_KEY={sk}
R2_BUCKET_NAME={target_bucket}
R2_PUBLIC_DOMAIN=https://pub-xxxxxx.r2.dev

# VIETQR
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=0388888888
VIETQR_ACCOUNT_NAME=TRUYENHUB
"""
    with open(r"F:\Antigravity\truyenhub\.env.local", "w", encoding="utf-8") as f:
        f.write(truyenhub_env)
    print("\nDa tao file F:\Antigravity\truyenhub\.env.local voi day du thong so R2 & Supabase!")

except Exception as e:
    print("Loi ket noi R2:", e)
