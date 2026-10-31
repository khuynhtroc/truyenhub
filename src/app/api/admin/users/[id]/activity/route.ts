import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // 2. Fetch coin transactions
    const { data: transactions, error: txErr } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    // 3. Fetch reading history
    const { data: rawHistory, error: histErr } = await supabase
      .from("reading_history")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100);

    // Enrich reading history with stories & chapters
    const readingHistory: any[] = [];
    if (rawHistory && rawHistory.length > 0) {
      const storyIds = Array.from(new Set(rawHistory.map((h) => h.story_id).filter(Boolean)));
      const chapterIds = Array.from(new Set(rawHistory.map((h) => h.last_chapter_id).filter(Boolean)));

      let storiesMap: Record<string, any> = {};
      let chaptersMap: Record<string, any> = {};

      if (storyIds.length > 0) {
        const { data: stories } = await supabase
          .from("stories")
          .select("id, title, slug, cover_url, type, total_chapters")
          .in("id", storyIds);
        if (stories) {
          stories.forEach((s) => {
            storiesMap[s.id] = s;
          });
        }
      }

      if (chapterIds.length > 0) {
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id, chapter_number, title")
          .in("id", chapterIds);
        if (chapters) {
          chapters.forEach((c) => {
            chaptersMap[c.id] = c;
          });
        }
      }

      for (const h of rawHistory) {
        const st = storiesMap[h.story_id] || null;
        const ch = chaptersMap[h.last_chapter_id] || null;
        readingHistory.push({
          ...h,
          story: st,
          chapter: ch,
        });
      }
    }

    // 4. Fetch user comments
    const { data: comments } = await supabase
      .from("comments")
      .select("id, content, created_at, story_id, stories(title, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // 5. Calculate engagement & activity stats
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    let totalDepositVnd = 0;
    let totalCoinsAdded = 0;
    if (transactions) {
      for (const tx of transactions) {
        if (tx.status === "completed") {
          totalDepositVnd += tx.amount_vnd || 0;
          totalCoinsAdded += tx.coins_added || 0;
        }
      }
    }

    let readsPast7d = 0;
    let readsPast30d = 0;
    let latestActivityTimestamp = new Date(profile.created_at).getTime();

    if (profile.updated_at) {
      latestActivityTimestamp = Math.max(latestActivityTimestamp, new Date(profile.updated_at).getTime());
    }

    if (readingHistory.length > 0) {
      for (const h of readingHistory) {
        const t = new Date(h.updated_at).getTime();
        latestActivityTimestamp = Math.max(latestActivityTimestamp, t);
        if (t >= sevenDaysAgo) readsPast7d++;
        if (t >= thirtyDaysAgo) readsPast30d++;
      }
    }

    if (transactions && transactions.length > 0) {
      const t = new Date(transactions[0].created_at).getTime();
      latestActivityTimestamp = Math.max(latestActivityTimestamp, t);
    }

    const daysSinceJoined = Math.max(1, Math.floor((now - new Date(profile.created_at).getTime()) / 86400000));

    const stats = {
      totalStoriesRead: readingHistory.length,
      totalTransactions: transactions?.length || 0,
      totalDepositVnd,
      totalCoinsAdded,
      readsPast7d,
      readsPast30d,
      daysSinceJoined,
      totalComments: comments?.length || 0,
      lastActive: new Date(latestActivityTimestamp).toISOString(),
    };

    return NextResponse.json({
      success: true,
      profile,
      stats,
      transactions: transactions || [],
      readingHistory,
      comments: comments || [],
    });
  } catch (error: any) {
    console.error("Admin user activity error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
