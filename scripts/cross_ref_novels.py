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
    stories = supabase_get("stories?type=eq.novel&select=id,title,slug,total_chapters")
    print(f"Total novel stories in DB: {len(stories)}")
    
    db_slug_set = set(s["slug"] for s in stories)
    db_title_set = set(slugify(s["title"]) for s in stories)
    
    with open(r"scripts\novels_audit_detailed.json", "r", encoding="utf-8") as f:
        categories = json.load(f)
        
    matched_books = []
    unmatched_books = []
    
    for cat in categories:
        for b in cat["books"]:
            fname = b["file"]
            base_name = os.path.splitext(fname)[0]
            # Strip common patterns like "- tác giả", "(pdf)", "(epub)"
            clean_name = re.sub(r'\([^)]*\)', '', base_name).strip()
            slug = slugify(clean_name)
            
            # Check match
            is_matched = False
            if slug in db_slug_set or slug in db_title_set:
                is_matched = True
            else:
                for db_s in db_slug_set:
                    if len(slug) > 6 and (slug in db_s or db_s in slug):
                        is_matched = True
                        break
                        
            if is_matched:
                matched_books.append({"file": fname, "cat": cat["category"], "path": b["path"]})
            else:
                unmatched_books.append({"file": fname, "cat": cat["category"], "path": b["path"]})
                
    print(f"Matched on DB: {len(matched_books)} files")
    print(f"Unmatched / Not yet created on DB: {len(unmatched_books)} files")
    
    # Group unmatched by category
    unmatched_by_cat = {}
    for ub in unmatched_books:
        c = ub["cat"]
        unmatched_by_cat[c] = unmatched_by_cat.get(c, 0) + 1
        
    print("\n--- CÁC THƯ MỤC TRUYỆN CHỮ CÒN NHIỀU ĐẦU SÁCH CHƯA ĐƯỢC UPLOAD LÊN WEB ---")
    for c, cnt in sorted(unmatched_by_cat.items(), key=lambda x: -x[1]):
        print(f"📁 {c}: {cnt} cuốn chưa upload")

if __name__ == "__main__":
    main()
