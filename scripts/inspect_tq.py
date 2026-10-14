import os
import sys
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

root = r"F:\Truyện Tranh\Truyện Tranh\Trạng Quỳnh"
files = [f for f in os.listdir(root) if f.lower().endswith(".pdf")]
print(f"Tổng số file Trạng Quỳnh: {len(files)}")
for f in sorted(files)[:15]:
    m = re.search(r'(?:tap[-_\s]*(\d+)|^(\d+))', f.lower())
    num = m.group(1) or m.group(2) if m else "?"
    print(f"  Tập {num}: {f}")
