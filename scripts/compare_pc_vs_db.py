import os
import sys
import json
import urllib.request
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

def slugify(text):
    text = text.lower()
    text = re.sub(r'[áàảãạăắằẳẵặâấầẩẫậ]', 'a', text)
    text = re.sub(r'[éèẻẽẹêếềểễệ]', 'e', text)
    text = re.sub(r'[íìỉĩị]', 'i', text)
    text = re.sub(r'[óòỏõọôốồổỗộơớờởỡợ]', 'o', text)
    text = re.sub(r'[úùủũụưứừửữự]', 'u', text)
    text = re.sub(r'[ýỳỷỹỵ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error: {e}")
        return []

def main():
    # 1. Fetch DB stories
    stories = supabase_get("stories?select=id,title,slug,type,total_chapters,status")
    print(f"Total stories in Supabase: {len(stories)}")
    
    # Map by slug
    db_by_slug = {s["slug"]: s for s in stories}
    
    # 2. Check Comics on PC
    comic_base = r"F:\Truyện Tranh\Truyện Tranh"
    comic_folders = sorted(os.listdir(comic_base))
    
    comic_status = []
    for cf in comic_folders:
        p = os.path.join(comic_base, cf)
        if not os.path.isdir(p):
            continue
            
        slug = slugify(cf)
        
        # Check files inside
        subdirs = [s for s in os.listdir(p) if os.path.isdir(os.path.join(p, s))]
        direct_files = [s for s in os.listdir(p) if s.lower().endswith(('.pdf', '.zip', '.cbz', '.cbr', '.rar'))]
        
        # Try to find match in DB
        matched = None
        for s_slug, s_data in db_by_slug.items():
            if slug == s_slug or s_slug.startswith(slug) or slug.startswith(s_slug):
                matched = s_data
                break
                
        # Count chapters in DB if matched
        db_chaps = 0
        if matched:
            ch_list = supabase_get(f"chapters?story_id=eq.{matched['id']}&select=id")
            db_chaps = len(ch_list)
            
        comic_status.append({
            "folder": cf,
            "slug": slug,
            "has_subdirs": len(subdirs) > 0,
            "subdirs": subdirs,
            "file_count": len(direct_files),
            "matched_in_db": matched is not None,
            "db_title": matched["title"] if matched else None,
            "db_slug": matched["slug"] if matched else None,
            "db_chapters": db_chaps,
            "status": matched["status"] if matched else "not_uploaded"
        })
        
    # Write comic status report
    with open(r"scripts\comic_status_report.json", "w", encoding="utf-8") as f:
        json.dump(comic_status, f, ensure_ascii=False, indent=2)
        
    print(f"Analyzed {len(comic_status)} comic folders.")
    
    # Summarize
    uploaded_full = [c for c in comic_status if c["db_chapters"] >= c["file_count"] and c["file_count"] > 0]
    uploaded_partial = [c for c in comic_status if 0 < c["db_chapters"] < c["file_count"] or (c["has_subdirs"] and c["db_chapters"] > 0)]
    not_uploaded = [c for c in comic_status if c["db_chapters"] == 0]
    
    print("\n--- TỔNG KẾT TRUYỆN TRANH ---")
    print(f"1. Đã nạp đủ 100% chương: {len(uploaded_full)} bộ")
    print(f"2. Đã nạp mẫu / một phần chương (cần nạp nốt): {len(uploaded_partial)} bộ")
    print(f"3. Chưa nạp chương nào: {len(not_uploaded)} bộ")

if __name__ == "__main__":
    main()
