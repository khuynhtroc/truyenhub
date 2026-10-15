import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID bình luận" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: current } = await supabase.from("comments").select("likes_count").eq("id", id).single();
    const newLikes = (current?.likes_count || 0) + 1;

    const { error } = await supabase
      .from("comments")
      .update({ likes_count: newLikes })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, likes: newLikes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
