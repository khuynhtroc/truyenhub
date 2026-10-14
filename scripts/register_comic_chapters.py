import os
import sys
import json
import urllib.request
import boto3
from botocore.config import Config

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
        config=Config(signature_version="s3v4", max_pool_connections=20),
        region_name="auto"
    )

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
    s3 = get_s3()
    stories = supabase_get("stories?type=eq.comic&select=id,title,slug,total_chapters")
    print(f"Loaded {len(stories)} comic stories from Supabase.")
    
    for s in stories:
        slug = s["slug"]
        story_id = s["id"]
        
        # Check if chapters already registered
        existing_chaps = supabase_get(f"chapters?story_id=eq.{story_id}&select=id,chapter_number")
        if existing_chaps and len(existing_chaps) >= 5:
            print(f"✓ Story '{slug}' already has {len(existing_chaps)} chapters registered.")
            continue
            
        print(f"Checking R2 objects for story: {slug}...")
        prefix = f"comics/{slug}/"
        paginator = s3.get_paginator('list_objects_v2')
        pages_by_chap = {}
        for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
            for obj in page.get('Contents', []):
                key = obj['Key']
                # format: comics/{slug}/chap-{chap_num}/page-{p:03d}.webp
                parts = key.split('/')
                if len(parts) >= 4 and parts[2].startswith("chap-"):
                    try:
                        chap_num = int(parts[2].replace("chap-", ""))
                        if chap_num not in pages_by_chap:
                            pages_by_chap[chap_num] = []
                        pages_by_chap[chap_num].append(f"{R2_DOMAIN}/{key}")
                    except:
                        pass
                        
        if not pages_by_chap:
            print(f"  -> No pages found in R2 for {slug}")
            continue
            
        print(f"  -> Found {len(pages_by_chap)} chapters in R2 for {slug}")
        chap_records = []
        for chap_num in sorted(pages_by_chap.keys()):
            p_urls = sorted(pages_by_chap[chap_num])
            chap_records.append({
                "story_id": story_id,
                "chapter_number": chap_num,
                "title": f"Tập {chap_num}",
                "is_locked": chap_num > 3,
                "price_coins": 10 if chap_num > 3 else 0,
                "pages_images": p_urls
            })
            
        if chap_records:
            res = supabase_upsert("chapters", chap_records, on_conflict="story_id,chapter_number")
            if res:
                print(f"  🎉 Successfully registered {len(chap_records)} chapters in Supabase for '{slug}'!")
            else:
                print(f"  ✗ Failed to register chapters for '{slug}'")

if __name__ == "__main__":
    main()
