import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

url = f"{SUPABASE_URL}/rest/v1/stories?type=eq.comic&select=id,title,slug,total_chapters"
req = urllib.request.Request(url, headers={
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
})
with urllib.request.urlopen(req) as resp:
    stories = json.loads(resp.read().decode("utf-8"))

for s in stories:
    slug = s["slug"].lower()
    if any(k in slug for k in ["than-dong", "quynh", "o-long", "doraemon", "jindo", "fantasista", "bac-si-quai-di", "conan", "one-piece", "naruto"]):
        print(f"ID: {s['id']} | Slug: {s['slug']} | Title: {s['title']} | Total Chaps: {s['total_chapters']}")
