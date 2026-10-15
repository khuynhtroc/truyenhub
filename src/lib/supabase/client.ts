import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqvffeqjgjtzprouwshd.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDU0MTcsImV4cCI6MjEwNzQ4MTQxN30.ZoidaHP5yKPboaMLaSaeGCw5YIrhtsrGCk5uw5cc3z8";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
