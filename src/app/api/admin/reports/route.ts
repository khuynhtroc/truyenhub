import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface StoryReport {
  id: string;
  story_id?: string;
  story_title: string;
  chapter_title?: string;
  type: "missing_images" | "duplicate_chapter" | "audio_error" | "translation_error" | "broken_link" | "other";
  type_label: string;
  content: string;
  reporter?: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const supabase = createAdminSupabaseClient();
    const { data: row, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "story_reports")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    let reports: StoryReport[] = (row && Array.isArray(row.value)) ? row.value : [];

    if (status && status !== "all") {
      reports = reports.filter(r => r.status === status);
    }

    if (q) {
      reports = reports.filter(r =>
        r.story_title.toLowerCase().includes(q) ||
        (r.chapter_title && r.chapter_title.toLowerCase().includes(q)) ||
        r.content.toLowerCase().includes(q) ||
        (r.reporter && r.reporter.toLowerCase().includes(q))
      );
    }

    // Sort by created_at desc
    reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      reports,
      total: reports.length,
      pendingCount: reports.filter(r => r.status === "pending").length,
      resolvedCount: reports.filter(r => r.status === "resolved").length,
    });
  } catch (error: any) {
    console.error("GET reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải danh sách báo cáo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      story_id,
      story_title,
      chapter_title,
      type = "other",
      type_label = "Báo cáo lỗi",
      content,
      reporter = "Độc giả ẩn danh"
    } = body;

    if (!story_title || !content) {
      return NextResponse.json(
        { success: false, error: "Tên truyện và nội dung báo cáo là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: row } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "story_reports")
      .single();

    let reports: StoryReport[] = (row && Array.isArray(row.value)) ? row.value : [];

    const newReport: StoryReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      story_id: story_id || "",
      story_title,
      chapter_title: chapter_title || "",
      type,
      type_label,
      content,
      reporter,
      status: "pending",
      created_at: new Date().toISOString()
    };

    reports.unshift(newReport);

    const { error: upsertErr } = await supabase.from("settings").upsert({
      key: "story_reports",
      value: reports,
      updated_at: new Date().toISOString()
    });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      success: true,
      message: "Cảm ơn bạn đã gửi báo cáo lỗi! Ban quản trị sẽ kiểm tra và khắc phục sớm nhất.",
      report: newReport
    });
  } catch (error: any) {
    console.error("POST reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi gửi báo cáo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID hoặc trạng thái báo cáo" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: row, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "story_reports")
      .single();

    if (error) throw error;

    let reports: StoryReport[] = (row && Array.isArray(row.value)) ? row.value : [];
    const index = reports.findIndex(r => r.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy báo cáo lỗi" },
        { status: 404 }
      );
    }

    reports[index].status = status;

    const { error: upsertErr } = await supabase.from("settings").upsert({
      key: "story_reports",
      value: reports,
      updated_at: new Date().toISOString()
    });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật trạng thái báo cáo thành công!",
      report: reports[index]
    });
  } catch (error: any) {
    console.error("PUT reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật báo cáo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID báo cáo cần xóa" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: row, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "story_reports")
      .single();

    if (error) throw error;

    let reports: StoryReport[] = (row && Array.isArray(row.value)) ? row.value : [];
    reports = reports.filter(r => r.id !== id);

    const { error: upsertErr } = await supabase.from("settings").upsert({
      key: "story_reports",
      value: reports,
      updated_at: new Date().toISOString()
    });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      success: true,
      message: "Đã xóa báo cáo thành công!"
    });
  } catch (error: any) {
    console.error("DELETE reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xóa báo cáo" },
      { status: 500 }
    );
  }
}
