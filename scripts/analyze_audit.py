import json
import os
import sys
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

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

with open(r"scripts\audit_result.json", "r", encoding="utf-8") as f:
    data = json.load(f)

db_stories = data["db_stories"]
comics_pc = data["comics_pc"]
novels_pc = data["novels_pc"]

db_slugs = {s["slug"]: s for s in db_stories}
db_titles = {s["title"].lower(): s for s in db_stories}

print("==========================================================================")
print("📊 BÁO CÁO PHÂN TÍCH TOÀN DIỆN THƯ MỤC TRUYỆN TRANH & TRUYỆN CHỮ TRÊN PC")
print("==========================================================================")

# 1. PHÂN TÍCH TRUYỆN TRANH
print("\n" + "="*50)
print("1. CHI TIẾT KHO TRUYỆN TRANH (F:\\Truyện Tranh)")
print("="*50)

# Group comics by top-level folder
top_level_comics = {}
for c in comics_pc:
    parts = c["rel_path"].split(os.sep)
    top_dir = parts[0]
    if top_dir not in top_level_comics:
        top_level_comics[top_dir] = []
    top_level_comics[top_dir].append(c)

print(f"Tổng số bộ truyện tranh cấp 1 (Top-level Series): {len(top_level_comics)} bộ")
print(f"Tổng số thư mục con / phiên bản bóc tách: {len(comics_pc)} thư mục\n")

# Identify multi-version or complex series
complex_series = {k: v for k, v in top_level_comics.items() if len(v) > 1}
simple_series = {k: v for k, v in top_level_comics.items() if len(v) == 1}

print(f"-> Trong đó:")
print(f"   • {len(complex_series)} bộ có cấu trúc phức tạp / nhiều phiên bản / thư mục con lồng nhau.")
print(f"   • {len(simple_series)} bộ là cấu trúc đơn lẻ 1 thư mục chứa các tập.")

print("\n--- [DANH SÁCH CÁC BỘ CÓ NHIỀU PHIÊN BẢN / THƯ MỤC CON LỒNG NHAU] ---")
for top_dir, subs in sorted(complex_series.items()):
    total_files = sum(s["count"] for s in subs)
    print(f"\n📂 {top_dir} (Tổng {total_files} file trong {len(subs)} nhánh):")
    for s in subs:
        rel = s["rel_path"]
        print(f"   └── Sub: {rel} ({s['count']} file {s['exts']})")

# 2. PHÂN TÍCH TRUYỆN CHỮ
print("\n" + "="*50)
print("2. CHI TIẾT KHO TRUYỆN CHỮ & SÁCH (F:\\Truyện Chữ)")
print("="*50)

# Group novels by top-level category folder
top_level_novels = {}
for n in novels_pc:
    parts = n["rel_path"].split(os.sep)
    top_cat = parts[0]
    if top_cat not in top_level_novels:
        top_level_novels[top_cat] = []
    top_level_novels[top_cat].append(n)

print(f"Tổng số danh mục lớn (Top-level Categories): {len(top_level_novels)} danh mục")
print(f"Tổng số thư mục truyện/sách: {len(novels_pc)} thư mục")
total_books = sum(n["count"] for n in novels_pc)
print(f"Tổng số đầu sách / tập truyện chữ: {total_books} files\n")

print("--- [DANH MỤC LỚN TRONG F:\\Truyện Chữ] ---")
for top_cat, subs in sorted(top_level_novels.items()):
    cat_files = sum(s["count"] for s in subs)
    print(f"\n📁 [{top_cat}] ({cat_files} files trong {len(subs)} thư mục con):")
    for s in subs[:6]:
        print(f"   ├── {s['folder_name']}: {s['count']} files ({', '.join(s['exts'])})")
    if len(subs) > 6:
        print(f"   └── ... và {len(subs) - 6} thư mục khác")

# Check status in Database
print("\n" + "="*50)
print("3. ĐỐI SOÁT VỚI CƠ SỞ DỮ LIỆU HIỆN TẠI TRÊN WEBSITE")
print("="*50)

uploaded_comics_count = 0
unuploaded_comics = []

for top_dir, subs in top_level_comics.items():
    s_slug = slugify(top_dir)
    matched = False
    for slug in db_slugs:
        if s_slug in slug or slug in s_slug:
            matched = True
            break
    if matched:
        uploaded_comics_count += 1
    else:
        unuploaded_comics.append(top_dir)

print(f"Truyện tranh: Đã tạo trên web: {uploaded_comics_count}/{len(top_level_comics)} bộ")
print(f"Truyện tranh chưa có trên web: {len(unuploaded_comics)} bộ")
if unuploaded_comics:
    print(f"   Ví dụ các bộ chưa có: {unuploaded_comics[:15]}")
