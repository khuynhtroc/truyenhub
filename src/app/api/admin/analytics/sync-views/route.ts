import { NextResponse } from "next/server";
import { syncRealViewsToDatabase } from "@/lib/analytics/ga4";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { propertyId } = body;

    // If propertyId provided, save it to settings so subsequent syncs remember it
    if (propertyId) {
      try {
        const supabase = createAdminSupabaseClient();
        const { data: siteRow } = await supabase.from("settings").select("value").eq("key", "site").single();
        if (siteRow) {
          const updatedValue = { ...siteRow.value, ga4_property_id: propertyId.trim() };
          await supabase.from("settings").update({ value: updatedValue, updated_at: new Date().toISOString() }).eq("key", "site");
        }
      } catch (saveErr) {
        console.warn("Could not persist ga4_property_id to settings:", saveErr);
      }
    }

    const result = await syncRealViewsToDatabase(propertyId);

    return NextResponse.json({
      success: true,
      message: result.ga4Fetched
        ? `Đã đồng bộ thành công ${result.ga4ViewsCount} lượt xem từ Google Analytics & ${result.historySyncedCount} lượt đọc nội bộ!`
        : `Đã đồng bộ thành công ${result.historySyncedCount} truyện từ lịch sử đọc nội bộ thực tế! (Lưu ý: Thêm service account vào GA4 nếu muốn kéo view trực tiếp)`,
      ...result,
    });
  } catch (error: any) {
    console.error("Sync views error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
