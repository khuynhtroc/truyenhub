import urllib.request
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from split_and_ingest_multiversion import load_env, SUPABASE_URL, SUPABASE_KEY

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

# 1. Check stories
url = f"{SUPABASE_URL}/rest/v1/stories?select=id,title,slug,total_chapters,genres,status&order=created_at.desc&limit=20"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))

print(f"--- 20 TRUYỆN MỚI NHẤT TRÊN SUPABASE ---")
for d in data:
    print(f"• {d['title']} | slug: {d['slug']} | chapters: {d['total_chapters']} | status: {d['status']} | genres: {d['genres']}")

# 2. Check Đội Quân Nhí Nhố chapters count
url_dq = f"{SUPABASE_URL}/rest/v1/stories?slug=eq.doi-quan-nhi-nho&select=id,title,total_chapters"
req_dq = urllib.request.Request(url_dq, headers=headers)
with urllib.request.urlopen(req_dq) as resp:
    dq = json.loads(resp.read().decode("utf-8"))
if dq:
    sid = dq[0]["id"]
    url_ch = f"{SUPABASE_URL}/rest/v1/chapters?story_id=eq.{sid}&select=chapter_number"
    req_ch = urllib.request.Request(url_ch, headers=headers)
    with urllib.request.urlopen(req_ch) as resp:
        chaps = json.loads(resp.read().decode("utf-8"))
    print(f"\n✅ ĐỘI QUÂN NHÍ NHỐ: Tổng số chương thực tế trong DB: {len(chaps)} chương! (Story total_chapters: {dq[0]['total_chapters']})")
