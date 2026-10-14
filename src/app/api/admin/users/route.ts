import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("profiles")
      .select("id, email, display_name, coins_balance, vip_level, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) {
      query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, users: users || [] });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, amount, action } = body;

    if (!user_id || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "user_id và amount là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: user, error: fetchErr } = await supabase
      .from("profiles")
      .select("coins_balance")
      .eq("id", user_id)
      .single();

    if (fetchErr) throw fetchErr;

    const currentCoins = user.coins_balance || 0;
    const newCoins =
      action === "set" ? Math.max(0, parseInt(amount, 10)) : Math.max(0, currentCoins + parseInt(amount, 10));

    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update({ coins_balance: newCoins, updated_at: new Date().toISOString() })
      .eq("id", user_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Admin users POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
