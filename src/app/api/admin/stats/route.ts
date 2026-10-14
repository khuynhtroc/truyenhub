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

    // 2. Total chapters
    const { count: totalChapters } = await supabase
      .from("chapters")
      .select("*", { count: "exact", head: true });

    // 3. Total profiles
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // 4. Recent stories
    const { data: recentStories } = await supabase
      .from("stories")
      .select("id, title, slug, type, total_chapters, total_views, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6);

    return NextResponse.json({
      success: true,
      stats: {
        totalStories: totalStories || 0,
        totalComics: totalComics || 0,
        totalNovels: totalNovels || 0,
        totalChapters: totalChapters || 0,
        totalUsers: totalUsers || 0,
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
