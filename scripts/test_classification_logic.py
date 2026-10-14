import os
import sys
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def extract_meta_from_filename(filename, folder_name=""):
    name = os.path.splitext(filename)[0]
    
    # 1. Author from folder if folder is an author
    author = ""
    genres = set()
    language = "Tiếng Việt"
    
    # Check folder hints
    f_clean = re.sub(r'^[#\s]+', '', folder_name).strip()
    
    # Folder genre mappings
    if "tâm lý học" in f_clean.lower():
        genres.update(["Tâm Lý Học", "Kỹ Năng Sống"])
    elif "thay đổi bản thân" in f_clean.lower():
        genres.update(["Phát Triển Bản Thân", "Kỹ Năng Sống", "Sách"])
    elif "doodle" in f_clean.lower() or "dạy vẽ" in f_clean.lower():
        genres.update(["Thiếu Nhi", "Nghệ Thuật", "Sách"])
    elif "harry potter" in f_clean.lower():
        author = "J.K. Rowling"
        genres.update(["Tiểu Thuyết", "Kỳ Ảo", "Phiêu Lưu"])
    elif "business review" in f_clean.lower() or "harvard" in f_clean.lower():
        genres.update(["Kinh Tế", "Quản Trị Kinh Doanh", "Sách"])
    elif "hình sự" in f_clean.lower() or "trinh thám" in f_clean.lower() or "điều tra" in f_clean.lower():
        genres.update(["Trinh Thám", "Hình Sự", "Vụ Án"])
    elif "nuôi dậy con" in f_clean.lower() or "nuôi dạy con" in f_clean.lower():
        genres.update(["Nuôi Dạy Con", "Gia Đình", "Sách"])
    elif "tiếng anh" in f_clean.lower():
        language = "Tiếng Anh"
        genres.update(["Tiếng Anh", "Văn Học Nước Ngoài"])
    elif "tiểu thuyết" in f_clean.lower():
        genres.update(["Tiểu Thuyết", "Văn Học"])
        
    # Author folders
    author_folders = {
        "higashino keigo": ("Higashino Keigo", ["Trinh Thám", "Văn Học Nhật Bản", "Suy Luận"]),
        "banana yoshimoto": ("Banana Yoshimoto", ["Văn Học Nhật Bản", "Lãng Mạn", "Đời Thường"]),
        "carl gustav jung": ("Carl Gustav Jung", ["Tâm Lý Học", "Triết Học", "Sách"]),
        "chan ho kei": ("Trần Hạo Cơ (Chan Ho Kei)", ["Trinh Thám", "Vụ Án"]),
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
    
    for k, (a_name, a_genres) in author_folders.items():
        if k in f_clean.lower():
            if not author:
                author = a_name
            genres.update(a_genres)
            break
            
    # Parse filename for title and author if not yet set
    # Pattern: Title - Author & Translator (dịch) OR Title - Author
    title = name
    if " - " in name:
        parts = name.split(" - ")
        title = parts[0].strip()
        tail = " - ".join(parts[1:]).strip()
        
        # Check if tail has translator
        if "(dịch)" in tail.lower() or "_ dịch" in tail.lower():
            # e.g., "Peter Swanson & Fatass Racoon (dịch)"
            m = re.match(r'^(.*?)(?:\s*(?:&|_|\+)\s*.*?(?:\(dịch\)|dịch))?$', tail, re.IGNORECASE)
            if m and not author:
                author = m.group(1).strip()
        elif not author:
            author = tail
            
    # Title-based genre detection
    t_low = title.lower()
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

    if not genres:
        genres.add("Tiểu Thuyết")
    genres.add("Truyện Chữ")
    
    if not author:
        author = "Nhiều tác giả"
        
    return {
        "title": title,
        "author": author,
        "genres": sorted(list(genres)),
        "language": language
    }

# Test sample files
samples = [
    ("Bach Da Hanh.epub", "# Higashino Keigo"),
    ("Ban Tay Cho Em - Ichikawa Takuji.azw3", "# Ichikawa Takuji"),
    ("8 Vụ Án Hoàn Hảo - Vạch Trần Tâm Lý Kẻ Phạm Tội - Peter Swanson & Fatass Racoon (dịch).epub", "# Điều tra, án mạng"),
    ("50 Cong Ty Lam Thay Doi The Gioi.pdf", "# 50 Ebooks THAY ĐỔI BẢN THÂN"),
    ("Sang Chấn Tâm Lý - Hiểu Để Chữa Lành - Bessel Van Der Kolk, M.D.epub", "S"),
    ("Doctor-Sleep.pdf", "# Truyện Tiếng Anh"),
    ("Bố già (Đặng Phi Bằng dịch) - Mario Puzo.epub", "# Truyện, Tiểu thuyết #"),
    ("Tam Thể 1.epub", "T"),
    ("Dược Sư Tự Sự Tập 1.epub", "# Natsu Hyuuga"),
    ("Con khong ngoc con chi thong minh theo mot cach khac.pdf", "# Nuôi dậy con")
]

print("--- KẾT QUẢ TEST PHÂN LOẠI METADATA ---")
for f, folder in samples:
    meta = extract_meta_from_filename(f, folder)
    print(f"\nFile: {f} (Thư mục: {folder})")
    print(f"  -> Tựa: {meta['title']}")
    print(f"  -> Tác giả: {meta['author']}")
    print(f"  -> Thể loại: {meta['genres']}")
    print(f"  -> Ngôn ngữ: {meta['language']}")
