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
      .select("id, email, display_name, coins_balance, vip_level, vip_until, role, created_at, updated_at")
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
    const { user_id, amount, action, vip_level, vip_days } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Direct VIP Upgrade / Modification
    if (action === "upgrade_vip") {
      const level = Math.min(4, Math.max(0, parseInt(vip_level ?? 1, 10)));
      const days = parseInt(vip_days ?? 30, 10);

      const { data: existingUser, error: fetchErr } = await supabase
        .from("profiles")
        .select("id, vip_level, vip_until")
        .eq("id", user_id)
        .single();

      if (fetchErr) throw fetchErr;

      let newVipUntil: string | null = null;
      if (level > 0) {
        if (days === -1) {
          // Vĩnh viễn (100 năm)
          newVipUntil = new Date(Date.now() + 100 * 365 * 86400000).toISOString();
        } else {
          const currentExp = existingUser.vip_until ? new Date(existingUser.vip_until).getTime() : 0;
          const baseTime = currentExp > Date.now() ? currentExp : Date.now();
          newVipUntil = new Date(baseTime + days * 86400000).toISOString();
        }
      } else {
        // Hủy VIP (trở về Free)
        newVipUntil = null;
      }

      const { data: updated, error: updateErr } = await supabase
        .from("profiles")
        .update({
          vip_level: level,
          vip_until: newVipUntil,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: level > 0
          ? `Đã nâng cấp tài khoản lên VIP ${level} thành công!`
          : `Đã đưa tài khoản về Độc giả thường.`,
        user: updated,
      });
    }

    // 2. Adjust Coin Balance
    if (amount === undefined) {
      return NextResponse.json(
        { success: false, error: "amount là bắt buộc khi chỉnh xu" },
        { status: 400 }
      );
    }

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
