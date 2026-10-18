import os
import sys
import boto3
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def load_env():
    env = {}
    with open('.env.local', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"\'')
    return env

env = load_env()
account_id = env['R2_ACCOUNT_ID']
bucket = env['R2_BUCKET_NAME']
domain = env.get('NEXT_PUBLIC_R2_DOMAIN', 'https://media.doctruyen.vip').replace('https://', '')

s3 = boto3.client(
    's3',
    endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
    region_name='auto'
)

apk_path = 'DocTruyen-VIP.apk'
if not os.path.exists(apk_path):
    print(f"Error: {apk_path} not found!")
    sys.exit(1)

file_size = os.path.getsize(apk_path)
print(f"Uploading {apk_path} ({file_size} bytes) to R2 bucket '{bucket}'...")

s3.upload_file(
    apk_path,
    bucket,
    'DocTruyen-VIP.apk',
    ExtraArgs={
        'ContentType': 'application/vnd.android.package-archive',
        'ContentDisposition': 'attachment; filename="DocTruyen-VIP.apk"'
    }
)
print("Upload successful!")

public_url = f"https://{domain}/DocTruyen-VIP.apk"
req = urllib.request.Request(public_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req, timeout=10)
    print(f"Verified via public URL: {public_url} -> HTTP {resp.status} ({resp.headers.get('Content-Length')} bytes)")
except Exception as e:
    print(f"Verification error: {e}")
