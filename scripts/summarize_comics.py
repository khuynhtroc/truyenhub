import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

with open(r"scripts\comic_status_report.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("=========================================================================")
print("📚 CHI TIẾT TÌNH TRẠNG 56 BỘ TRUYỆN TRANH TRÊN PC SO VỚI WEBSITE")
print("=========================================================================")

full_list = []
partial_list = []
sub_list = []

for c in sorted(data, key=lambda x: x["folder"]):
    if c["has_subdirs"]:
        sub_list.append(c)
    elif c["db_chapters"] >= c["file_count"] and c["file_count"] > 0:
        full_list.append(c)
    else:
        partial_list.append(c)

print(f"\n✅ NHÓM 1: CÁC BỘ ĐÃ NẠP FULL 100% TẬP ({len(full_list)} bộ):")
for c in full_list:
    print(f"   • {c['folder']}: Hoàn tất {c['db_chapters']}/{c['file_count']} tập")

print(f"\n📂 NHÓM 2: CÁC BỘ ĐA PHIÊN BẢN / NHIỀU THƯ MỤC CON LỒNG NHAU ({len(sub_list)} bộ):")
for c in sub_list:
    print(f"   • {c['folder']}:")
    print(f"     - Số nhánh phiên bản trên PC: {len(c['subdirs'])} nhánh")
    for s in c['subdirs']:
        print(f"       + {s}")
    print(f"     - Đã tạo trên DB: {c['db_chapters']} tập")

print(f"\n⏳ NHÓM 3: CÁC BỘ ĐÃ NẠP MẪU (3-5 TẬP ĐẦU) - CÒN NHIỀU TẬP TRÊN PC CHƯA NẠP ({len(partial_list)} bộ):")
total_missing = 0
for c in partial_list:
    missing = c["file_count"] - c["db_chapters"]
    total_missing += missing
    print(f"   • {c['folder']}: Đang có {c['db_chapters']}/{c['file_count']} tập -> Còn thiếu {missing} tập trên PC")

print(f"\n-> Tổng số tập truyện tranh còn nằm trên PC chưa bóc tách/nạp lên R2 & Database: ~{total_missing} tập!")
