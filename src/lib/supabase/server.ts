import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqvffeqjgjtzprouwshd.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDU0MTcsImV4cCI6MjEwNzQ4MTQxN30.ZoidaHP5yKPboaMLaSaeGCw5YIrhtsrGCk5uw5cc3z8";

let cachedPublicClient: SupabaseClient | null = null;

export function getPublicSupabase() {
  if (!cachedPublicClient) {
    cachedPublicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedPublicClient;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              ...(process.env.NODE_ENV === "production" ? { domain: ".doctruyen.vip" } : {}),
            })
          );
        } catch {
          // Can happen in Server Components
        }
      },
    },
  });
}
