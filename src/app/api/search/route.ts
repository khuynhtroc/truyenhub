import { NextRequest, NextResponse } from "next/server";
import { MOCK_STORIES } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = MOCK_STORIES.filter(
    (story) =>
      story.title.toLowerCase().includes(q) ||
      story.author_name.toLowerCase().includes(q) ||
      story.genres.some((g) => g.toLowerCase().includes(q))
  );

  return NextResponse.json({ results: results.slice(0, 10) });
}
