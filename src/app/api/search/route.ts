import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MOCK_STORIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: dbResults } = await supabase
      .from("stories")
      .select("*")
      .or(`title.ilike.%${q}%,author_name.ilike.%${q}%,slug.ilike.%${q}%`)
      .order("total_views", { ascending: false })
      .limit(12);

    if (dbResults && dbResults.length > 0) {
      return NextResponse.json({ results: dbResults });
    }
  } catch (error) {
    console.error("Supabase search error:", error);
  }

  const lowerQ = q.toLowerCase();
  const results = MOCK_STORIES.filter(
    (story) =>
      (story.title || "").toLowerCase().includes(lowerQ) ||
      (story.author_name || "").toLowerCase().includes(lowerQ) ||
      (story.slug || "").toLowerCase().includes(lowerQ) ||
      (Array.isArray(story.genres) && story.genres.some((g) => (g || "").toLowerCase().includes(lowerQ)))
  );

  return NextResponse.json({ results: results.slice(0, 12) });
}
