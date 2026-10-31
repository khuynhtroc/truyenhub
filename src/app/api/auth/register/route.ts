import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqvffeqjgjtzprouwshd.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTkwNTQxNywiZXhwIjoyMTA3NDgxNDE3fQ.JOX4r3s7OSsqImlnjRMHD4m4giOAYxN97yZq8a94Q1A";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu không được để trống" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user pre-confirmed so they can log in instantly without waiting for email verification
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split("@")[0],
      },
    });

    if (error) {
      // If user already exists
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return NextResponse.json({ error: "Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập." }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Tặng ngay 1.000 Xu chào mừng cho tài khoản mới đăng ký
    if (data?.user?.id) {
      try {
        await adminClient.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email,
            display_name: fullName || email.split("@")[0],
            coins_balance: 1000,
            role: "member",
            source: "web",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.error("Lỗi cấp 1000 xu cho tài khoản mới:", profileErr);
      }
    }

    return NextResponse.json({ success: true, user: data.user, bonus_coins: 1000 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi tạo tài khoản" }, { status: 500 });
  }
}
