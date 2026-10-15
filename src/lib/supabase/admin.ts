import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://tvgipyhvvtovgttnyivw.supabase.co";

// Master Verified Service Role Key for tvgipyhvvtovgttnyivw
export const MASTER_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0";

function resolveServiceKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envKey && typeof envKey === "string") {
    const cleanKey = envKey.replace(/["'\r\n\s]/g, "").trim();
    if (cleanKey.split(".").length === 3 && cleanKey.includes("tvgipyhvvtovgttnyivw")) {
      return cleanKey;
    }
  }
  return MASTER_SERVICE_ROLE_KEY;
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


