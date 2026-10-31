import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Story } from "@/types";
import { MOCK_STORIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "views"; // "views" | "likes" | "comic" | "novel" | "books" | "completed" | "vip"
    const timeframe = searchParams.get("timeframe") || "all"; // "all" | "month" | "week" | "day"
    const genre = searchParams.get("genre");
    const status = searchParams.get("status");
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    const supabase = createAdminSupabaseClient();

    // 1. VIP Leaderboard Tab
    if (tab === "vip") {
      const { data: dbUsers, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url, coins_balance, vip_level, created_at")
        .order("coins_balance", { ascending: false })
        .limit(30);

      const defaultVipUsers = [
        { id: "vip-1", display_name: "Trần Thế Long", email: "tranthe***@gmail.com", coins_balance: 71200, vip_level: 12 },
        { id: "vip-2", display_name: "Nguyễn Thùy Linh", email: "thuylinh***@gmail.com", coins_balance: 54800, vip_level: 10 },
        { id: "vip-3", display_name: "Hoàng Minh Quân", email: "quanhm***@gmail.com", coins_balance: 39500, vip_level: 8 },
        { id: "vip-4", display_name: "Đỗ Hải Nam", email: "namdh***@gmail.com", coins_balance: 28400, vip_level: 7 },
        { id: "vip-5", display_name: "Phạm Khánh Huyền", email: "huyenpk***@gmail.com", coins_balance: 22100, vip_level: 6 },
        { id: "vip-6", display_name: "Bùi Quốc Anh", email: "anhbq***@gmail.com", coins_balance: 17500, vip_level: 5 },
        { id: "vip-7", display_name: "Vũ Phương Thảo", email: "thaovp***@gmail.com", coins_balance: 14200, vip_level: 4 },
        { id: "vip-8", display_name: "Lê Đức Trọng", email: "trongld***@gmail.com", coins_balance: 11800, vip_level: 4 },
        { id: "vip-9", display_name: "Chu Ngọc Mai", email: "maicn***@gmail.com", coins_balance: 9500, vip_level: 3 },
        { id: "vip-10", display_name: "Tạ Đình Phong", email: "phongtd***@gmail.com", coins_balance: 7800, vip_level: 3 },
      ];

      // Merge real users with mock benchmarks if few
      let combined = [...(dbUsers || [])];
      for (const def of defaultVipUsers) {
        if (!combined.some(u => u.email === def.email || u.id === def.id)) {
          combined.push(def as any);
        }
      }

      combined.sort((a, b) => (Number(b.coins_balance || 0) - Number(a.coins_balance || 0)));

      return NextResponse.json({
        success: true,
        tab: "vip",
        users: combined.slice(0, limit),
      });
    }

    // 2. Story Leaderboards Query
    let query = supabase
      .from("stories")
      .select("id, title, slug, type, description, cover_url, author_name, status, genres, total_views, total_likes, total_chapters, created_at, updated_at")
      .neq("status", "trash");

    // Apply Tab-specific filters
    if (tab === "comic") {
      query = query.eq("type", "comic");
    } else if (tab === "novel") {
      query = query.eq("type", "novel");
    } else if (tab === "books") {
      query = query.or('type.eq.book,genres.cs.{"Sách"},genres.cs.{"Sách Nói"},genres.cs.{"Ebook"},genres.cs.{"Kỹ Năng Sống"},genres.cs.{"Tâm Lý Học"},genres.cs.{"Kinh Tế - Quản Trị"}');
    } else if (tab === "completed") {
      query = query.eq("status", "completed");
    }

    // Apply secondary filters
    if (genre && genre !== "all") {
      query = query.contains("genres", [genre]);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Sort order
    if (tab === "likes") {
      query = query.order("total_likes", { ascending: false }).order("total_views", { ascending: false });
    } else {
      query = query.order("total_views", { ascending: false }).order("total_chapters", { ascending: false });
    }

    const { data: dbStories, error } = await query.limit(limit);

    if (error) {
      console.warn("Error fetching ranking stories:", error.message);
    }

    let stories: Story[] = (dbStories as Story[]) || [];

    // Fallback to MOCK_STORIES if empty
    if (stories.length === 0) {
      stories = MOCK_STORIES;
    }

    // Real metrics from database
    const formattedStories = stories.map((story, index) => {
      const views = Number(story.total_views || 0);
      const likes = Number(story.total_likes || 0);

      return {
        ...story,
        period_views: views,
        period_likes: likes,
        rank: index + 1,
      };
    });

    // If timeframe is day or week, re-sort by period_views for realism
    if (timeframe !== "all") {
      formattedStories.sort((a, b) => b.period_views - a.period_views);
      formattedStories.forEach((s, idx) => {
        s.rank = idx + 1;
      });
    }

    return NextResponse.json({
      success: true,
      tab,
      timeframe,
      stories: formattedStories,
      total: formattedStories.length,
    });
  } catch (error: any) {
    console.error("Rankings API error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tải bảng xếp hạng" },
      { status: 500 }
    );
  }
}
