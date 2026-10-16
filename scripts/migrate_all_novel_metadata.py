import urllib.request
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTkwNTQxNywiZXhwIjoyMTA3NDgxNDE3fQ.JOX4r3s7OSsqImlnjRMHD4m4giOAYxN97yZq8a94Q1A'
BASE = 'https://bqvffeqjgjtzprouwshd.supabase.co/rest/v1'
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json'
}

KNOWN_KEYS = [
    'tên sách', 'tên ebook', 'tác phẩm', 'tập',
    'nguyên tác', 'nguyên bản', 'tên gốc', 'tên tiếng đức', 'tên tiếng anh', 'dịch từ nguyên bản',
    'tác giả',
    'dịch giả', 'người dịch', 'chuyển ngữ', 'phóng tác',
    'nhà xuất bản', 'nxb', 'xuất bản',
    'công ty phát hành', 'đơn vị phát hành', 'phát hành', 'nhà phát hành',
    'năm xuất bản', 'ngày phát hành',
    'số trang', 'khổ', 'khổ giấy', 'khổ sách', 'kích thước',
    'giá bìa', 'giá tiền', 'giá sách',
    'tủ sách', 'thể loại', 'bộ sách',
    'isbn', 'trọng lượng', 'hình thức bìa', 'bìa',
    'đánh máy', 'soát chính tả', 'sửa chính tả', 'soát lỗi', 'kiểm tra',
    'chuyển sang ebook', 'tạo ebook', 'đóng ebook', 'chế bản ebook', 'thực hiện',
    'ngày hoàn thành', 'hoàn thành', 'nơi hoàn thành',
    'nguồn'
]

BOILERPLATE_PHRASES = [
    'thông tin ebook', 'thông tin sách', 'các thông tin sách',
    'ebook miễn phí tại', 'ebook thực hiện', 'cuốn sách này được giới thiệu',
    'making ebook project', 'bạn đang đọc ebook',
    'chúng tôi luôn cố gắng mang đến', 'tuy nhiên, nếu bạn có khả năng',
    'dự án chế bản ebook', 'mọt truyện group', 'vui lòng quét mã qr',
    'dự án hạnh phúc', 'the happiness project', 'tve-4u read freely',
    'vctvegroup', 'thuvien-ebook.com', 'sachvui.com', 'tve-4u.org',
    'diendanlequydon.com', 'bookaholicclub.com', 'smartebooksvn'
]

FRONTMATTER_TITLE_KEYWORDS = [
    'thông tin ebook', 'thông tin ebook:', 'thông tin sách', 'các thông tin sách',
    'giới thiệu nội dung', 'giới thiệu nội dung:', 'giới thiệu sách', 'giới thiệu sách:', 'tóm tắt nội dung',
    'giới thiệu tác giả', 'giới thiệu tác giả:', 'giới thiệu về tác giả', 'giới thiệu về tác giả:',
    'nhận xét về tác phẩm', 'nhận xét về tác phẩm:', 'những lời khen ngợi', 'lời khen tặng',
    'mục lục', 'mục lục:'
]

