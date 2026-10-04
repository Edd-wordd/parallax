"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseBrowserClient, setSupabaseAccessTokenGetter } from "@/lib/supabase/client";
import { ensureDefaultLocationAndGear } from "@/lib/supabase/queries";
import { useAppStore } from "@/lib/store";

type AuthContextValue = {
  ready: boolean;
  userId: string | null;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  userId: null,
  error: null,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setActiveLocation = useAppStore((s) => s.setActiveLocation);
  const setActiveGear = useAppStore((s) => s.setActiveGear);

  const loadLocalToken = useCallback(async () => {
    const res = await fetch("/api/auth/local-token");
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Failed to get local auth token");
    }
    const body = (await res.json()) as { token: string; userId: string };
    return body;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cachedToken: string | null = null;

    async function init() {
      try {
        const { token, userId: uid } = await loadLocalToken();
        if (cancelled) return;
        cachedToken = token;
        setSupabaseAccessTokenGetter(async () => cachedToken);
        setUserId(uid);

        const client = getSupabaseBrowserClient();
        const { locationId, gearId } = await ensureDefaultLocationAndGear(client);
        if (cancelled) return;
        setActiveLocation(locationId);
        setActiveGear(gearId);
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Auth failed");
        setReady(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [loadLocalToken, setActiveLocation, setActiveGear]);

  const value = useMemo(
    () => ({ ready, userId, error }),
    [ready, userId, error],
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-medium text-red-300">Auth / data setup failed</p>
          <p className="text-xs text-zinc-400">{error}</p>
          <p className="text-xs text-zinc-500">
            Check Supabase is running and .env.local matches `supabase status`.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Connecting…
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
