"""
SCRIPT BÓC TÁCH DỮ LIỆU TỰ ĐỘNG CHO TRUYENHUB
- Xử lý 7GB Truyện Chữ (F:\Truyện Chữ): bóc tách .epub thành từng chương text sạch
- Xử lý 125GB Truyện Tranh (F:\Truyện Tranh): nén WebP 80%, đẩy Cloudflare R2
- Đẩy dữ liệu Metadata và Chương vào Database Supabase
"""

import os
import re
import json
import uuid
import boto3
from botocore.config import Config
from PIL import Image
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from supabase import create_client, Client

# Đường dẫn thư mục dữ liệu nguồn
NOVEL_ROOT = r"F:\Truyện Chữ"
MANGA_ROOT = r"F:\Truyện Tranh" if os.path.exists(r"F:\Truyện Tranh") else r"G:\Truyện Tranh"

# ==========================================
# CẤU HÌNH THÔNG SỐ (THAY THẾ BẰNG KEY CỦA BẠN)
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

# Cloudflare R2 Config (S3 Compatible)
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "your-account-id")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "your-access-key")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "your-secret-key")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "truyenhub-media")
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN", "https://pub-yourid.r2.dev")

# Khởi tạo R2 S3 Client
s3_client = boto3.client(
    service_name="s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto"
) if R2_ACCESS_KEY_ID != "your-access-key" else None


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
    return text


# ==========================================
# 1. BÓC TÁCH FILE TRUYỆN CHỮ (.EPUB)
# ==========================================
def process_epub_file(epub_path, free_chapters_count=3, coin_price_per_chapter=5):
    """
    Đọc file .epub, bóc tách từng chương, tự động đặt khóa thu phí từ chương thứ 4
    """
    print(f"\n[+] Đang xử lý truyện chữ: {os.path.basename(epub_path)}")
    book = epub.read_epub(epub_path)
    
    # Lấy tiêu đề & tác giả từ metadata
    title = book.get_metadata('DC', 'title')
    title = title[0][0] if title else os.path.splitext(os.path.basename(epub_path))[0]
    
    author = book.get_metadata('DC', 'creator')
    author = author[0][0] if author else "Đang cập nhật"

    slug = slugify(title)
    chapters = []
    chapter_num = 1

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            soup = BeautifulSoup(item.get_content(), 'html.parser')
            
            # Tìm tiêu đề chương
            h_tag = soup.find(['h1', 'h2', 'h3'])
            ch_title = h_tag.get_text().strip() if h_tag else f"Chương {chapter_num}"

            # Lấy text sạch
            paras = [p.get_text().strip() for p in soup.find_all('p') if p.get_text().strip()]
            content = "\n\n".join(paras)

            # Lọc bỏ trang bìa, mục lục quá ngắn
            if len(content) > 200:
                is_locked = chapter_num > free_chapters_count
                chapters.append({
                    "chapter_number": chapter_num,
                    "title": ch_title,
                    "content_text": content,
                    "is_locked": is_locked,
                    "price_coins": coin_price_per_chapter if is_locked else 0
                })
                chapter_num += 1

    print(f"  -> Bóc tách thành công {len(chapters)} chương.")
    return {
        "title": title,
        "slug": slug,
        "type": "novel",
        "author_name": author,
        "total_chapters": len(chapters),
        "chapters": chapters
    }


# ==========================================
# 2. XỬ LÝ & NÉN ẢNH TRUYỆN TRANH SANG WEBP
# ==========================================
def compress_and_upload_manga_chapter(chapter_folder, story_slug, chapter_num):
    """
    Nén toàn bộ ảnh trong 1 chương sang WebP (giảm 70% dung lượng)
    và tải lên Cloudflare R2 bucket
    """
    print(f"\n[+] Đang nén truyện tranh: {story_slug} - Chương {chapter_num}")
    image_extensions = ('.jpg', '.jpeg', '.png', '.webp')
    images = sorted([f for f in os.listdir(chapter_folder) if f.lower().endswith(image_extensions)])
    
    uploaded_urls = []
    
    for idx, img_name in enumerate(images):
        raw_path = os.path.join(chapter_folder, img_name)
        out_webp_path = os.path.join(chapter_folder, f"_temp_page_{idx+1:03d}.webp")

        # Nén bằng PIL
        with Image.open(raw_path) as img:
            # Chuẩn hóa về Webtoon width tối đa 1080px
            if img.width > 1080:
                new_h = int((1080 / img.width) * img.height)
                img = img.resize((1080, new_h), Image.Resampling.LANCZOS)
            
            img.save(out_webp_path, "WEBP", quality=80, method=6)

        # Upload lên Cloudflare R2 (nếu đã cấu hình key)
        r2_key = f"comics/{story_slug}/chap_{chapter_num}/page_{idx+1:03d}.webp"
        if s3_client:
            s3_client.upload_file(
                out_webp_path,
                R2_BUCKET_NAME,
                r2_key,
                ExtraArgs={"ContentType": "image/webp", "CacheControl": "public, max-age=31536000"}
            )
            uploaded_urls.append(f"{R2_PUBLIC_DOMAIN}/{r2_key}")
        else:
            uploaded_urls.append(f"/mock_storage/{r2_key}")

        # Xóa file tạm
        if os.path.exists(out_webp_path):
            os.remove(out_webp_path)

    print(f"  -> Hoàn thành {len(uploaded_urls)} trang ảnh WebP.")
    return uploaded_urls


# ==========================================
# VÍ DỤ CHẠY THỬ NGHIỆM VỚI DỮ LIỆU CỦA BẠN
# ==========================================
if __name__ == "__main__":
    print("=" * 60)
    print("TRUYENHUB LOCAL DATA INGESTION ENGINE")
    print("=" * 60)
    
    # 1. Thử bóc tách 1 truyện chữ trong ổ F:
    sample_epub = r"F:\Truyện Chữ\# Chan Ho Kei\Biến tấu Diogenes - Chan Ho Kei.epub"
    if os.path.exists(sample_epub):
        novel_data = process_epub_file(sample_epub, free_chapters_count=3, coin_price_per_chapter=5)
        print(f"Kết quả mẫu: Truyện '{novel_data['title']}' có {novel_data['total_chapters']} chương.")
        print(f"Chương 1 Free: {novel_data['chapters'][0]['title']}")
        if len(novel_data['chapters']) > 3:
            print(f"Chương 4 VIP: {novel_data['chapters'][3]['title']} (Giá: {novel_data['chapters'][3]['price_coins']} xu)")
    else:
        print(f"[!] Không tìm thấy file mẫu tại {sample_epub}, hãy kiểm tra lại đường dẫn ổ F:")
