import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const story_id = searchParams.get("story_id");

    if (!story_id) {
      return NextResponse.json(
        { success: false, error: "story_id là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("id, story_id, chapter_number, title, is_locked, price_coins, created_at, content_text, pages_images")
      .eq("story_id", story_id)
      .order("chapter_number", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      chapters: chapters || [],
    });
  } catch (error: any) {
    console.error("Admin chapters GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { story_id, chapter_number, title, is_locked, price_coins, content_text, pages_images } = body;

    if (!story_id || chapter_number === undefined) {
      return NextResponse.json(
        { success: false, error: "story_id và chapter_number là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("chapters")
      .insert({
        story_id,
        chapter_number: parseFloat(chapter_number),
        title: title || `Chương ${chapter_number}`,
        is_locked: !!is_locked,
        price_coins: parseInt(price_coins || "0", 10),
        content_text: content_text || null,
        pages_images: pages_images || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate total_chapters for story
    const { count } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true })
      .eq("story_id", story_id);

    await supabase
      .from("stories")
      .update({ total_chapters: count || 0, updated_at: new Date().toISOString() })
      .eq("id", story_id);

    return NextResponse.json({ success: true, chapter: data });
  } catch (error: any) {
    console.error("Admin chapters POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, chapter_number, title, is_locked, price_coins, content_text, pages_images } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID chương là bắt buộc" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const updatePayload: Record<string, any> = {};

    if (chapter_number !== undefined) updatePayload.chapter_number = parseFloat(chapter_number);
    if (title !== undefined) updatePayload.title = title;
    if (is_locked !== undefined) updatePayload.is_locked = !!is_locked;
    if (price_coins !== undefined) updatePayload.price_coins = parseInt(price_coins, 10);
    if (content_text !== undefined) updatePayload.content_text = content_text;
    if (pages_images !== undefined) updatePayload.pages_images = pages_images;

    const { data, error } = await supabase
      .from("chapters")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, chapter: data });
  } catch (error: any) {
    console.error("Admin chapters PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID chương là bắt buộc" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    // Get chapter to know story_id
    const { data: chap } = await supabase
      .from("chapters")
      .select("story_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (error) throw error;

    if (chap && chap.story_id) {
      const { count } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("story_id", chap.story_id);

      await supabase
        .from("stories")
        .update({ total_chapters: count || 0, updated_at: new Date().toISOString() })
        .eq("id", chap.story_id);
    }

    return NextResponse.json({ success: true, message: "Đã xóa chương thành công" });
  } catch (error: any) {
    console.error("Admin chapters DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
