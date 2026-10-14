import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("stories").select("id, title, slug, type").limit(5);
    return NextResponse.json({
      success: !error,
      error: error ? error.message : null,
      data,
      envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "not set",
      envKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "not set",
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
