import urllib.request
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTkwNTQxNywiZXhwIjoyMTA3NDgxNDE3fQ.JOX4r3s7OSsqImlnjRMHD4m4giOAYxN97yZq8a94Q1A'
base = 'https://bqvffeqjgjtzprouwshd.supabase.co/rest/v1'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

sample_slugs = [
    'dan-ong-den-tu-sao-hoa-dan-ba-den-tu-sao-kim',
    'sachvuicom-bi-an-chiec-nhan-ngoc-sapphire-quy-ma-tinh',
    'sachvuicom-ac-quy-nam-kinh-mo-hyder',
    'dau-truong-sinh-tu',
    'tam-ly-hoc-toi-pham',
    'muon-kiep-nhan-sinh-tap-1'
]

for slug in sample_slugs:
    req = urllib.request.Request(f'{base}/stories?slug=eq.{slug}&select=id,title,description,total_chapters', headers=headers)
    st_list = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    if not st_list:
        continue
    st = st_list[0]
    print("=" * 60)
    print(f"STORY: {st['title']} (Total chapters: {st['total_chapters']})")
    print("--- DESCRIPTION PREVIEW ---")
    print(st.get('description') or '')
    
    req_ch = urllib.request.Request(f"{base}/chapters?story_id=eq.{st['id']}&order=chapter_number.asc&limit=1&select=id,chapter_number,title,content_text", headers=headers)
    ch_list = json.loads(urllib.request.urlopen(req_ch).read().decode('utf-8'))
    if ch_list:
        ch = ch_list[0]
        print(f"\n--- CHAPTER 1: {ch['title']} (Len: {len(ch.get('content_text') or '')}) ---")
        lines = [line.strip() for line in (ch.get('content_text') or '').split('\n') if line.strip()]
        for l in lines[:6]:
            print("  " + l)
