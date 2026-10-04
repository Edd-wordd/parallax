"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ensureDefaultLocationAndGear,
  listMissions,
} from "@/lib/supabase/queries";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";

type AuthContextValue = {
  ready: boolean;
  user: User | null;
  userId: string | null;
  error: string | null;
  missionsLoaded: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  user: null,
  userId: null,
  error: null,
  missionsLoaded: false,
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missionsLoaded, setMissionsLoadedUi] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const bootstrapGenRef = useRef(0);
  const setActiveLocation = useAppStore((s) => s.setActiveLocation);
  const setActiveGear = useAppStore((s) => s.setActiveGear);
  const clearMissions = useMissionStore((s) => s.clearMissions);
  const setMissions = useMissionStore((s) => s.setMissions);
  const setMissionsLoaded = useMissionStore((s) => s.setMissionsLoaded);

  const bootstrapData = useCallback(
    async (session: Session | null) => {
      const gen = ++bootstrapGenRef.current;
      const uid = session?.user?.id ?? null;

      if (!uid) {
        lastUserIdRef.current = null;
        clearMissions();
        setMissionsLoaded(true);
        setMissionsLoadedUi(true);
        setUser(null);
        setReady(true);
        return;
      }

      const userChanged = lastUserIdRef.current !== uid;
      lastUserIdRef.current = uid;
      setUser(session!.user);

      try {
        const client = getSupabaseBrowserClient();
        const { locationId, gearId } =
          await ensureDefaultLocationAndGear(client);
        if (gen !== bootstrapGenRef.current) return;
        setActiveLocation(locationId);
        setActiveGear(gearId);

        if (userChanged) {
          clearMissions();
          setMissionsLoaded(false);
          setMissionsLoadedUi(false);
          const missions = await listMissions(client);
          if (gen !== bootstrapGenRef.current) return;
          setMissions(missions);
          setMissionsLoaded(true);
          setMissionsLoadedUi(true);
        }

        setError(null);
      } catch (e) {
        if (gen !== bootstrapGenRef.current) return;
        if (userChanged) {
          setMissionsLoaded(true);
          setMissionsLoadedUi(true);
        }
        setError(e instanceof Error ? e.message : "Failed to load account data");
      } finally {
        if (gen === bootstrapGenRef.current) setReady(true);
      }
    },
    [
      clearMissions,
      setMissions,
      setMissionsLoaded,
      setActiveLocation,
      setActiveGear,
    ],
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError.message);
        setReady(true);
        setMissionsLoadedUi(true);
        return;
      }
      void bootstrapData(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void bootstrapData(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [bootstrapData]);

  useEffect(() => {
    if (!ready) return;
    if (!user && !pathname.startsWith("/auth")) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/auth/sign-in?next=${next}`);
    }
  }, [ready, user, pathname, router]);

  const signOut = useCallback(async () => {
    clearMissions();
    setMissionsLoaded(true);
    setMissionsLoadedUi(true);
    lastUserIdRef.current = null;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/auth/sign-in");
    router.refresh();
  }, [router, clearMissions, setMissionsLoaded]);

  const value = useMemo(
    () => ({
      ready,
      user,
      userId: user?.id ?? null,
      error,
      missionsLoaded,
      signOut,
    }),
    [ready, user, error, missionsLoaded, signOut],
  );

  if (error && user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-medium text-red-300">Data setup failed</p>
          <p className="text-xs text-zinc-400">{error}</p>
          <button
            type="button"
            className="text-sm text-indigo-400 hover:text-indigo-300"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Redirecting to sign in…
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
