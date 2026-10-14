import os
import sys
import re
import json
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
import pypdfium2 as pdfium
import urllib.request
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

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
        config=Config(signature_version="s3v4", max_pool_connections=20),
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

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

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

def process_single_volume_pdf(s3, file_path, slug, chap_num):
    fname = os.path.basename(file_path)
    r2_prefix = f"comics/{slug}/chap-{chap_num}"
    doc = pdfium.PdfDocument(file_path)
    total_pages = len(doc)
    
    upload_tasks = []
    cover_data = None
    
    for page_idx in range(total_pages):
        page = doc[page_idx]
        pil_image = page.render(scale=1.4).to_pil()
        if pil_image.width > 1000:
            h = int((1000 / pil_image.width) * pil_image.height)
            pil_image = pil_image.resize((1000, h), Image.Resampling.LANCZOS)
        buf = BytesIO()
        pil_image.save(buf, "WEBP", quality=75)
        data = buf.getvalue()
        r2_key = f"{r2_prefix}/page-{page_idx+1:03d}.webp"
        upload_tasks.append((data, r2_key))
        if chap_num == 1 and page_idx == 0:
            cover_data = data
            
    page_urls = [None] * len(upload_tasks)
    with ThreadPoolExecutor(max_workers=8) as executor:
        fmap = {executor.submit(upload_buffer_r2, s3, item[0], item[1]): i for i, item in enumerate(upload_tasks)}
        for future in as_completed(fmap):
            idx = fmap[future]
            page_urls[idx] = future.result()
            
    return page_urls, cover_data

def ingest_sub_series(s3, title, slug, folder_path, author="Fujiko F. Fujio", genres=None, sample_limit=5):
    if not os.path.exists(folder_path):
        return
        
    print(f"\n=======================================================")
    print(f"📦 BẮT ĐẦU TÁCH BỘ TRUYỆN RIÊNG: {title}")
    print(f"=======================================================")
    
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(('.pdf', '.zip', '.cbz'))], key=natural_sort_key)
    if not files:
        # Check subfolders
        subfolders = [d for d in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, d))]
        print(f"  -> Thư mục con ({len(subfolders)}): {subfolders[:5]}")
        return
        
    print(f"  -> Tìm thấy {len(files)} tập trong phiên bản này.")
    
    # Tạo Story
    story_record = {
        "title": title,
        "slug": slug,
        "type": "comic",
        "description": f"Phiên bản đặc biệt {title} thuộc vũ trụ truyện tranh kinh điển, được tách riêng và phát hành chuẩn HD trên TruyenHub.",
        "cover_url": f"{R2_DOMAIN}/covers/{slug}.webp",
        "author_name": author,
        "status": "ongoing",
        "genres": genres or ["Truyện Tranh", "Manga", "Đang Cập Nhật"],
        "total_chapters": len(files)
    }
    
    res = supabase_upsert("stories", [story_record], on_conflict="slug")
    if not res:
        print(f"  ✗ Không thể tạo story {slug}")
        return
    story_id = res[0]["id"]
    
    # Nạp các tập đầu (hoặc toàn bộ)
    to_process = files[:sample_limit] if sample_limit else files
    for idx, fname in enumerate(to_process):
        chap_num = idx + 1
        fpath = os.path.join(folder_path, fname)
        print(f"  + [{chap_num}/{len(files)}] Đang bóc tách: {fname}...", flush=True)
        try:
            page_urls, cover_data = process_single_volume_pdf(s3, fpath, slug, chap_num)
            if cover_data and idx == 0:
                c_key = f"covers/{slug}.webp"
                upload_buffer_r2(s3, cover_data, c_key)
                
            ch_data = {
                "story_id": story_id,
                "chapter_number": chap_num,
                "title": f"Tập {chap_num} - {os.path.splitext(fname)[0]}",
                "is_locked": chap_num > 3,
                "price_coins": 10 if chap_num > 3 else 0,
                "pages_images": page_urls
            }
            supabase_upsert("chapters", [ch_data], on_conflict="story_id,chapter_number")
            print(f"    ✓ Xong Tập {chap_num}: {len(page_urls)} trang lên R2!", flush=True)
        except Exception as e:
            print(f"    ✗ Lỗi: {e}")
            
    # Cập nhật số tập thực tế đã nạp
    update_data = {
        "total_chapters": len(to_process),
        "status": "ongoing" if len(to_process) < len(files) else "completed"
    }
    url_up = f"{SUPABASE_URL}/rest/v1/stories?id=eq.{story_id}"
    req_up = urllib.request.Request(url_up, data=json.dumps(update_data).encode("utf-8"), headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }, method="PATCH")
    try:
        with urllib.request.urlopen(req_up) as resp:
            pass
    except Exception as e:
        print(f"Update story error: {e}")
    print(f"  🎉 Hoàn tất tách phiên bản: {title} ({len(to_process)}/{len(files)} tập)!")

