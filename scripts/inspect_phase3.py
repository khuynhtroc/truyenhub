import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

comic_root = r"F:\Truyện Tranh\Truyện Tranh"

targets = [
    "Thần Đồng Đất Việt",
    "Trạng Quỳnh",
    "Ô Long Viện",
    "Doraemon",
    "Jindo - Cơn Lốc Sân Cỏ",
    "Fantasista - Vũ Điệu Sân Cỏ",
    "Bác Sĩ Quái Dị"
]

for t in targets:
    p = os.path.join(comic_root, t)
    print(f"\n==================== {t} ====================")
    if not os.path.exists(p):
        print("  ❌ Không tìm thấy thư mục!")
        continue
    items = sorted(os.listdir(p))
    print(f"  Số lượng mục con: {len(items)}")
    for item in items[:12]:
        ipath = os.path.join(p, item)
        if os.path.isdir(ipath):
            sub_files = [f for f in os.listdir(ipath) if os.path.isfile(os.path.join(ipath, f))]
            print(f"  📁 [DIR] {item} ({len(sub_files)} files: {sub_files[:3]})")
        else:
            size_mb = os.path.getsize(ipath) / (1024 * 1024)
            print(f"  📄 [FILE] {item} ({size_mb:.1f} MB)")
