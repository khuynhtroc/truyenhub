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

    // 1. VIP / Readers Real Points Leaderboard Tab
    if (tab === "vip") {
      const { data: dbUsers, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url, coins_balance, role, created_at")
        .order("coins_balance", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("Error fetching real ranking users:", error);
      }

      // Mask email for privacy if display_name is not set
      const realUsers = (dbUsers || []).map((u) => {
        let name = u.display_name?.trim();
        if (!name && u.email) {
          const parts = u.email.split("@");
          const username = parts[0];
          const maskedUser = username.length > 3 
            ? `${username.slice(0, 3)}***` 
            : `${username}***`;
          name = `${maskedUser}@${parts[1] || "gmail.com"}`;
        }
        return {
          id: u.id,
          display_name: name || "Độc Giả",
          email: u.email,
          avatar_url: u.avatar_url || null,
          coins_balance: Number(u.coins_balance || 0),
          created_at: u.created_at,
        };
      });

      return NextResponse.json({
        success: true,
        tab: "vip",
        users: realUsers,
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
