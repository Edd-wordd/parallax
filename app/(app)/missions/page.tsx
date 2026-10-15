"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { Plus, Copy } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";
import { listMissions } from "@/lib/supabase/queries/missions";
import {
  getMissionStatus,
  type DashboardMissionStatus,
} from "@/lib/missionStatus";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import type { Mission } from "@/lib/types";

/** DB status chips — keep for completed/cancelled/aborted */
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  aborted: "Aborted",
};

/** Field-loop phase labels aligned with Mission Control */
const PHASE_LABELS: Partial<Record<DashboardMissionStatus, string>> = {
  PLANNING: "Planning",
  SETUP: "Ready",
  CAPTURING: "Capturing",
  LOGGING: "Logging",
  COMPLETED: "Completed",
  ABORTED: "Aborted",
  CANCELLED: "Cancelled",
};

function phaseChipClass(status: DashboardMissionStatus): string {
  switch (status) {
    case "CAPTURING":
      return "bg-rose-500/15 text-rose-300/90 border border-rose-500/25";
    case "LOGGING":
      return "bg-indigo-500/15 text-indigo-400/90 border border-indigo-500/20";
    case "SETUP":
    case "PLANNING":
      return "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15";
    case "COMPLETED":
      return "bg-zinc-700/40 text-zinc-400";
    case "ABORTED":
      return "bg-rose-500/10 text-rose-400/90 border border-rose-500/15";
    case "CANCELLED":
      return "bg-amber-500/10 text-amber-400/90 border border-amber-500/15";
    default:
      return "bg-zinc-800/50 text-zinc-400";
  }
}

function primaryCta(mission: Mission, dashStatus: DashboardMissionStatus): {
  label: string;
  href: string;
} {
  switch (dashStatus) {
    case "CAPTURING":
      return { label: "Resume Live", href: `/missions/${mission.id}` };
    case "LOGGING":
      return {
        label: "Resume Logging",
        href: `/missions/${mission.id}?phase=logging`,
      };
    case "SETUP":
      return { label: "Continue Setup", href: `/missions/${mission.id}` };
    case "PLANNING":
      return { label: "Open Mission", href: `/missions/${mission.id}` };
    case "COMPLETED":
      return { label: "View Mission", href: `/missions/${mission.id}` };
    default:
      return { label: "Open", href: `/missions/${mission.id}` };
  }
}

function sortMissions(a: Mission, b: Mission): number {
  const rank = (m: Mission) => {
    const s = getMissionStatus(m);
    if (s === "CAPTURING" || s === "LOGGING") return 0;
    if (s === "SETUP" || s === "PLANNING") return 1;
    if (s === "COMPLETED") return 2;
    return 3;
  };
  const d = rank(a) - rank(b);
  if (d !== 0) return d;
  const tb = b.dateTime ? new Date(b.dateTime).getTime() : 0;
  const ta = a.dateTime ? new Date(a.dateTime).getTime() : 0;
  const nb = Number.isFinite(tb) ? tb : 0;
  const na = Number.isFinite(ta) ? ta : 0;
  return nb - na;
}

