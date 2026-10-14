import os
import sys
import json
import urllib.request
import re
import shutil
import tempfile
from bs4 import BeautifulSoup
from ebooklib import epub
import ebooklib
import mobi
import pypdfium2 as pdfium

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"
R2_DOMAIN = "https://pub-96c72b024c5547b594279f6245a7a6a5.r2.dev"

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
        print(f"Error fetching {endpoint}: {e}", flush=True)
        return []

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
        print(f"Supabase upsert error on {table}: {e}", flush=True)
        return None

def clean_html_text(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    for tag in soup(["script", "style", "meta", "link", "noscript"]):
        tag.decompose()
    text = soup.get_text("\n\n")
    # Clean whitespace
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return "\n\n".join(lines)

def parse_epub_book(file_path):
    book = epub.read_epub(file_path)
    title = ""
    author = "Khuyết Danh"
    
    t_meta = book.get_metadata('DC', 'title')
    if t_meta:
        title = t_meta[0][0].strip()
    c_meta = book.get_metadata('DC', 'creator')
    if c_meta:
        author = c_meta[0][0].strip()
        
    docs = [item for item in book.get_items() if item.get_type() == ebooklib.ITEM_DOCUMENT]
    chapters = []
    
    for i, doc in enumerate(docs):
        raw_html = doc.get_body_content()
        soup = BeautifulSoup(raw_html, "html.parser")
        text = clean_html_text(str(soup))
        if len(text) < 80 and not soup.find(['h1', 'h2', 'h3']):
            continue
            
        h = soup.find(['h1', 'h2', 'h3', 'title'])
        chap_title = h.get_text().strip() if h else f"Chương {len(chapters) + 1}"
        chap_title = chap_title.replace("\n", " ").strip()
        if len(chap_title) > 80:
            chap_title = chap_title[:75] + "..."
            
        chapters.append({
            "title": chap_title or f"Chương {len(chapters) + 1}",
            "content": text
        })
        
    return title, author, chapters

def parse_mobi_book(file_path):
    tempdir, filepath = mobi.extract(file_path)
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
            
        # Split by pagebreak or chapter headers
        if '<mbp:pagebreak/>' in html or '<mbp:pagebreak' in html:
            raw_parts = re.split(r'<mbp:pagebreak[^>]*>', html, flags=re.IGNORECASE)
        else:
            raw_parts = re.split(r'(?i)(?=<h[1-3][^>]*>)', html)
            
        chapters = []
        for p in raw_parts:
            text = clean_html_text(p)
            if len(text) < 150:
                continue
            first_line = text.split("\n")[0].strip()
            chap_title = first_line if len(first_line) < 70 else f"Chương {len(chapters) + 1}"
            chapters.append({
                "title": chap_title,
                "content": text
            })
            
        # If no pagebreaks or couldn't split, split into ~3000-word sections
        if len(chapters) <= 1:
            full_text = clean_html_text(html)
            words = full_text.split()
            chunk_size = 2500
            chapters = []
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size])
                chapters.append({
                    "title": f"Chương {len(chapters) + 1}",
                    "content": chunk
                })
                
        return "", "", chapters
    finally:
        shutil.rmtree(tempdir, ignore_errors=True)

def parse_pdf_text_book(file_path):
    doc = pdfium.PdfDocument(file_path)
    total_pages = len(doc)
    
    pages_text = []
    for i in range(total_pages):
        page = doc[i]
        text_page = page.get_textpage()
        t = text_page.get_text_range().strip()
        if t:
            pages_text.append(t)
            
    full_text = "\n\n".join(pages_text)
    if len(full_text) < 300:
        return "", "", []
        
    # Split by Chapter / Chương / Hồi
    parts = re.split(r'(?i)(?=(?:Chương|Hồi|Phần|Chapter)\s+[0-9IVXLCDM]+)', full_text)
    chapters = []
    if len(parts) > 2:
        for p in parts:
            p = p.strip()
            if len(p) < 100:
                continue
            first_line = p.split("\n")[0].strip()
            chap_title = first_line if len(first_line) < 70 else f"Chương {len(chapters) + 1}"
            chapters.append({
                "title": chap_title,
                "content": p
            })
    else:
        # Group every 10-15 pages into a chapter
        chunk_pages = 10
        for i in range(0, len(pages_text), chunk_pages):
            chunk = "\n\n".join(pages_text[i:i + chunk_pages])
            chapters.append({
                "title": f"Hồi / Chương {len(chapters) + 1} (Trang {i+1}-{min(i+chunk_pages, len(pages_text))})",
                "content": chunk
            })
            
    return "", "", chapters

