import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DailyCheckin } from "@/types";

export const dynamic = "force-dynamic";

const CHECKIN_KEY = "daily_checkins";
const REWARDS = [5, 5, 10, 10, 15, 15, 30]; // Day 1 to Day 7 rewards

function getVietnamDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getYesterdayVietnamDateStr(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return getVietnamDateStr(d);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const todayStr = getVietnamDateStr();
    const yesterdayStr = getYesterdayVietnamDateStr();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        today: todayStr,
        rewards: REWARDS,
        hasCheckedInToday: false,
        currentStreak: 0,
        nextStreak: 1,
        nextReward: REWARDS[0],
      });
    }

    const { data: cSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", CHECKIN_KEY)
      .single();

    const checkins: DailyCheckin[] = (cSettings?.value as DailyCheckin[]) || [];
    const userCheckins = checkins
      .filter((c) => c.user_id === user.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const latest = userCheckins[0];
    const hasCheckedInToday = latest?.date === todayStr;

    let currentStreak = 0;
    let nextStreak = 1;

    if (hasCheckedInToday) {
      currentStreak = latest.streak_days || 1;
      nextStreak = (currentStreak % 7) + 1;
    } else if (latest?.date === yesterdayStr) {
      currentStreak = latest.streak_days || 0;
      nextStreak = (currentStreak % 7) + 1;
    } else {
      currentStreak = 0;
      nextStreak = 1;
    }

    return NextResponse.json({
      authenticated: true,
      today: todayStr,
      rewards: REWARDS,
      hasCheckedInToday,
      currentStreak,
      nextStreak,
      nextReward: REWARDS[nextStreak - 1],
      totalCheckins: userCheckins.length,
      history: userCheckins.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Checkin GET error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi kiểm tra điểm danh." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để điểm danh nhận Xu." },
        { status: 401 }
      );
    }

    const todayStr = getVietnamDateStr();
    const yesterdayStr = getYesterdayVietnamDateStr();

    // 2. Fetch checkins
    const { data: cSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", CHECKIN_KEY)
      .single();

    const checkins: DailyCheckin[] = (cSettings?.value as DailyCheckin[]) || [];
    const userCheckins = checkins
      .filter((c) => c.user_id === user.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const latest = userCheckins[0];

    if (latest?.date === todayStr) {
      return NextResponse.json(
        { error: "Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai nhé." },
        { status: 400 }
      );
    }

    // 3. Calculate streak and reward
    let newStreak = 1;
    if (latest?.date === yesterdayStr) {
      newStreak = (latest.streak_days % 7) + 1;
    }

    const reward = REWARDS[newStreak - 1] || 5;

    // 4. Update checkins in settings
    const newRecord: DailyCheckin = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      date: todayStr,
      streak_days: newStreak,
      reward_coins: reward,
      created_at: new Date().toISOString(),
    };

    checkins.push(newRecord);

    await adminSupabase.from("settings").upsert({
      key: CHECKIN_KEY,
      value: checkins,
      updated_at: new Date().toISOString(),
    });

    // 5. Update user profile coins balance
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, coins_balance")
      .eq("id", user.id)
      .single();

    const currentCoins = Number(profile?.coins_balance || 0);
    const newCoins = currentCoins + reward;

    if (profile) {
      await adminSupabase
        .from("profiles")
        .update({ coins_balance: newCoins })
        .eq("id", user.id);
    } else {
      await adminSupabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        coins_balance: newCoins,
      });
    }

    // 6. Log transaction
    try {
      await adminSupabase.from("coin_transactions").insert({
        user_id: user.id,
        amount_vnd: 0,
        coins_added: reward,
        order_code: `CHECKIN_${todayStr}_${Date.now()}`,
        status: "completed",
      });
    } catch (e) {
      console.warn("Could not log coin_transactions:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Điểm danh Ngày ${newStreak} thành công! Bạn nhận được +${reward} Xu.`,
      reward_coins: reward,
      streak: newStreak,
      new_balance: newCoins,
    });
  } catch (error: any) {
    console.error("Checkin POST error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý điểm danh." },
      { status: 500 }
    );
  }
}
