import os
import sys
import json
import urllib.request
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

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
        print(f"Error fetching {endpoint}: {e}")
        return []

def scan_comics(base_dir=r"F:\Truyện Tranh"):
    comic_stories = []
    
    # We walk the directory. For each directory, if it contains comic files (.pdf, .zip, .cbz, .cbr, .rar, or images),
    # or if its subdirectories contain them.
    for root, dirs, files in os.walk(base_dir):
        comic_files = [f for f in files if f.lower().endswith(('.pdf', '.zip', '.cbz', '.cbr', '.rar'))]
        image_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        
        # If this directory contains comic files directly
        if comic_files:
            rel_path = os.path.relpath(root, base_dir)
            comic_stories.append({
                "path": root,
                "rel_path": rel_path,
                "folder_name": os.path.basename(root),
                "parent": os.path.basename(os.path.dirname(root)),
                "type": "archive_or_pdf",
                "count": len(comic_files),
                "exts": list(set(os.path.splitext(f)[1].lower() for f in comic_files)),
                "sample_files": comic_files[:3]
            })
        elif image_files and len(image_files) > 5:
            # Maybe a standalone chapter folder of raw images
            rel_path = os.path.relpath(root, base_dir)
            comic_stories.append({
                "path": root,
                "rel_path": rel_path,
                "folder_name": os.path.basename(root),
                "parent": os.path.basename(os.path.dirname(root)),
                "type": "raw_images",
                "count": len(image_files),
                "exts": list(set(os.path.splitext(f)[1].lower() for f in image_files)),
                "sample_files": image_files[:3]
            })
            
    return comic_stories

def scan_novels(base_dir=r"F:\Truyện Chữ"):
    novel_entries = []
    book_exts = ('.epub', '.mobi', '.prc', '.pdf', '.txt', '.doc', '.docx', '.azw3')
    
    for root, dirs, files in os.walk(base_dir):
        ebooks = [f for f in files if f.lower().endswith(book_exts)]
        if ebooks:
            rel_path = os.path.relpath(root, base_dir)
            novel_entries.append({
                "path": root,
                "rel_path": rel_path,
                "folder_name": os.path.basename(root),
                "count": len(ebooks),
                "exts": list(set(os.path.splitext(f)[1].lower() for f in ebooks)),
                "sample_files": ebooks[:5]
            })
            
    return novel_entries

def main():
    print("=================================================================")
    print("🔍 BẮT ĐẦU QUÉT TOÀN BỘ DỮ LIỆU TRÊN Ổ ĐĨA F: (TRUYỆN TRANH & TRUYỆN CHỮ)")
    print("=================================================================")
    
    # 1. Fetch Supabase Data
    print("-> Đang tải danh sách Stories từ Supabase...")
    db_stories = supabase_get("stories?select=id,title,slug,type,total_chapters,status,genres")
    print(f"✓ Đã tải {len(db_stories)} stories từ Supabase.")
    
    print("-> Đang kiểm tra số chương thực tế trong bảng chapters...")
    db_chapters = supabase_get("chapters?select=story_id,chapter_number")
    chap_counts = {}
    for c in db_chapters:
        sid = c["story_id"]
        chap_counts[sid] = chap_counts.get(sid, 0) + 1
        
    print(f"✓ Đã thống kê {len(db_chapters)} chapters thực tế trong cơ sở dữ liệu.")
    
    # 2. Scan Comics on PC
    print("\n-> Đang quét chi tiết thư mục 'F:\\Truyện Tranh'...")
    comics_pc = scan_comics()
    print(f"✓ Tìm thấy {len(comics_pc)} thư mục chứa file truyện tranh trên PC.")
    
    # 3. Scan Novels on PC
    print("\n-> Đang quét chi tiết thư mục 'F:\\Truyện Chữ'...")
    novels_pc = scan_novels()
    total_ebooks_pc = sum(n["count"] for n in novels_pc)
    print(f"✓ Tìm thấy {len(novels_pc)} thư mục chứa sách/truyện chữ trên PC (Tổng cộng {total_ebooks_pc} đầu sách/tập).")
    
    # Save raw audit output to json for analysis
    audit_data = {
        "db_stories": db_stories,
        "db_chap_counts": chap_counts,
        "comics_pc": comics_pc,
        "novels_pc": novels_pc
    }
    with open(r"scripts\audit_result.json", "w", encoding="utf-8") as f:
        json.dump(audit_data, f, ensure_ascii=False, indent=2)
        
    print("\n✓ Đã ghi kết quả quét vào file scripts/audit_result.json")

if __name__ == "__main__":
    main()
