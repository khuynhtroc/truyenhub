import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

comic_root = r"F:\Truyện Tranh\Truyện Tranh"
for name in ['Conan', 'Onepiece Bản Thường', 'Naruto', 'Dragon Ball', 'Shin - Cậu Bé Bút Chì', 'Bleach', 'Fairy tail', 'Pokemon Đặc Biệt']:
    p = os.path.join(comic_root, name)
    if os.path.exists(p):
        items = os.listdir(p)[:4]
        is_dirs = [os.path.isdir(os.path.join(p, i)) for i in items]
        exts = set([os.path.splitext(i)[1].lower() for i in items if os.path.isfile(os.path.join(p, i))])
        print(f"• {name}: {len(os.listdir(p))} items, Sample: {items[:3]} | Is dirs: {any(is_dirs)} | Exts: {exts}")