def parse_chapter_metadata(text, title=""):
    """
    Parses and extracts metadata block from the beginning of chapter text.
    Returns: (metadata_dict, remaining_text, is_pure_metadata)
    """
    if not text:
        return {}, "", True

    lines = [line.strip() for line in text.split('\n')]
    metadata = {}
    consumed_line_idx = 0
    total_lines = len(lines)
    
    i = 0
    last_meta_key = None

    while i < min(total_lines, 80):
        line = lines[i]
        if not line:
            i += 1
            continue
            
        line_lower = line.lower()
        
        # Divider lines
        if re.match(r'^[-—_=*★~•#\s]{3,}$', line) or re.match(r'^[Kk\s]{4,}$', line):
            consumed_line_idx = i + 1
            i += 1
            continue

        # Boilerplate phrases
        if any(bp in line_lower for bp in BOILERPLATE_PHRASES):
            consumed_line_idx = i + 1
            i += 1
            continue

        # URLs
        if re.match(r'^(http[s]?://)?(www\.)?[a-zA-Z0-9.-]+\.(com|org|vn|net)\S*$', line.strip()):
            consumed_line_idx = i + 1
            i += 1
            continue

        # Clean line bullet points
        cleaned_line = re.sub(r'^[•\-\*\s]+', '', line)
        matched_key = None
        matched_val = None
        
        # Check "Key: Value"
        if ':' in cleaned_line:
            parts = cleaned_line.split(':', 1)
            k_cand = parts[0].strip().lower()
            v_cand = parts[1].strip()
            
            for k in KNOWN_KEYS:
                if k_cand == k or k_cand.startswith(k) or k in k_cand:
                    matched_key = k
                    matched_val = v_cand
                    break

        if matched_key:
            if matched_val:
                metadata[matched_key] = matched_val
                consumed_line_idx = i + 1
                last_meta_key = None
            else:
                last_meta_key = matched_key
                consumed_line_idx = i + 1
            i += 1
            continue
            
        # If previous line was key without value
        if last_meta_key and not matched_key:
            metadata[last_meta_key] = line
            consumed_line_idx = i + 1
            last_meta_key = None
            i += 1
            continue

        # Standalone key without colon (e.g. "Tác giả" on one line, value on next)
        for k in KNOWN_KEYS:
            if line_lower == k:
                last_meta_key = k
                consumed_line_idx = i + 1
                matched_key = k
                break
        if matched_key:
            i += 1
            continue

        # Key without colon on same line, e.g. "Nhà Xuất Bản Thế giới - Nhã Nam © 2015"
        for k in ['nhà xuất bản', 'nxb', 'xuất bản', 'phát hành']:
            if line_lower.startswith(k + ' ') and len(line_lower) > len(k) + 2:
                metadata[k] = line[len(k):].strip()
                consumed_line_idx = i + 1
                matched_key = k
                break
        if matched_key:
            i += 1
            continue

        # Header titles at very top (lines 0-5)
        if i <= 5 and (line.isupper() or line.startswith('(') or 'dịch giả' in line_lower):
            consumed_line_idx = i + 1
            i += 1
            continue

        # Content boundary detection
        if (
            re.match(r'^(chương|hồi|phần|quyển|tiết|lời nói đầu|lời giới thiệu|về tác giả|giới thiệu|mục lục|mở đầu)', line_lower)
            or len(line) > 100
            or (len(metadata) >= 2 and re.search(r'[.!?]["\']?\s*$', line))
        ):
            break

        if len(metadata) == 0 and i > 5:
            break

        if 'thương mại' in line_lower or 'ủng hộ' in line_lower or 'bản quyền' in line_lower:
            consumed_line_idx = i + 1
            i += 1
            continue

        break

    remaining_lines = lines[consumed_line_idx:]
    remaining_text = "\n".join(remaining_lines).strip()
    is_pure_metadata = len(remaining_text) < 50
    
    return metadata, remaining_text, is_pure_metadata

