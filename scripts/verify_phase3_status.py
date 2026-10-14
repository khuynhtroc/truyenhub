import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def supabase_get(endpoint):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{endpoint}", headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def supabase_patch(endpoint, data):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{endpoint}", data=json.dumps(data).encode("utf-8"), headers=headers, method="PATCH")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode("utf-8")

def main():
    print("=========================================================================", flush=True)
    print("📊 BÁO CÁO CÁC BỘ TRUYỆN TRANH ĐÃ ĐƯỢC NẠP LÊN SUPABASE & R2", flush=True)
    print("=========================================================================", flush=True)

    stories = supabase_get("stories?type=eq.comic&select=id,title,slug,total_chapters")
    print(f"Loaded {len(stories)} comic stories from Supabase.", flush=True)

    for s in sorted(stories, key=lambda x: x["slug"]):
        s_id = s["id"]
        slug = s["slug"]
        title = s["title"]
        db_total = s["total_chapters"]
        
        try:
            # Get actual chapters count using headers Prefer: count=exact
            req_count = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/chapters?story_id=eq.{s_id}&select=id",
                headers={**headers, "Prefer": "count=exact"}
            )
            with urllib.request.urlopen(req_count, timeout=10) as resp:
                # Content-Range header has format: 0-24/25
                cr = resp.headers.get("Content-Range")
                if cr and "/" in cr:
                    actual_count = int(cr.split("/")[1])
                else:
                    data = json.loads(resp.read().decode("utf-8"))
                    actual_count = len(data)
        except Exception as e:
            print(f"Error getting count for {slug}: {e}", flush=True)
            continue
        
        # If chapters were uploaded and actual count > db_total, sync it
        if actual_count > 0 and actual_count != db_total:
            try:
                supabase_patch(f"stories?id=eq.{s_id}", {"total_chapters": actual_count})
            except Exception as e:
                pass
                
        if actual_count > 3 or slug in ["than-dong-dat-viet", "trang-quynh"]:
            print(f"   ✓ {title} ({slug}): ĐÃ NẠP {actual_count} TẬP", flush=True)

    print("\n🎉 Hoàn tất kiểm tra và đồng bộ số tập!", flush=True)

if __name__ == "__main__":
    main()
