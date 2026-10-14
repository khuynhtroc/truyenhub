import os
import sys
import json
import urllib.request
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

comic_root = r"F:\Truyện Tranh\Truyện Tranh"

# Get all comic stories from Supabase
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/stories?type=eq.comic&select=id,title,slug,total_chapters", headers=headers)
with urllib.request.urlopen(req) as resp:
    db_stories = json.loads(resp.read().decode("utf-8"))

db_by_slug = {s["slug"]: s for s in db_stories}
db_by_title = {s["title"].lower(): s for s in db_stories}

pc_folders = sorted(os.listdir(comic_root))

print(f"Tổng số thư mục trên PC: {len(pc_folders)}")
print(f"Tổng số comic story trong DB: {len(db_stories)}")

mappings = []
unmatched = []

for folder in pc_folders:
    fpath = os.path.join(comic_root, folder)
    if not os.path.isdir(fpath):
        continue
        
    # Count files
    files = [f for f in os.listdir(fpath) if os.path.isfile(os.path.join(fpath, f))]
    subdirs = [d for d in os.listdir(fpath) if os.path.isdir(os.path.join(fpath, d))]
    
    # Try slug matching
    slug_cand = re.sub(r'[^a-z0-9]+', '-', folder.lower()).strip('-')
    matched_story = None
    
    for s in db_stories:
        if s["slug"] == slug_cand or s["slug"] in slug_cand or slug_cand in s["slug"]:
            matched_story = s
            break
        if s["title"].lower() == folder.lower() or s["title"].lower() in folder.lower():
            matched_story = s
            break
            
    if matched_story:
        mappings.append({
            "folder": folder,
            "path": fpath,
            "slug": matched_story["slug"],
            "title": matched_story["title"],
            "id": matched_story["id"],
            "files_count": len(files),
            "subdirs_count": len(subdirs),
            "is_subdirs": len(subdirs) > 0 and len(files) == 0
        })
    else:
        unmatched.append({
            "folder": folder,
            "files_count": len(files),
            "subdirs_count": len(subdirs)
        })

print("\n--- CÁC BỘ ĐÃ KHỚP THÀNH CÔNG VỚI DATABASE ---")
for m in mappings:
    print(f"✓ {m['folder']} -> slug: '{m['slug']}' ({m['files_count']} files, {m['subdirs_count']} subdirs)")

if unmatched:
    print("\n--- CÁC BỘ CHƯA TÌM THẤY STORY TƯƠNG ỨNG TRONG DB ---")
    for u in unmatched:
        print(f"✗ {u['folder']} ({u['files_count']} files, {u['subdirs_count']} subdirs)")

# Save mapping json
with open("scripts/comic_full_pipeline_plan.json", "w", encoding="utf-8") as f:
    json.dump({"mappings": mappings, "unmatched": unmatched}, f, ensure_ascii=False, indent=2)

print("\nĐã lưu kế hoạch vào scripts/comic_full_pipeline_plan.json")