def ingest_tkkg_series():
    tkkg_dir = r"F:\Truyện Chữ\# Truyện, Tiểu thuyết #\# Tứ quái TKKG"
    if not os.path.exists(tkkg_dir):
        return
    print(f"\n=======================================================")
    print(f"📚 BẮT ĐẦU NẠP TRỌN BỘ: Tứ Quái TKKG (70 Tập)")
    print(f"=======================================================")
    
    epubs = sorted([f for f in os.listdir(tkkg_dir) if f.lower().endswith(".epub")], key=natural_sort_key)
    print(f"  -> Tìm thấy {len(epubs)} tập TKKG.")
    
    s3 = get_s3()
    slug = "tu-quai-tkkg-tron-bo"
    cover_url = f"{R2_DOMAIN}/covers/novels/{slug}.webp"
    
    # Story
    story_record = {
        "title": "Tứ Quái TKKG (Trọn Bộ 70 Tập)",
        "slug": slug,
        "type": "novel",
        "description": "Bộ tiểu thuyết trinh thám thiếu nhi huyền thoại Tứ Quái TKKG của Stefan Wolf kể về nhóm bạn Tarzan, Karl, Klößchen và Gaby phá những vụ án kỳ bí.",
        "cover_url": cover_url,
        "author_name": "Stefan Wolf",
        "status": "completed",
        "genres": ["Trinh Thám", "Thiếu Nhi", "Vụ Án", "Tiểu Thuyết", "Truyện Chữ", "Hoàn Thành"],
        "total_chapters": len(epubs)
    }
    res = supabase_upsert("stories", [story_record], on_conflict="slug")
    if not res:
        return
    story_id = res[0]["id"]
    
    for idx, efname in enumerate(epubs):
        chap_num = idx + 1
        epath = os.path.join(tkkg_dir, efname)
        try:
            book = epub.read_epub(epath)
            texts = []
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_content(), "html.parser")
                    p_txt = soup.get_text(separator="\n\n").strip()
                    if len(p_txt) > 300:
                        texts.append(p_txt)
                        
            full_txt = "\n\n---\n\n".join(texts)
            ch_record = {
                "story_id": story_id,
                "chapter_number": chap_num,
                "title": f"Tập {chap_num} - {os.path.splitext(efname)[0]}",
                "is_locked": chap_num > 5,
                "price_coins": 5 if chap_num > 5 else 0,
                "content_text": full_txt
            }
            supabase_upsert("chapters", [ch_record], on_conflict="story_id,chapter_number")
            print(f"  ✓ Đã nạp TKKG Tập {chap_num}/{len(epubs)}: {efname}", flush=True)
        except Exception as e:
            print(f"  ✗ Lỗi TKKG {efname}: {e}")

