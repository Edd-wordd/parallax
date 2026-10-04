"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let browserClient: SupabaseClient | null = null;

/** Browser Supabase client (cookie session via @supabase/ssr). */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
  return browserClient;
}
