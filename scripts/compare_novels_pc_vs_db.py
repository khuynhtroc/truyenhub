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
    stories = supabase_get("stories?type=eq.novel&select=id,title,slug,total_chapters,author_name")
    print(f"Total novel stories in Supabase: {len(stories)}")
    
    db_slugs = set(s["slug"] for s in stories)
    db_titles = set(s["title"].lower() for s in stories)
    
    novel_base = r"F:\Truyện Chữ"
    book_exts = ('.epub', '.mobi', '.prc', '.pdf', '.txt', '.doc', '.docx', '.azw3')
    
    categories = []
    
    for item in sorted(os.listdir(novel_base)):
        p = os.path.join(novel_base, item)
        if not os.path.isdir(p):
            continue
            
        books = []
        for root, dirs, files in os.walk(p):
            for f in files:
                if f.lower().endswith(book_exts):
                    books.append({
                        "file": f,
                        "ext": os.path.splitext(f)[1].lower(),
                        "path": os.path.join(root, f),
                        "rel": os.path.relpath(os.path.join(root, f), novel_base)
                    })
                    
        categories.append({
            "category": item,
            "count": len(books),
            "books": books
        })
        
    print(f"Scanned {len(categories)} categories in F:\\Truyện Chữ.")
    
    # Save detailed data
    with open(r"scripts\novels_audit_detailed.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)
        
    print("\n=========================================================================")
    print("📖 THỐNG KÊ CHI TIẾT KHO TRUYỆN CHỮ & SÁCH TRÊN PC")
    print("=========================================================================")
    
    total_books = sum(c["count"] for c in categories)
    print(f"Tổng số sách/ebook/truyện chữ trên PC: {total_books} files qua {len(categories)} thư mục.\n")
    
    for c in categories:
        print(f"📁 {c['category']}: {c['count']} files")
        
if __name__ == "__main__":
    main()
