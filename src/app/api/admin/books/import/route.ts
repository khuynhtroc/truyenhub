import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitTextIntoChapters(text: string): { title: string; content: string }[] {
  // Regex to match chapter markers like "Chương 1", "Chương I", "Hồi 1", "Phần 1", "Chapter 1"
  const chapterRegex = /(?:^|\n)(?:(?:Chương|Hồi|Phần|Mục|Chapter|Tiết)\s*([0-9IVXLCDMivxlcdm]+|[A-Za-z0-9\s]+)[:\.\-\s]+[^\n]*)/i;
  
  const lines = text.split(/\r?\n/);
  const chapters: { title: string; content: string[] }[] = [];
  let currentTitle = "Phần Mở Đầu";
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.match(/^(?:Chương|Hồi|Phần|Mục|Chapter|Tiết)\s*([0-9IVXLCDMivxlcdm]+|[0-9]+)/i) ||
      (trimmed.length < 80 && trimmed.match(/^(Chương|Phần|Hồi)\s*\d+/i))
    ) {
      if (currentLines.length > 0 || currentTitle !== "Phần Mở Đầu") {
        chapters.push({
          title: currentTitle,
          content: currentLines,
        });
      }
      currentTitle = trimmed;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || chapters.length === 0) {
    chapters.push({
      title: currentTitle,
      content: currentLines,
    });
  }

  return chapters.map((ch, idx) => ({
    title: ch.title || `Chương ${idx + 1}`,
    content: ch.content.join("\n").trim(),
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      importMode = "separate_books", // "separate_books" | "single_book_chapters" | "raw_books"
      singleBookTitle = "Sách Mới Nhập",
      singleBookAuthor = "Tác giả",
      singleBookDescription = "",
      files = [], // Array of { filename: string, content: string }
      books = [], // Preformatted books array
    } = body;

    const supabase = createAdminSupabaseClient();
    const createdStories: any[] = [];

    // Mode 1: Pre-formatted books array
    if (importMode === "raw_books" && Array.isArray(books) && books.length > 0) {
      for (const b of books) {
        const title = (b.title || "Sách Không Tên").trim();
        const baseSlug = generateSlug(title) || `sach-${Date.now()}`;
        const slug = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`;
        
        let genres = Array.isArray(b.genres) ? b.genres : ["Sách", "Phát Triển Bản Thân", "Kỹ Năng Sống"];
        if (!genres.includes("Sách")) genres.push("Sách");

        const { data: story, error: sErr } = await supabase
          .from("stories")
          .insert({
            title,
            slug,
            type: "book",
            author_name: b.author_name || "Nhiều tác giả",
            description: b.description || "Cuốn sách hay được tuyển chọn trên DocTruyen.vip.",
            cover_url: b.cover_url || "https://media.doctruyen.vip/covers/doraemon-cover.webp",
            status: "completed",
            genres,
            total_chapters: Array.isArray(b.chapters) ? b.chapters.length : 0,
            total_views: Math.floor(Math.random() * 1000) + 100,
            total_likes: Math.floor(Math.random() * 100) + 10,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (sErr) throw sErr;

        if (Array.isArray(b.chapters) && b.chapters.length > 0) {
          const chaptersPayload = b.chapters.map((ch: any, idx: number) => ({
            story_id: story.id,
            chapter_number: ch.chapter_number || idx + 1,
            title: ch.title || `Chương ${idx + 1}`,
            content: ch.content || "",
            view_count: 0,
            is_locked: false,
          }));

          await supabase.from("chapters").insert(chaptersPayload);
        }

        createdStories.push(story);
      }

      return NextResponse.json({
        success: true,
        message: `Đã nhập thành công ${createdStories.length} cuốn sách vào hệ thống!`,
        stories: createdStories,
      });
    }

    // Mode 2: Multiple files - Each file is a separate book
    if (importMode === "separate_books" && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const rawTitle = file.filename
          ? file.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim()
          : "Sách Hay";
        // Capitalize first letter of words
        const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        const baseSlug = generateSlug(title) || `sach-${Date.now()}`;
        const slug = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`;

        // Parse chapters from file content
        const parsedChapters = splitTextIntoChapters(file.content || "");

        const { data: story, error: sErr } = await supabase
          .from("stories")
          .insert({
            title,
            slug,
            type: "book",
            author_name: "Tác giả Tuyển Chọn",
            description: `Tác phẩm "${title}" - Cuốn sách bổ ích về tư duy, kỹ năng và cuộc sống được số hóa trên DocTruyen.vip.`,
            cover_url: "https://media.doctruyen.vip/covers/doraemon-cover.webp",
            status: "completed",
            genres: ["Sách", "Phát Triển Bản Thân", "Kỹ Năng Sống", "Truyện Chữ", "Hoàn Thành"],
            total_chapters: parsedChapters.length,
            total_views: Math.floor(Math.random() * 1500) + 200,
            total_likes: Math.floor(Math.random() * 150) + 15,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (sErr) throw sErr;

        if (parsedChapters.length > 0) {
          const chaptersPayload = parsedChapters.map((ch, idx) => ({
            story_id: story.id,
            chapter_number: idx + 1,
            title: ch.title,
            content: ch.content,
            view_count: 0,
            is_locked: false,
          }));

          // Batch insert in chunks of 50 to avoid size limits
          for (let i = 0; i < chaptersPayload.length; i += 50) {
            const chunk = chaptersPayload.slice(i, i + 50);
            await supabase.from("chapters").insert(chunk);
          }
        }

        createdStories.push(story);
      }

      return NextResponse.json({
        success: true,
        message: `Đã nhập và tự động phân chương thành công ${createdStories.length} cuốn sách từ các tệp tải lên!`,
        stories: createdStories,
      });
    }

    // Mode 3: All files belong to 1 single book as separate chapters
    if (importMode === "single_book_chapters" && Array.isArray(files) && files.length > 0) {
      const title = singleBookTitle.trim() || "Sách Mới Tuyển Chọn";
      const baseSlug = generateSlug(title) || `sach-${Date.now()}`;
      const slug = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`;

      const { data: story, error: sErr } = await supabase
        .from("stories")
        .insert({
          title,
          slug,
          type: "book",
          author_name: singleBookAuthor.trim() || "Tác giả Tuyển Chọn",
          description: singleBookDescription.trim() || `Tác phẩm "${title}" - Cuốn sách đặc sắc được đăng tải trên DocTruyen.vip.`,
          cover_url: "https://media.doctruyen.vip/covers/doraemon-cover.webp",
          status: "completed",
          genres: ["Sách", "Phát Triển Bản Thân", "Kỹ Năng Sống", "Truyện Chữ", "Hoàn Thành"],
          total_chapters: files.length,
          total_views: Math.floor(Math.random() * 2000) + 300,
          total_likes: Math.floor(Math.random() * 200) + 20,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sErr) throw sErr;

      const chaptersPayload = files.map((f: any, idx: number) => {
        const rawChTitle = f.filename
          ? f.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim()
          : `Chương ${idx + 1}`;
        return {
          story_id: story.id,
          chapter_number: idx + 1,
          title: rawChTitle.charAt(0).toUpperCase() + rawChTitle.slice(1),
          content: f.content || "",
          view_count: 0,
          is_locked: false,
        };
      });

      for (let i = 0; i < chaptersPayload.length; i += 50) {
        const chunk = chaptersPayload.slice(i, i + 50);
        await supabase.from("chapters").insert(chunk);
      }

      return NextResponse.json({
        success: true,
        message: `Đã tạo cuốn sách "${title}" với đầy đủ ${files.length} chương thành công!`,
        stories: [story],
      });
    }

    return NextResponse.json(
      { success: false, error: "Vui lòng chọn ít nhất một tệp để tải lên." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Book import API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi nhập sách" },
      { status: 500 }
    );
  }
}
