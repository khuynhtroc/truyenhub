import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqvffeqjgjtzprouwshd.supabase.co";

function resolveServiceKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envKey && typeof envKey === "string") {
    const cleanKey = envKey.replace(/["'\r\n\s]/g, "").trim();
    if (cleanKey.length > 10) {
      return cleanKey;
    }
  }
  return "";
}

export const SUPABASE_SERVICE_KEY = resolveServiceKey();

export function createAdminSupabaseClient() {
  return createClient(SUPABASE_URL, resolveServiceKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createAdminClient = createAdminSupabaseClient;


