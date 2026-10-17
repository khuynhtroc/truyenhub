import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  MISSION_DEFINITIONS,
  MISSIONS_KEY,
  MissionActionType,
  DailyMissionLog,
  getVietnamDateStr,
} from "@/lib/missions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const todayStr = getVietnamDateStr();

    // Fetch existing mission logs
    const { data: mSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", MISSIONS_KEY)
      .maybeSingle();

    const allLogs: DailyMissionLog[] = (mSettings?.value as DailyMissionLog[]) || [];
    const todayUserLogs = user
      ? allLogs.filter((l) => l.user_id === user.id && l.date === todayStr)
      : [];

    let currentBalance = 0;
    if (user) {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("coins_balance, coins")
        .eq("id", user.id)
        .maybeSingle();
      currentBalance = Number(profile?.coins_balance ?? profile?.coins ?? 0);
    }

    let totalCoinsEarnedToday = 0;

    const missions = Object.values(MISSION_DEFINITIONS).map((def) => {
      const actionLogs = todayUserLogs.filter((l) => l.action === def.id);
      const completedCount = actionLogs.length;
      const isCompleted = completedCount >= def.daily_limit;
      const coinsEarned = actionLogs.reduce((sum, l) => sum + (l.coins_reward || 0), 0);

      totalCoinsEarnedToday += coinsEarned;

      return {
        ...def,
        completed_count: completedCount,
        coins_earned_today: coinsEarned,
        is_completed: isCompleted,
      };
    });

    return NextResponse.json({
      authenticated: Boolean(user),
      today: todayStr,
      coins_balance: currentBalance,
      total_coins_earned_today: totalCoinsEarnedToday,
      missions,
    });
  } catch (error: any) {
    console.error("GET /api/missions error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tải thông tin nhiệm vụ." },
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
        { error: "Vui lòng đăng nhập để nhận Xu thưởng nhiệm vụ." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as MissionActionType;
    const metadata = body.metadata || {};

    const mission = MISSION_DEFINITIONS[action];
    if (!mission) {
      return NextResponse.json(
        { error: `Nhiệm vụ '${action}' không hợp lệ.` },
        { status: 400 }
      );
    }

    const todayStr = getVietnamDateStr();

    // 2. Fetch mission logs
    const { data: mSettings } = await adminSupabase
      .from("settings")
      .select("value")
      .eq("key", MISSIONS_KEY)
      .maybeSingle();

    const allLogs: DailyMissionLog[] = (mSettings?.value as DailyMissionLog[]) || [];
    const todayActionLogs = allLogs.filter(
      (l) => l.user_id === user.id && l.date === todayStr && l.action === action
    );

    // 3. Check daily limit
    if (todayActionLogs.length >= mission.daily_limit) {
      return NextResponse.json(
        {
          success: false,
          already_completed: true,
          message: `Hôm nay bạn đã hoàn thành nhiệm vụ "${mission.title}" (${todayActionLogs.length}/${mission.daily_limit} ${mission.unit}). Hãy quay lại vào ngày mai nhé!`,
        },
        { status: 200 }
      );
    }

    // 4. Calculate reward & create log
    const reward = mission.reward_coins;
    const newLog: DailyMissionLog = {
      id: `msn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      action,
      date: todayStr,
      coins_reward: reward,
      metadata,
      created_at: new Date().toISOString(),
    };

    // Filter to retain last 30 days to keep JSON size optimized
    const thirtyDaysAgoStr = getVietnamDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const prunedLogs = allLogs.filter((l) => l.date >= thirtyDaysAgoStr);
    prunedLogs.push(newLog);

    await adminSupabase.from("settings").upsert({
      key: MISSIONS_KEY,
      value: prunedLogs,
      updated_at: new Date().toISOString(),
    });

    // 5. Update user profile coin balance
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, coins_balance, coins")
      .eq("id", user.id)
      .maybeSingle();

    const currentCoins = Number(profile?.coins_balance ?? profile?.coins ?? 0);
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

    // 6. Record transaction
    try {
      await adminSupabase.from("coin_transactions").insert({
        user_id: user.id,
        amount_vnd: 0,
        coins_added: reward,
        order_code: `MISSION_${action.toUpperCase()}_${todayStr}_${Date.now()}`,
        status: "completed",
      });
    } catch (e) {
      console.warn("Could not log coin_transactions for mission:", e);
    }

    const currentCount = todayActionLogs.length + 1;
    const message =
      action === "share"
        ? `🎉 Tuyệt vời! Bạn nhận được +100 Xu khi chia sẻ DocTruyen.vip với bạn bè!`
        : `🎉 Bạn nhận được +${reward} Xu (${mission.title} ${currentCount}/${mission.daily_limit})!`;

    return NextResponse.json({
      success: true,
      coins_reward: reward,
      action,
      current_count: currentCount,
      daily_limit: mission.daily_limit,
      is_completed: currentCount >= mission.daily_limit,
      new_balance: newCoins,
      message,
    });
  } catch (error: any) {
    console.error("POST /api/missions error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý nhiệm vụ tích Xu." },
      { status: 500 }
    );
  }
}
