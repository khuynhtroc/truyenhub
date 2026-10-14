import os
import sys
import re
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0"

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

AUTHOR_FOLDERS = {
    "higashino keigo": ("Higashino Keigo", ["Trinh Thám", "Văn Học Nhật Bản", "Suy Luận"]),
    "banana yoshimoto": ("Banana Yoshimoto", ["Văn Học Nhật Bản", "Lãng Mạn", "Đời Thường"]),
    "carl gustav jung": ("Carl Gustav Jung", ["Tâm Lý Học", "Triết Học", "Sách"]),
    "chan ho kei": ("Trần Hạo Cơ", ["Trinh Thám", "Vụ Án"]),
    "cho chang-in": ("Cho Chang-in", ["Văn Học Hàn Quốc", "Gia Đình", "Cảm Động"]),
    "châu văn văn": ("Châu Văn Văn", ["Ngôn Tình", "Hiện Đại"]),
    "cô nương đừng khóc": ("Nhiều tác giả", ["Ngôn Tình", "Cổ Trang"]),
    "donato carrisi": ("Donato Carrisi", ["Trinh Thám", "Kinh Dị", "Giật Gân"]),
    "fredrik backman": ("Fredrik Backman", ["Tiểu Thuyết", "Văn Học Nước Ngoài", "Nhân Văn"]),
    "freida mcfadden": ("Freida McFadden", ["Trinh Thám", "Tâm Lý Tội Phạm", "Giật Gân"]),
    "fumio yamamoto": ("Fumio Yamamoto", ["Văn Học Nhật Bản", "Hiện Thực"]),
    "ichikawa takuji": ("Ichikawa Takuji", ["Văn Học Nhật Bản", "Lãng Mạn"]),
    "lee child": ("Lee Child", ["Hành Động", "Hình Sự", "Jack Reacher"]),
    "lôi mễ": ("Lôi Mễ", ["Trinh Thám", "Tâm Lý Tội Phạm", "Hình Sự"]),
    "lời nguyền lỗ ban": ("Viên Thái Cực", ["Huyền Bí", "Kỳ Ảo", "Trinh Thám"]),
    "mã bá dung": ("Mã Bá Dung", ["Lịch Sử", "Kỳ Ảo", "Trinh Thám"]),
    "mật mã tây tạng": ("Hà Mã", ["Phiêu Lưu", "Hành Động", "Huyền Bí"]),
    "natsu hyuuga": ("Natsu Hyuuga", ["Light Novel", "Cổ Trang", "Trinh Thám"]),
    "nguyễn nhật ánh": ("Nguyễn Nhật Ánh", ["Văn Học Việt Nam", "Tuổi Học Trò"]),
    "osho": ("Osho", ["Tâm Linh", "Triết Học", "Thiền Định"]),
    "sherlock homes": ("Arthur Conan Doyle", ["Trinh Thám Cổ Điển", "Sherlock Holmes"]),
    "stephanie garber": ("Stephanie Garber", ["Kỳ Ảo", "Lãng Mạn"]),
    "stephen king": ("Stephen King", ["Kinh Dị", "Huyền Bí", "Rùng Rợn"]),
    "thích nhất hạnh": ("Thích Nhất Hạnh", ["Phật Giáo", "Tâm Linh", "Chánh Niệm"]),
    "toshikazu kawaguchi": ("Toshikazu Kawaguchi", ["Văn Học Nhật Bản", "Chữa Lành", "Kỳ Ảo"]),
    "tử kim trần": ("Tử Kim Trần", ["Trinh Thám", "Tội Phạm Xã Hội"]),
    "yuki haruo": ("Yuki Haruo", ["Trinh Thám", "Văn Học Nhật Bản"]),
    "yukio mishima": ("Yukio Mishima", ["Văn Học Cổ Điển", "Văn Học Nhật Bản"]),
    "yukito ayatsuji": ("Yukito Ayatsuji", ["Trinh Thám", "Kinh Dị", "Phòng Kín"]),
    "asène lupin": ("Maurice Leblanc", ["Trinh Thám", "Siêu Trộm Lupin"])
}