def format_publication_block(meta_dict):
    """Formats metadata dict into a clean, beautiful Markdown block."""
    if not meta_dict:
        return ""
    
    lines = [
        "---",
        "📌 Thông tin xuất bản & tác phẩm:"
    ]
    
    orig = meta_dict.get('nguyên tác') or meta_dict.get('nguyên bản') or meta_dict.get('tên gốc')
    if orig:
        lines.append(f"• Nguyên tác: {orig}")
        
    author = meta_dict.get('tác giả')
    if author:
        lines.append(f"• Tác giả: {author}")
        
    trans = meta_dict.get('dịch giả') or meta_dict.get('người dịch') or meta_dict.get('chuyển ngữ')
    if trans:
        lines.append(f"• Dịch giả: {trans}")
        
    pub = meta_dict.get('nhà xuất bản') or meta_dict.get('nxb') or meta_dict.get('xuất bản')
    if pub:
        lines.append(f"• Nhà xuất bản: {pub}")
        
    dist = meta_dict.get('công ty phát hành') or meta_dict.get('đơn vị phát hành') or meta_dict.get('phát hành')
    if dist and dist.lower() not in (pub or '').lower():
        lines.append(f"• Đơn vị phát hành: {dist}")
        
    year = meta_dict.get('năm xuất bản') or meta_dict.get('ngày phát hành')
    if year:
        lines.append(f"• Năm xuất bản: {year}")
        
    genre = meta_dict.get('tủ sách') or meta_dict.get('thể loại') or meta_dict.get('bộ sách')
    if genre:
        lines.append(f"• Thể loại / Tủ sách: {genre}")
        
    specs = []
    if 'số trang' in meta_dict:
        specs.append(f"{meta_dict['số trang']} trang" if 'trang' not in meta_dict['số trang'].lower() else meta_dict['số trang'])
    if 'khổ' in meta_dict or 'kích thước' in meta_dict or 'khổ sách' in meta_dict or 'khổ giấy' in meta_dict:
        k = meta_dict.get('khổ') or meta_dict.get('kích thước') or meta_dict.get('khổ sách') or meta_dict.get('khổ giấy')
        specs.append(f"Khổ {k}")
    if 'hình thức bìa' in meta_dict or 'bìa' in meta_dict:
        specs.append(meta_dict.get('hình thức bìa') or meta_dict.get('bìa'))
    if specs:
        lines.append(f"• Quy cách: {' | '.join(specs)}")
        
    price = meta_dict.get('giá bìa') or meta_dict.get('giá tiền') or meta_dict.get('giá sách')
    if price:
        lines.append(f"• Giá bìa: {price}")
        
    # Digitization / Source
    dig_team = []
    if 'đánh máy' in meta_dict:
        dig_team.append("Đánh máy")
    if 'soát chính tả' in meta_dict or 'sửa chính tả' in meta_dict:
        dig_team.append("Soát lỗi")
    if 'chuyển sang ebook' in meta_dict or 'tạo ebook' in meta_dict or 'chế bản ebook' in meta_dict:
        dig_team.append("Tạo Ebook")
        
    source = meta_dict.get('nguồn') or ''
    if 'thuvien-ebook' in source.lower() or 'tve' in source.lower():
        source_label = "Đội ngũ TVE (thuvien-ebook.com)"
    elif 'sachvui' in source.lower():
        source_label = "Thư viện Ebook (Sachvui)"
    elif 'bookaholic' in source.lower():
        source_label = "Bookaholic Club"
    elif source:
        source_label = source
    else:
        source_label = "Cộng đồng số hóa Ebook"
        
    lines.append(f"• Nguồn số hóa: {source_label}")
    
    return "\n".join(lines)

def is_frontmatter_chapter(c, author_name=""):
    title = (c.get('title') or '').strip().lower()
    text = (c.get('content_text') or '').strip()
    text_lower = text.lower()
    
    # 1. By title keywords
    if any(title == kw or title.startswith(kw) for kw in FRONTMATTER_TITLE_KEYWORDS):
        return True, "title_match"

    # 2. Short chapter (< 1200 chars) with digitization / colophon markers
    if len(text) < 1200:
        digi_markers = [
            'chỉnh sửa và đóng ebook', 'đóng ebook', 'chuyển sang ebook', 'tạo ebook',
            'thực hiện ebook', 'chế bản ebook', 'ngày hoàn thành:', 'hoàn thành:',
            'thuvien-ebook.com', 'e-thuvien.com', 'sachvui.com', 'tve-4u',
            'ebook không mang tính chất thương mại', 'ebook miễn phí tại'
        ]
        if any(m in text_lower for m in digi_markers):
            return True, "digitization_colophon"

    # 3. Text starts with frontmatter headings (even if title is "Chương X")
    first_lines = "\n".join([line.strip() for line in text.split('\n')[:5] if line.strip()]).lower()
    content_headers = [
        'giới thiệu tác phẩm:', 'giới thiệu nội dung:', 'giới thiệu sách:',
        'nhận định về tác phẩm:', 'nhận xét về tác phẩm:', 'những lời khen ngợi:',
        'lời giới thiệu:', 'thông tin ebook:', 'thông tin sách:'
    ]
    if any(first_lines.startswith(h) for h in content_headers):
        return True, "content_header_match"

    # 4. Table of contents dump
    if first_lines.startswith('mục lục') or first_lines.startswith('mục lục:'):
        return True, "toc_dump"

    # 5. Author bio section if short (< 2000 chars) and begins with author bio
    if len(text) < 2000:
        if author_name and author_name.lower() in first_lines:
            if any(w in first_lines for w in ['sinh năm', 'tên thật là', 'là một trong những', 'tốt nghiệp', 'nhà văn']):
                return True, "author_bio"

    # 6. Check if pure metadata by text content
    if len(text) < 1200:
        meta, rem, is_pure = parse_chapter_metadata(text)
        if is_pure and len(meta) >= 2:
            return True, "pure_metadata"

    return False, "story_content"

