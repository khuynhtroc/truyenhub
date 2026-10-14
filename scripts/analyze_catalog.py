import os
import sys
import re
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

novel_root = r"F:\Truyện Chữ"
folders = [d for d in os.listdir(novel_root) if os.path.isdir(os.path.join(novel_root, d))]

results = []
for d in sorted(folders):
    subpath = os.path.join(novel_root, d)
    files = [f for f in os.listdir(subpath) if os.path.isfile(os.path.join(subpath, f))]
    
    epubs = [f for f in files if f.lower().endswith('.epub')]
    pdfs = [f for f in files if f.lower().endswith('.pdf')]
    mobis = [f for f in files if f.lower().endswith(('.mobi', '.azw3', '.prc'))]
    
    results.append({
        "folder": d,
        "total_files": len(files),
        "epubs": len(epubs),
        "pdfs": len(pdfs),
        "mobis": len(mobis),
        "samples": files[:3]
    })

print(f"Total Folders: {len(results)}")
for r in results:
    print(f"[{r['folder']}] Total: {r['total_files']} | EPUB: {r['epubs']} | PDF: {r['pdfs']} | MOBI: {r['mobis']}")
    for s in r["samples"]:
        print(f"   -> {s}")