def scan_novel_dir(root_dir=r"F:\Truyện Chữ"):
    catalog = {}
    for d in os.listdir(root_dir):
        dpath = os.path.join(root_dir, d)
        if not os.path.isdir(dpath):
            continue
        f_clean = re.sub(r'^[#\s]+', '', d).strip()
        
        for fname in os.listdir(dpath):
            base, ext = os.path.splitext(fname)
            slug = slugify(base)
            
            author = ""
            genres = set(["Truyện Chữ"])
            
            # Check folder genre hints
            f_low = f_clean.lower()
            if "tâm lý học" in f_low:
                genres.update(["Tâm Lý Học", "Kỹ Năng Sống", "Sách"])
            elif "thay đổi bản thân" in f_low:
                genres.update(["Phát Triển Bản Thân", "Kỹ Năng Sống", "Sách"])
            elif "doodle" in f_low or "dạy vẽ" in f_low:
                genres.update(["Thiếu Nhi", "Nghệ Thuật", "Sách"])
            elif "harry potter" in f_low:
                author = "J.K. Rowling"
                genres.update(["Tiểu Thuyết", "Kỳ Ảo", "Phiêu Lưu"])
            elif "business review" in f_low or "harvard" in f_low:
                genres.update(["Kinh Tế", "Quản Trị Kinh Doanh", "Sách"])
            elif "hình sự" in f_low or "trinh thám" in f_low or "điều tra" in f_low:
                genres.update(["Trinh Thám", "Hình Sự", "Vụ Án"])
            elif "nuôi dậy con" in f_low or "nuôi dạy con" in f_low:
                genres.update(["Nuôi Dạy Con", "Gia Đình", "Sách"])
            elif "tiếng anh" in f_low:
                genres.update(["Tiếng Anh", "Văn Học Nước Ngoài"])
            elif "tiểu thuyết" in f_low:
                genres.update(["Tiểu Thuyết", "Văn Học"])
                
            # Author folder match
            for k, (a_name, a_genres) in AUTHOR_FOLDERS.items():
                if k in f_low:
                    author = a_name
                    genres.update(a_genres)
                    break
                    
            # Parse from filename if author not found
            if not author and " - " in base:
                parts = base.split(" - ")
                tail = " - ".join(parts[1:]).strip()
                if "(dịch)" in tail.lower() or "_ dịch" in tail.lower():
                    m = re.match(r'^(.*?)(?:\s*(?:&|_|\+)\s*.*?(?:\(dịch\)|dịch))?$', tail, re.IGNORECASE)
                    if m:
                        author = m.group(1).strip()
                else:
                    author = tail
                    
            # Title based keywords
            t_low = base.lower()
            if any(k in t_low for k in ["tâm lý", "sang chấn", "trầm cảm", "thao túng", "nội tâm"]):
                genres.update(["Tâm Lý Học", "Sách"])
            if any(k in t_low for k in ["lãnh đạo", "kinh doanh", "công ty", "tài chính", "đầu tư", "làm giàu"]):
                genres.update(["Kinh Tế", "Quản Trị Kinh Doanh", "Sách"])
            if any(k in t_low for k in ["vụ án", "giết người", "chết", "kẻ sát nhân", "thi thể", "mưu sát", "pháp y", "hung thủ"]):
                genres.update(["Trinh Thám", "Hình Sự"])
            if any(k in t_low for k in ["yêu", "anh sẽ", "em sẽ", "hôn nhân", "cưới", "tình", "trái tim"]):
                genres.update(["Lãng Mạn", "Tình Cảm"])
            if any(k in t_low for k in ["bí mật", "ma quái", "nguyền", "kinh dị", "hồn", "xác sống"]):
                genres.update(["Kinh Dị", "Huyền Bí"])
            if any(k in t_low for k in ["tam thể", "vũ trụ", "viễn tưởng", "khoa học"]):
                genres.update(["Khoa Học Viễn Tưởng"])

            if not any(g in genres for g in ["Trinh Thám", "Tâm Lý Học", "Kỹ Năng Sống", "Kinh Tế", "Lãng Mạn", "Kinh Dị", "Khoa Học Viễn Tưởng", "Tiếng Anh"]):
                genres.add("Tiểu Thuyết")
                
            entry = {
                "folder": d,
                "filename": fname,
                "author": author,
                "genres": sorted(list(genres))
            }
            catalog[slug] = entry
            # Also register normalized variants
            norm_slug = re.sub(r'-\d+$', '', slug)
            catalog[norm_slug] = entry

    return catalog