def detect_genre(cat_name, title):
    genres = ["Truyện Chữ"]
    cat_lower = cat_name.lower()
    title_lower = title.lower()
    
    if "trinh thám" in cat_lower or "hình sự" in cat_lower or "án mạng" in cat_lower or "điều tra" in cat_lower:
        genres.extend(["Trinh Thám", "Hình Sự", "Kinh Dị"])
    elif "kiếm hiệp" in cat_lower or "tiên hiệp" in cat_lower or "huyền huyễn" in cat_lower:
        genres.extend(["Kiếm Hiệp", "Tiên Hiệp", "Kỳ Ảo"])
    elif "tâm lý" in cat_lower or "thay đổi bản thân" in cat_lower or "kỹ năng" in cat_lower:
        genres.extend(["Sách", "Tâm Lý Học", "Kỹ Năng", "Phát Triển Bản Thân"])
    elif "kinh tế" in cat_lower or "harvard" in cat_lower or "quản trị" in cat_lower:
        genres.extend(["Sách", "Kinh Tế - Quản Trị", "Kỹ Năng"])
    elif "tiếng anh" in cat_lower or "english" in cat_lower:
        genres.extend(["Tiếng Anh", "Văn Học Nước Ngoài"])
    elif "nguyễn nhật ánh" in cat_lower or "tuổi học trò" in cat_lower or "thiếu nhi" in cat_lower:
        genres.extend(["Tuổi Học Trò", "Văn Học Việt Nam", "Tiểu Thuyết"])
    elif "thích nhất hạnh" in cat_lower or "osho" in cat_lower or "phật giáo" in cat_lower:
        genres.extend(["Sách", "Triết Học - Tâm Linh", "Chữa Lành"])
    else:
        genres.append("Tiểu Thuyết")
        
    return list(dict.fromkeys(genres))

def clean_title_author(filename, folder_name):
    base = os.path.splitext(filename)[0]
    base = re.sub(r'\[.*?\]|\(.*?\)', '', base).strip()
    
    author = "Khuyết Danh"
    title = base
    
    # Common format: "Title - Author"
    if " - " in base:
        parts = base.split(" - ")
        title = parts[0].strip()
        author = parts[1].strip()
    elif folder_name.startswith("# "):
        # e.g. # Higashino Keigo
        author = folder_name.replace("#", "").strip()
        
    return title or base, author or "Khuyết Danh"

