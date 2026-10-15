import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Total stories & breakdown
    const { count: totalStories } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true });

    const { count: totalComics } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("type", "comic");

    const { count: totalNovels } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("type", "novel");

    const { count: totalBooks } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .or('type.eq.book,genres.cs.{"Sách"},genres.cs.{"Sách Nói"},genres.cs.{"Ebook"},genres.cs.{"Kỹ Năng Sống"}');

    const { count: totalTrash } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("status", "trash");

    // 2. Total chapters & locked
    const { count: totalChapters } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true });

    const { count: totalLockedChapters } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true })
      .eq("is_locked", true);

    // 3. Profiles, Posts, Media, Comments, Reports
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    const { count: totalPages } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("type", "page");

    const { count: totalBlogs } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .neq("type", "page");

    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    // Reports count from settings
    let totalReports = 0;
    try {
      const { data: repRow } = await supabase.from("settings").select("value").eq("key", "story_reports").single();
      if (repRow && Array.isArray(repRow.value)) {
        totalReports = repRow.value.length;
      }
    } catch (_) {}

    // 4. Recent stories
    const { data: recentStories } = await supabase
      .from("stories")
      .select("id, title, slug, type, total_chapters, total_views, updated_at")
      .neq("status", "trash")
      .order("updated_at", { ascending: false })
      .limit(6);

    return NextResponse.json({
      success: true,
      stats: {
        totalStories: totalStories || 0,
        totalComics: totalComics || 0,
        totalNovels: totalNovels || 0,
        totalBooks: totalBooks || 0,
        totalTrash: totalTrash || 0,
        totalChapters: totalChapters || 0,
        totalLockedChapters: totalLockedChapters || 0,
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalPages: totalPages || 0,
        totalBlogs: totalBlogs || 0,
        totalComments: totalComments || 0,
        totalReports: totalReports || 0,
        recentStories: recentStories || [],
        system: {
          domain: "https://doctruyen.vip",
          mediaDomain: "https://media.doctruyen.vip",
          gaId: "G-0CBF77MVXY",
          gtmId: "GTM-N7TTTGPL",
          database: "Supabase Postgres Connected",
          storage: "Cloudflare R2 Connected",
        },
      },
    });
  } catch (error: any) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load stats" },
      { status: 500 }
    );
  }
}