def main():
    print("🚀 Bắt đầu quét và phân loại dữ liệu Truyện Chữ...")
    local_catalog = scan_novel_dir()
    print(f"-> Đã xây dựng catalog metadata từ {len(local_catalog)} mục trên đĩa.")
    
    # Lấy toàn bộ stories type = novel từ Supabase
    url = f"{SUPABASE_URL}/rest/v1/stories?type=eq.novel&select=id,title,slug,author_name,genres"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        db_stories = json.loads(resp.read().decode("utf-8"))
        
    print(f"-> Tìm thấy {len(db_stories)} truyện chữ trên Supabase.")
    
    updated_count = 0
    for s in db_stories:
        s_slug = s["slug"]
        s_title_slug = slugify(s["title"])
        
        match = local_catalog.get(s_slug) or local_catalog.get(s_title_slug)
        if not match:
            # Tìm substring match
            for k, v in local_catalog.items():
                if k in s_slug or s_slug in k:
                    match = v
                    break
                    
        new_author = s.get("author_name") or ""
        new_genres = set(s.get("genres") or ["Truyện Chữ", "Tiểu Thuyết"])
        
        if match:
            if match["author"] and (not new_author or new_author in ["Đang cập nhật", "Nhiều tác giả"]):
                new_author = match["author"]
            new_genres.update(match["genres"])
        else:
            # Tự phân loại theo tựa đề
            t_low = s["title"].lower()
            if any(k in t_low for k in ["tâm lý", "sang chấn", "trầm cảm"]):
                new_genres.update(["Tâm Lý Học", "Sách"])
            elif any(k in t_low for k in ["vụ án", "án mạng", "giết người", "trinh thám"]):
                new_genres.update(["Trinh Thám", "Hình Sự"])
            elif any(k in t_low for k in ["kinh doanh", "lãnh đạo", "thay đổi bản thân"]):
                new_genres.update(["Kỹ Năng Sống", "Phát Triển Bản Thân", "Sách"])
                
        # Cập nhật vào Supabase nếu có thay đổi
        final_genres = sorted(list(new_genres))
        patch_data = {}
        if final_genres != s.get("genres"):
            patch_data["genres"] = final_genres
        if new_author and new_author != s.get("author_name"):
            patch_data["author_name"] = new_author
            
        if patch_data:
            patch_url = f"{SUPABASE_URL}/rest/v1/stories?id=eq.{s['id']}"
            p_req = urllib.request.Request(
                patch_url,
                data=json.dumps(patch_data).encode("utf-8"),
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json"
                },
                method="PATCH"
            )
            with urllib.request.urlopen(p_req):
                updated_count += 1
                
        if (updated_count) % 50 == 0 and updated_count > 0:
            print(f"  -> Đã cập nhật phân loại cho {updated_count} truyện...", flush=True)

    print(f"\n🎉 HOÀN TẤT PHÂN LOẠI: Đã cập nhật thể loại, tác giả, ngôn ngữ cho {updated_count} truyện chữ!")

if __name__ == "__main__":
    main()
