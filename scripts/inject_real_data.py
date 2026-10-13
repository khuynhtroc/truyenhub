import json
import re

with open("scripts/processed_sample_data.json", "r", encoding="utf-8") as f:
    sample_data = json.load(f)

novel_chapters = sample_data["novel_13_67_chapters"]
comic_pages = sample_data["dragon_ball_chap_1_pages"]

with open("src/lib/mock-data.ts", "r", encoding="utf-8") as f:
    mock_content = f.read()

# Update Dragon Ball chapter 1 pages
# Replace chapter 1 pages_images in dragon-ball
db_ch1_pages_str = json.dumps(comic_pages, indent=8)
pattern_ch1 = r'(\s*id:\s*"db-1"[\s\S]*?pages_images:\s*)\[[\s\S]*?\],'
replacement_ch1 = rf'\1{db_ch1_pages_str},'
mock_content = re.sub(pattern_ch1, replacement_ch1, mock_content)

# Update 13.67 cover url
mock_content = re.sub(
    r'(slug:\s*"13-67-chan-ho-kei"[\s\S]*?cover_url:\s*")[^"]+(")',
    r'\1/covers/13-67-cover.webp\2',
    mock_content
)

# Update 13.67 total chapters to 23
mock_content = re.sub(
    r'(slug:\s*"13-67-chan-ho-kei"[\s\S]*?total_chapters:\s*)\d+,',
    r'\1 23,',
    mock_content
)

# Insert 13-67-chan-ho-kei chapters into MOCK_CHAPTERS
# Format chapters json for TypeScript
novel_chapters_json = json.dumps(novel_chapters, ensure_ascii=False, indent=4)
# Indent with 2 spaces
indented_novel_chapters = "\n".join("  " + line for line in novel_chapters_json.split("\n"))

# Add "13-67-chan-ho-kei": [...] to MOCK_CHAPTERS
marker = 'export const MOCK_CHAPTERS: Record<string, Chapter[]> = {'
if '"13-67-chan-ho-kei"' not in mock_content:
    replacement = f'{marker}\n  "13-67-chan-ho-kei": {indented_novel_chapters},'
    mock_content = mock_content.replace(marker, replacement)

with open("src/lib/mock-data.ts", "w", encoding="utf-8") as f:
    f.write(mock_content)

print("Đã cập nhật mock-data.ts với dữ liệu thật 100%!")