def main():
    print("=========================================================================")
    print("🚀 BẮT ĐẦU NẠP TỰ ĐỘNG CÁC ĐẦU SÁCH TRUYỆN CHỮ CÒN SÓT VÀO HỆ THỐNG")
    print("=========================================================================")
    
    # 1. Load unmatched books list
    novel_base = r"F:\Truyện Chữ"
    book_exts = ('.epub', '.mobi', '.prc', '.pdf')
    
    # Query current DB stories
    db_stories = supabase_get("stories?type=eq.novel&select=id,title,slug")
    existing_slugs = set(s["slug"] for s in db_stories)
    print(f"Hiện có {len(existing_slugs)} truyện chữ trong Supabase.")
    
    # Priority folders to ingest first
    priority_folders = [
        r"F:\Truyện Chữ\# Hình Sự, Trinh Thám",
        r"F:\Truyện Chữ\# Truyện, Tiểu thuyết #\# Kiếm Hiệp",
        r"F:\Truyện Chữ\# Truyện, Tiểu thuyết #",
        r"F:\Truyện Chữ\# Nguyễn Nhật Ánh",
        r"F:\Truyện Chữ\# Higashino Keigo",
        r"F:\Truyện Chữ\# Thích Nhất Hạnh",
        r"F:\Truyện Chữ\# 50 Ebooks THAY ĐỔI BẢN THÂN",
        r"F:\Truyện Chữ\# 12 sách hay về TÂM LÝ HỌC (pdf )",
        r"F:\Truyện Chữ\# Harvard Business Review"
    ]
    
    to_ingest = []
    
    # First gather priority folders
    for pf in priority_folders:
        if not os.path.exists(pf):
            continue
        for root, dirs, files in os.walk(pf):
            for f in files:
                if f.lower().endswith(book_exts):
                    to_ingest.append(os.path.join(root, f))
                    
    # Then gather rest of F:\Truyện Chữ
    for root, dirs, files in os.walk(novel_base):
        for f in files:
            if f.lower().endswith(book_exts):
                full_p = os.path.join(root, f)
                if full_p not in to_ingest:
                    to_ingest.append(full_p)
                    
    print(f"Tổng số sách cần duyệt qua: {len(to_ingest)} files.")
    
    success_count = 0
    skipped_count = 0
    error_count = 0
    
    for idx, fpath in enumerate(to_ingest):
        fname = os.path.basename(fpath)
        folder_name = os.path.basename(os.path.dirname(fpath))
        ext = os.path.splitext(fname)[1].lower()
        
        parsed_title, parsed_author = clean_title_author(fname, folder_name)
        slug = slugify(parsed_title)
        
        if not slug or len(slug) < 2:
            slug = slugify(os.path.splitext(fname)[0])
            
        if slug in existing_slugs:
            skipped_count += 1
            continue
            
        print(f"\n[{idx+1}/{len(to_ingest)}] Đang xử lý: {fname}...", flush=True)
        
        try:
            chapters = []
            if ext == '.epub':
                meta_t, meta_a, chapters = parse_epub_book(fpath)
                if meta_t: parsed_title = meta_t
                if meta_a: parsed_author = meta_a
            elif ext in ('.mobi', '.prc'):
                _, _, chapters = parse_mobi_book(fpath)
            elif ext == '.pdf':
                _, _, chapters = parse_pdf_text_book(fpath)
                
            if not chapters:
                print(f"   ⚠️ Không trích xuất được text/chương từ {ext}, bỏ qua.", flush=True)
                error_count += 1
                continue
                
            genres = detect_genre(folder_name, parsed_title)
            
            # Create Story
            story_data = {
                "title": parsed_title,
                "slug": slug,
                "type": "novel",
                "description": f"Tác phẩm {parsed_title} của tác giả {parsed_author}. Đọc bản full chuẩn với giọng đọc AI phong phú trên TruyenHub.",
                "cover_url": f"{R2_DOMAIN}/covers/novel-default.webp",
                "author_name": parsed_author,
                "status": "completed",
                "genres": genres,
                "total_chapters": len(chapters)
            }
            
            res = supabase_upsert("stories", [story_data], on_conflict="slug")
            if not res:
                print(f"   ✗ Lỗi tạo story {slug}", flush=True)
                error_count += 1
                continue
                
            story_id = res[0]["id"]
            existing_slugs.add(slug)
            
            # Batch upsert chapters
            batch_size = 50
            chap_records = []
            for ch_idx, ch in enumerate(chapters):
                chap_records.append({
                    "story_id": story_id,
                    "chapter_number": ch_idx + 1,
                    "title": ch["title"] or f"Chương {ch_idx + 1}",
                    "content_text": ch["content"],
                    "is_locked": False,
                    "price_coins": 0
                })
                
            for b_idx in range(0, len(chap_records), batch_size):
                batch = chap_records[b_idx:b_idx + batch_size]
                supabase_upsert("chapters", batch, on_conflict="story_id,chapter_number")
                
            print(f"   ✓ Đã nạp thành công '{parsed_title}' ({len(chapters)} chương, {parsed_author})!", flush=True)
            success_count += 1
            
        except Exception as e:
            print(f"   ✗ Lỗi ngoại lệ: {e}", flush=True)
            error_count += 1
            
    print("\n=========================================================================")
    print(f"🎉 HOÀN TẤT NẠP TRUYỆN CHỮ!")
    print(f"   • Thành công mới: {success_count} bộ")
    print(f"   • Đã tồn tại sẵn (Bỏ qua): {skipped_count} bộ")
    print(f"   • Bị lỗi/Không parse được: {error_count} bộ")
    print("=========================================================================")

if __name__ == "__main__":
    main()
