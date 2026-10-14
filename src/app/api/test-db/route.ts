import { NextResponse } from "next/server";
import { createServerSupabaseClient, SUPABASE_URL } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("stories").select("id, title, slug, type").limit(5);
    return NextResponse.json({
      success: !error,
      error: error ? error.message : null,
      projectUrl: SUPABASE_URL,
      sampleStories: data,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
