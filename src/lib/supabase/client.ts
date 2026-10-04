"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

let browserClient: SupabaseClient | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setSupabaseAccessTokenGetter(
  getter: () => Promise<string | null>,
): void {
  tokenGetter = getter;
  browserClient = null;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    // Clerk / local JWT accessToken API (supabase-js 2.x)
    accessToken: async () => {
      if (!tokenGetter) return null;
      return tokenGetter();
    },
  } as Parameters<typeof createClient>[2]);
  return browserClient;
}