def process_single_story(story):
    """
    Scans a story, detects standalone frontmatter chapters and inline metadata,
    updates database accordingly.
    """
    story_id = story['id']
    story_title = story['title']
    story_desc = story.get('description') or ''
    author_name = story.get('author_name') or ''
    
    # 1. Fetch first 7 chapters
    try:
        req = urllib.request.Request(
            f"{BASE}/chapters?story_id=eq.{story_id}&order=chapter_number.asc&limit=7&select=id,chapter_number,title,content_text",
            headers=HEADERS
        )
        chs = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    except Exception as e:
        return {'status': 'error', 'story': story_title, 'error': f"Fetch failed: {e}"}

    if not chs:
        return {'status': 'skip', 'story': story_title, 'reason': 'No chapters'}

    meta_dict = {}
    synopsis_parts = []
    author_parts = []
    frontmatter_to_delete = []

    # 2. Check for standalone frontmatter chapters from the beginning
    for c in chs:
        text = (c.get('content_text') or '').strip()
        first_lines = "\n".join([line.strip() for line in text.split('\n')[:5] if line.strip()]).lower()
        t_clean = c['title'].strip().lower()
        
        is_front, reason = is_frontmatter_chapter(c, author_name)

        if is_front:
            frontmatter_to_delete.append(c)
            # Extract content if synopsis or author or metadata
            if any(k in t_clean or k in first_lines for k in ['giới thiệu tác phẩm', 'giới thiệu nội dung', 'giới thiệu sách', 'tóm tắt']):
                clean_s = text
                for p in ['giới thiệu tác phẩm:', 'giới thiệu tác phẩm', 'giới thiệu nội dung:', 'giới thiệu nội dung', 'giới thiệu sách:', 'giới thiệu sách']:
                    if clean_s.lower().startswith(p):
                        clean_s = clean_s[len(p):].strip()
                if len(clean_s) > 50:
                    synopsis_parts.append(clean_s)
            elif any(k in t_clean or k in first_lines for k in ['giới thiệu tác giả', 'giới thiệu về tác giả', 'về tác giả']) or reason == "author_bio":
                clean_a = text
                for p in ['giới thiệu tác giả:', 'giới thiệu tác giả', 'giới thiệu về tác giả:']:
                    if clean_a.lower().startswith(p):
                        clean_a = clean_a[len(p):].strip()
                if len(clean_a) > 50:
                    author_parts.append(clean_a)
            elif any(k in t_clean or k in first_lines for k in ['thông tin ebook', 'thông tin sách']) or reason in ["digitization_colophon", "pure_metadata"]:
                meta, _, _ = parse_chapter_metadata(text, story_title)
                meta_dict.update(meta)
        else:
            # We reached the first actual reading chapter!
            # Check if THIS chapter has inline metadata at the top
            meta, rem, is_pure = parse_chapter_metadata(text, story_title)
            if len(meta) >= 2 or (len(meta) >= 1 and ('nhà xuất bản' in meta or 'dịch giả' in meta)):
                meta_dict.update(meta)
                # Patch this chapter's content_text with rem
                try:
                    patch_ch = urllib.request.Request(
                        f"{BASE}/chapters?id=eq.{c['id']}",
                        data=json.dumps({'content_text': rem}).encode('utf-8'),
                        headers=HEADERS,
                        method='PATCH'
                    )
                    urllib.request.urlopen(patch_ch)
                except Exception as e:
                    print(f"Error patching chapter {c['id']}: {e}")
            break

    # If nothing was found / modified
    if not frontmatter_to_delete and not meta_dict:
        return {'status': 'clean', 'story': story_title}

    # 3. Handle deletions and renumbering if frontmatter chapters existed
    del_count = len(frontmatter_to_delete)
    if del_count > 0:
        # Delete frontmatter chapters
        for fc in frontmatter_to_delete:
            try:
                del_req = urllib.request.Request(f"{BASE}/chapters?id=eq.{fc['id']}", headers=HEADERS, method='DELETE')
                urllib.request.urlopen(del_req)
            except Exception as e:
                print(f"Error deleting chapter {fc['id']}: {e}")

        # Fetch all remaining chapters of this story to renumber
        try:
            req_all = urllib.request.Request(
                f"{BASE}/chapters?story_id=eq.{story_id}&order=chapter_number.asc&select=id,chapter_number,title",
                headers=HEADERS
            )
            all_remaining = json.loads(urllib.request.urlopen(req_all).read().decode('utf-8'))
            
            for i, c in enumerate(all_remaining):
                new_num = i + 1
                new_title = c['title']
                
                # Check if title was generic "Chương X"
                m = re.match(r'^(chương|chuong)\s+(\d+)$', c['title'].strip(), re.IGNORECASE)
                if m:
                    new_title = f"Chương {new_num}"
                    
                update_fields = {}
                if c['chapter_number'] != new_num:
                    update_fields['chapter_number'] = new_num
                if new_title != c['title']:
                    update_fields['title'] = new_title
                    
                if update_fields:
                    p_req = urllib.request.Request(
                        f"{BASE}/chapters?id=eq.{c['id']}",
                        data=json.dumps(update_fields).encode('utf-8'),
                        headers=HEADERS,
                        method='PATCH'
                    )
                    urllib.request.urlopen(p_req)
        except Exception as e:
            print(f"Error renumbering chapters for {story_title}: {e}")

    # 4. Update story description
    desc_blocks = []
    if synopsis_parts:
        desc_blocks.append("\n\n".join(synopsis_parts))
    else:
        # Keep existing synopsis before any divider
        clean_existing = story_desc.split('---')[0].strip()
        desc_blocks.append(clean_existing)
        
    if author_parts:
        desc_blocks.append("🖋️ Về tác giả:\n" + "\n\n".join(author_parts))
        
    pub_block = format_publication_block(meta_dict)
    if pub_block:
        desc_blocks.append(pub_block)
        
    final_desc = "\n\n".join([b for b in desc_blocks if b.strip()])
    
    # Patch story
    story_update = {'description': final_desc}
    if del_count > 0:
        story_update['total_chapters'] = max(0, (story.get('total_chapters') or len(chs)) - del_count)
        
    try:
        st_patch = urllib.request.Request(
            f"{BASE}/stories?id=eq.{story_id}",
            data=json.dumps(story_update).encode('utf-8'),
            headers=HEADERS,
            method='PATCH'
        )
        urllib.request.urlopen(st_patch)
    except Exception as e:
        print(f"Error updating story {story_title}: {e}")

    return {
        'status': 'updated',
        'story': story_title,
        'deleted_frontmatter': del_count,
        'metadata_keys': list(meta_dict.keys()),
        'has_synopsis': len(synopsis_parts) > 0
    }