export default function MissionsPage() {
  const router = useRouter();
  const { missionsLoaded: authMissionsLoaded } = useAuth();
  const missions = useMissionStore((s) => s.missions);
  const storeMissionsLoaded = useMissionStore((s) => s.missionsLoaded);
  const duplicateMission = useMissionStore((s) => s.duplicateMission);
  const setMissions = useMissionStore((s) => s.setMissions);
  const missionsLoaded = authMissionsLoaded || storeMissionsLoaded;
  const [locationNames, setLocationNames] = useState<
    Record<string, { name: string; bortle: number }>
  >({});
  const [gearNames, setGearNames] = useState<Record<string, string>>({});
  const [listError, setListError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      try {
        const client = getSupabaseBrowserClient();
        const [locs, gear] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        setLocationNames(
          Object.fromEntries(
            locs.map((l) => [l.id, { name: l.name, bortle: l.bortle }]),
          ),
        );
        setGearNames(Object.fromEntries(gear.map((g) => [g.id, g.name])));
      } catch {
        /* display-only */
      }
    }
    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Refresh list from DB when page mounts (after auth hydrate). */
  useEffect(() => {
    if (!missionsLoaded) return;
    let cancelled = false;
    async function refresh() {
      setRefreshing(true);
      setListError(null);
      try {
        const rows = await listMissions(getSupabaseBrowserClient());
        if (cancelled) return;
        // Keep any local planning-only missions not yet in DB.
        const dbIds = new Set(rows.map((m) => m.id));
        const planningOnly = useMissionStore
          .getState()
          .missions.filter(
            (m) =>
              !dbIds.has(m.id) &&
              (m.phase === "planning" ||
                (!m.phase && m.status === "ready") ||
                m.status === "draft"),
          );
        setMissions([...planningOnly, ...rows]);
      } catch (e) {
        if (!cancelled) {
          setListError(
            e instanceof Error ? e.message : "Failed to load missions",
          );
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [missionsLoaded, setMissions]);

  const ordered = useMemo(
    () => [...missions].sort(sortMissions),
    [missions],
  );

  // Don't blank the list while refreshing if Auth already hydrated missions.
  const showLoading =
    (!missionsLoaded && missions.length === 0) ||
    (refreshing && missions.length === 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-heading">Missions</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Your saved and in-progress missions from Supabase. Active field
            nights sort first.
          </p>
        </div>
        <Link href="/missions/new">
          <Button variant="cta" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Mission
          </Button>
        </Link>
      </div>

      {listError && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {listError}
        </p>
      )}

      {showLoading ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
          Loading missions…
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">No missions yet.</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Plan from Tonight or create a mission to enter Setup → Capture →
            Log.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Tonight
              </Button>
            </Link>
            <Link href="/missions/new">
              <Button variant="cta" size="sm">
                Create Mission
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m) => {
            const loc = locationNames[m.locationId];
            const gearName = gearNames[m.gearId];
            const dashStatus = getMissionStatus(m);
            const isLive = dashStatus === "CAPTURING";
            const chipLabel =
              PHASE_LABELS[dashStatus] ??
              STATUS_LABELS[m.status] ??
              m.status;
            const cta = primaryCta(m, dashStatus);
            const planningOnly =
              (m.phase === "planning" || m.status === "draft") &&
              !isUuid(m.id);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group h-full"
              >
                <div
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-lg border bg-zinc-900/50",
                    isLive
                      ? "border-rose-500/40 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]"
                      : "border-zinc-800/60 hover:border-zinc-700/80",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 px-3 py-2">
                    <h2 className="dash-section-title truncate text-zinc-400">
                      Mission
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
                          </span>
                          Live
                        </span>
                      )}
                      {planningOnly && (
                        <span className="rounded border border-zinc-600/50 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-500">
                          Local plan
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          phaseChipClass(dashStatus),
                        )}
                      >
                        {chipLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <Link href={cta.href} className="min-w-0 block">
                      <p className="font-display text-sm font-medium text-zinc-100 truncate hover:text-white">
                        {m.name}
                      </p>
                    </Link>
                    <div className="space-y-1 text-xs text-zinc-500">
                      <p>
                        <span className="text-zinc-500 font-medium">Site</span>
                        <span className="text-zinc-600 mx-1.5">·</span>
                        <span className="text-zinc-300">
                          {loc
                            ? `${loc.name} · Bortle ${loc.bortle}`
                            : "—"}
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500 font-medium">Rig</span>
                        <span className="text-zinc-600 mx-1.5">·</span>
                        <span className="text-zinc-300">{gearName ?? "—"}</span>
                      </p>
                      <p className="tabular-nums">
                        {m.dateTime ? formatDate(m.dateTime) : "—"} ·{" "}
                        {(m.targets ?? []).length} target
                        {(m.targets ?? []).length !== 1 ? "s" : ""}
                        {m.missionType === "deep_sky" ? " · Deep sky" : ""}
                        {m.missionType === "planetary" ? " · Planetary" : ""}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Link href={cta.href}>
                        <Button
                          variant="cta"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          {cta.label}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-zinc-500 hover:text-zinc-300"
                        onClick={(e) => {
                          e.preventDefault();
                          const dup = duplicateMission(m.id);
                          if (dup) router.push(`/missions/${dup.id}`);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