def main():
    s3 = get_s3()
    
    # 1. Tách các phiên bản Doraemon
    dora_root = r"F:\Truyện Tranh\Truyện Tranh\Doraemon"
    sub_versions = [
        ("Doraemon - Truyện Ngắn (Kinh Điển)", "doraemon-truyen-ngan", os.path.join(dora_root, "Doraemon Truyện Ngắn"), ["Truyện Tranh", "Manga", "Hài Hước", "Thiếu Nhi", "Đang Cập Nhật"]),
        ("Doraemon - Truyện Dài (Điện Ảnh)", "doraemon-truyen-dai", os.path.join(dora_root, "Doraemon Truyện Dài"), ["Truyện Tranh", "Manga", "Phiêu Lưu", "Kỳ Ảo", "Đang Cập Nhật"]),
        ("Đội Quân Doraemon (Doraemon Quân Đội)", "doi-quan-doraemon", os.path.join(dora_root, "Doraemon Quân Đội"), ["Truyện Tranh", "Manga", "Hành Động", "Hài Hước", "Đang Cập Nhật"]),
        ("Doraemon Lite Edition", "doraemon-lite-edition", os.path.join(dora_root, "Doraemon Lite"), ["Truyện Tranh", "Manga", "Đang Cập Nhật"]),
    ]
    
    for title, slug, path, genres in sub_versions:
        ingest_sub_series(s3, title, slug, path, author="Fujiko F. Fujio", genres=genres, sample_limit=5)
        
    # 2. Tách Ô Long Viện
    olv_root = r"F:\Truyện Tranh\Truyện Tranh\Ô Long Viện"
    olv_versions = [
        ("Ô Long Viện - 12 Tập Bộ Kinh Điển", "o-long-vien-bo-kinh-dien", os.path.join(olv_root, "12 Tập-Bộ Kinh Điển"), ["Truyện Tranh", "Hài Hước", "Võ Thuật", "Đang Cập Nhật"]),
        ("Ô Long Viện - Linh Vật Sống", "o-long-vien-linh-vat-song", os.path.join(olv_root, "phần Linh Vật Sống-Bản PDF"), ["Truyện Tranh", "Phiêu Lưu", "Hài Hước", "Đang Cập Nhật"]),
        ("Ô Long Viện - Siêu Buồn Cười", "o-long-vien-sieu-buon-cuoi", os.path.join(olv_root, "phần Siêu Buồn Cười-Bản PDF"), ["Truyện Tranh", "Hài Hước", "Đang Cập Nhật"]),
        ("Ô Long Viện - Tình Huynh Đệ", "o-long-vien-tinh-huynh-de", os.path.join(olv_root, "phần Tình Huynh Đệ-Bản PDF"), ["Truyện Tranh", "Hài Hước", "Đời Thường", "Đang Cập Nhật"]),
    ]
    for title, slug, path, genres in olv_versions:
        ingest_sub_series(s3, title, slug, path, author="Au Yao-hsing", genres=genres, sample_limit=5)

    # 3. Tách Bác Sĩ Quái Dị (Black Jack)
    bj_root = r"F:\Truyện Tranh\Truyện Tranh\Bác Sĩ Quái Dị"
    bj_versions = [
        ("Bác Sĩ Quái Dị (Bản Kim Đồng 2006)", "bac-si-quai-di-kim-dong-2006", os.path.join(bj_root, "Version Cũ - Bác Sĩ Quái Dị - Kim Đồng 2006"), ["Truyện Tranh", "Manga", "Y Học", "Nhân Văn", "Đang Cập Nhật"]),
        ("Bác Sĩ Quái Dị (Bản Mới Full)", "bac-si-quai-di-ban-moi", os.path.join(bj_root, "Version Mới - Bác Sĩ Quái Dị"), ["Truyện Tranh", "Manga", "Y Học", "Đang Cập Nhật"]),
    ]
    for title, slug, path, genres in bj_versions:
        ingest_sub_series(s3, title, slug, path, author="Osamu Tezuka", genres=genres, sample_limit=5)

    # 4. Tách Jindo
    jindo_root = r"F:\Truyện Tranh\Truyện Tranh\Jindo - Cơn Lốc Sân Cỏ"
    jindo_versions = [
        ("Jindo 1 - Đường Dẫn Đến Khung Thành", "jindo-1-duong-dan-den-khung-thanh", os.path.join(jindo_root, "Jindo 1 - Cơn Lốc Sân Cỏ"), ["Truyện Tranh", "Thể Thao", "Bóng Đá", "Hài Hước", "Đang Cập Nhật"]),
        ("Jindo 2 - Cơn Lốc Sân Cỏ (Phần II)", "jindo-2-con-loc-san-co", os.path.join(jindo_root, "Jindo 2 - Cơn Lốc Sân Cỏ"), ["Truyện Tranh", "Thể Thao", "Bóng Đá", "Hài Hước", "Đang Cập Nhật"]),
    ]
    for title, slug, path, genres in jindo_versions:
        ingest_sub_series(s3, title, slug, path, author="Motoki Monma", genres=genres, sample_limit=5)

    # 5. Nạp trọn bộ Tứ Quái TKKG
    ingest_tkkg_series()

if __name__ == "__main__":
    main()