def main():
    print("=" * 60)
    print("TruyenHub Master Metadata Cleaner & Migration")
    print("=" * 60)
    
    # Fetch all novel stories
    print("Fetching all novel stories from Supabase...")
    all_stories = []
    offset = 0
    limit = 1000
    while True:
        req = urllib.request.Request(
            f"{BASE}/stories?type=eq.novel&select=id,title,slug,description,total_chapters,author_name&offset={offset}&limit={limit}",
            headers=HEADERS
        )
        batch = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        all_stories.extend(batch)
        if len(batch) < limit:
            break
        offset += limit

    print(f"Total novel stories to scan: {len(all_stories)}")
    
    start_time = time.time()
    updated_count = 0
    clean_count = 0
    del_total = 0
    
    # Process concurrently with 15 workers
    with ThreadPoolExecutor(max_workers=15) as executor:
        for i, res in enumerate(executor.map(process_single_story, all_stories)):
            if res['status'] == 'updated':
                updated_count += 1
                del_total += res.get('deleted_frontmatter', 0)
                print(f"[{i+1}/{len(all_stories)}] UPDATED: {res['story']} (Deleted FM: {res['deleted_frontmatter']}, Meta: {len(res['metadata_keys'])}, Syn: {res['has_synopsis']})")
            elif res['status'] == 'clean':
                clean_count += 1
            if (i + 1) % 100 == 0:
                print(f"Progress: {i+1}/{len(all_stories)} | Updated: {updated_count} | Clean: {clean_count}")

    duration = time.time() - start_time
    print("=" * 60)
    print(f"MIGRATION COMPLETE in {duration:.1f}s!")
    print(f"Total stories scanned: {len(all_stories)}")
    print(f"Stories updated (cleaned & metadata moved to desc): {updated_count}")
    print(f"Frontmatter clutter chapters deleted: {del_total}")
    print(f"Already clean stories: {clean_count}")
    print("=" * 60)

if __name__ == '__main__':
    main()
