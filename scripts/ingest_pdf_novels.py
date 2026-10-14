import os
import sys
import re
import json
from io import BytesIO
from PIL import Image
import boto3
from botocore.config import Config
import pypdfium2 as pdfium
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def load_env(filepath=r"F:\Antigravity\truyenhub\.env.local"):
    env = {}
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip("\"'")
    return env

ENV = load_env()
R2_BUCKET = ENV.get("R2_BUCKET_NAME", "truyenhub-media")
R2_DOMAIN = ENV.get("R2_PUBLIC_DOMAIN", "https://pub-96c72b024c5547b594279f6245a7a6a5.r2.dev").rstrip("/")
SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

def get_s3():
    return boto3.client(
        service_name="s3",
        endpoint_url=f"https://{ENV.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=ENV.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=ENV.get("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def slugify(text):
    text = text.lower().strip()
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

def upload_buffer_r2(s3, buffer, r2_key, content_type="image/webp"):
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=buffer,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable"
    )
    return f"{R2_DOMAIN}/{r2_key}"

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
        print(f"Supabase upsert error: {e}", flush=True)
        return None

def process_pdf_book(pdf_path, folder_name, s3):
    fname = os.path.basename(pdf_path)
    base_name = os.path.splitext(fname)[0]
    slug = slugify(base_name)
    
    # 1. Render cover (Page 1)
    doc = pdfium.PdfDocument(pdf_path)
    total_pages = len(doc)
    if total_pages == 0:
        return None
        
    cover_page = doc[0]
    cover_img = cover_page.render(scale=1.5).to_pil()
    if cover_img.width > 600:
        h = int((600 / cover_img.width) * cover_img.height)
        cover_img = cover_img.resize((600, h), Image.Resampling.LANCZOS)
    c_buf = BytesIO()
    cover_img.save(c_buf, "WEBP", quality=80)
    cover_url = upload_buffer_r2(s3, c_buf.getvalue(), f"covers/novels/{slug}.webp")
    
    # 2. Extract chapters
    # We group pages into chapters (~10-15 pages per chapter or by chapter markers)
    pages_text = []
    for i in range(total_pages):
        t = doc[i].get_textpage().get_text_range()
        pages_text.append(t.strip())
        
    full_text = "\n\n".join(p for p in pages_text if p)
    if len(full_text.strip()) < 100:
        # Scanned PDF without OCR text, skip or placeholder
        print(f"  [i] {fname}: PDF dạng ảnh scan, văn bản ngắn ({len(full_text)} ký tự)")
        return None
        
    # Group text into chapters
    chapters = []
    chunk_size = 10  # 10 pages per chapter
    for ch_idx, p_start in enumerate(range(0, total_pages, chunk_size)):
        ch_pages = pages_text[p_start:p_start + chunk_size]
        ch_text = "\n\n".join(p for p in ch_pages if p)
        if len(ch_text.strip()) < 50:
            continue
        ch_num = len(chapters) + 1
        is_locked = ch_num > 3
        chapters.append({
            "chapter_number": ch_num,
            "title": f"Phần {ch_num} (Trang {p_start+1} - {min(p_start+chunk_size, total_pages)})",
            "is_locked": is_locked,
            "price_coins": 5 if is_locked else 0,
            "content_text": ch_text
        })
        
    # Determine genres and author
    author = "Nhiều tác giả"
    genres = set(["Sách", "Truyện Chữ"])
    f_low = folder_name.lower()
    if "tâm lý" in f_low:
        genres.update(["Tâm Lý Học", "Kỹ Năng Sống"])
    elif "thay đổi bản thân" in f_low:
        genres.update(["Phát Triển Bản Thân", "Kỹ Năng Sống"])
    elif "business" in f_low or "harvard" in f_low:
        genres.update(["Kinh Tế", "Quản Trị Kinh Doanh"])
    elif "donato" in f_low:
        author = "Donato Carrisi"
        genres.update(["Trinh Thám", "Kinh Dị"])
    elif "harry potter" in f_low:
        author = "J.K. Rowling"
        genres.update(["Tiểu Thuyết", "Kỳ Ảo", "Phiêu Lưu"])
        
    story_record = {
        "title": base_name,
        "slug": slug,
        "type": "novel",
        "description": f"Cuốn sách {base_name} tuyển tập từ kho tàng {folder_name}, phát hành chính thức trên TruyenHub.",
        "cover_url": cover_url,
        "author_name": author,
        "status": "completed",
        "genres": sorted(list(genres)),
        "total_chapters": len(chapters)
    }
    
    res = supabase_upsert("stories", [story_record], on_conflict="slug")
    if res and len(res) > 0:
        story_id = res[0]["id"]
        for c_i in range(0, len(chapters), 10):
            batch = []
            for ch in chapters[c_i:c_i+10]:
                batch.append({
                    "story_id": story_id,
                    "chapter_number": ch["chapter_number"],
                    "title": ch["title"],
                    "is_locked": ch["is_locked"],
                    "price_coins": ch["price_coins"],
                    "content_text": ch["content_text"]
                })
            supabase_upsert("chapters", batch, on_conflict="story_id,chapter_number")
        print(f"  ✓ Đã nạp sách PDF: {base_name[:35]} ({len(chapters)} phần, {total_pages} trang)", flush=True)
        return True
    return False

def main():
    s3 = get_s3()
    pdf_folders = [
        r"F:\Truyện Chữ\# 50 Ebooks THAY ĐỔI BẢN THÂN",
        r"F:\Truyện Chữ\# 12 sách hay về TÂM LÝ HỌC (pdf )",
        r"F:\Truyện Chữ\# Harvard Business Review",
        r"F:\Truyện Chữ\# Donato Carrisi",
        r"F:\Truyện Chữ\# Harry Potter pdf"
    ]
    
    print("🚀 Bắt đầu quét và nạp các bộ sách PDF đặc biệt...")
    total_added = 0
    for fdir in pdf_folders:
        if not os.path.exists(fdir):
            continue
        fname_folder = os.path.basename(fdir)
        print(f"\n=== Đang xử lý thư mục: {fname_folder} ===")
        files = [f for f in os.listdir(fdir) if f.lower().endswith(".pdf")]
        for idx, f in enumerate(files):
            p = os.path.join(fdir, f)
            try:
                res = process_pdf_book(p, fname_folder, s3)
                if res:
                    total_added += 1
            except Exception as e:
                print(f"  ✗ Lỗi file {f}: {e}")
                
    print(f"\n🎉 HOÀN TẤT NẠP SÁCH PDF: Đã nạp thành công {total_added} cuốn sách mới!")

if __name__ == "__main__":
    main()
