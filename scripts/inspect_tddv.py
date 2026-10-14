import os
import sys
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

root = r"F:\Truyện Tranh\Truyện Tranh\Thần Đồng Đất Việt"
all_chapters = []

for sub in sorted(os.listdir(root)):
    sub_path = os.path.join(root, sub)
    if os.path.isdir(sub_path):
        for ch in sorted(os.listdir(sub_path)):
            ch_path = os.path.join(sub_path, ch)
            if os.path.isdir(ch_path):
                img_count = len([f for f in os.listdir(ch_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
                # Try to extract chapter number
                m = re.search(r'tap\s*(\d+)', ch.lower())
                num = int(m.group(1)) if m else None
                all_chapters.append({
                    "sub": sub,
                    "folder": ch,
                    "num": num,
                    "img_count": img_count,
                    "path": ch_path
                })

print(f"Tổng số chương Thần Đồng Đất Việt tìm thấy: {len(all_chapters)}")
all_chapters.sort(key=lambda x: x["num"] if x["num"] is not None else 9999)
print("10 chương đầu:")
for c in all_chapters[:10]:
    print(f"  Tập {c['num']}: {c['folder']} ({c['img_count']} ảnh) -> {c['sub']}")

print("\n10 chương cuối:")
for c in all_chapters[-10:]:
    print(f"  Tập {c['num']}: {c['folder']} ({c['img_count']} ảnh) -> {c['sub']}")
