"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import type { Location } from "@/lib/types";
import { useDashboardRecommendations } from "@/lib/recommendations/useDashboardRecommendations";
import { curatedTargetById } from "@/lib/catalog";
import {
  computeSessionAstronomy,
  formatLocalHm,
} from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import {
  formatObservingNightLabel,
  sessionWindowFromMission,
} from "@/lib/time/sessionWindow";
import type { LiveSkyTargetInput } from "@/components/dashboard/LiveSkyView";

const LiveSkyView = dynamic(
  () =>
    import("@/components/dashboard/LiveSkyView").then((m) => m.LiveSkyView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-900/50 text-sm text-zinc-500">
        Loading sky view…
      </div>
    ),
  },
);

export default function SkymapPage() {
  const {
    activeLocationId,
    dateTime,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
  } = useAppStore();
  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const rows = await listLocations(client);
        if (cancelled) return;
        setDbLocations(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lon: r.lon,
            bortle: r.bortle,
            timezone: r.timezone ?? null,
            notes: r.notes ?? undefined,
          })),
        );
      } catch {
        // mock fallback below
      } finally {
        if (!cancelled) setLoadingLocs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLoc = useMemo(() => {
    if (isUuid(activeLocationId)) {
      const fromDb = dbLocations.find((l) => l.id === activeLocationId);
      if (fromDb) return fromDb;
    }
    return (
      MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ??
      dbLocations[0] ??
      MOCK_LOCATIONS[0]
    );
  }, [activeLocationId, dbLocations]);

  const siteIsReal =
    isUuid(activeLoc.id) &&
    activeLoc.lat != null &&
    activeLoc.lon != null &&
    dbLocations.some((l) => l.id === activeLoc.id);

  const constraints = useMemo(
    () => ({
      minAltitude,
      moonTolerance,
      targetTypes: [...targetTypes],
      driveToDarker,
      driveRadius,
    }),
    [minAltitude, moonTolerance, targetTypes, driveToDarker, driveRadius],
  );

  const recResult = useDashboardRecommendations({
    latDeg: activeLoc.lat,
    lonDeg: activeLoc.lon,
    dateTime,
    constraints,
    maxRecommendations: 12,
  });

  const session = useMemo(
    () => sessionIntervalFromDateTime(dateTime),
    [dateTime],
  );

  const moon = useMemo(() => {
    if (activeLoc.lat == null || activeLoc.lon == null) return null;
    const astro = computeSessionAstronomy({
      site: { latDeg: activeLoc.lat, lonDeg: activeLoc.lon },
      sessionStart: session.start,
      sessionEnd: session.end,
      minAltitudeDeg: minAltitude,
      moonToleranceDeg: moonTolerance,
      targets: [],
    });
    return astro.moon;
  }, [
    activeLoc.lat,
    activeLoc.lon,
    session.start,
    session.end,
    minAltitude,
    moonTolerance,
  ]);

  const nightLabel = useMemo(() => {
    const win = sessionWindowFromMission({
      dateTime,
      sessionEndAt: session.end.toISOString(),
    });
    return formatObservingNightLabel({
      start: win.start,
      end: win.end,
      siteTimezone: activeLoc.timezone ?? null,
    });
  }, [dateTime, session.end, activeLoc.timezone]);

  const skyTargets = useMemo((): LiveSkyTargetInput[] | null => {
    const fromRecs: LiveSkyTargetInput[] = [];
    for (const r of recResult.recommendations) {
      const cat = curatedTargetById(r.id);
      if (!cat) continue;
      fromRecs.push({
        id: r.id,
        name: r.name,
        raHours: cat.raHours,
        decDeg: cat.decDeg,
        type: r.type,
      });
    }
    return fromRecs.length > 0 ? fromRecs : null;
  }, [recResult.recommendations]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-heading">Sky Map</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Same site and session as Tonight. Star positions and target
            markers use Astronomy Engine alt/az. Not a camera or mount
            orientation.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            Tonight
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
        <div className="border-b border-zinc-800/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="dash-section-title">Session context</h2>
            {siteIsReal ? (
              <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-400/90">
                Calculated
              </span>
            ) : (
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
                Demo site
              </span>
            )}
          </div>
          {!siteIsReal && (
            <p className="mt-1 text-[11px] text-amber-200/80">
              Using mock site fallback — set an active location in Settings for
              real coordinates.
            </p>
          )}
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Site
            </p>
            <p className="text-zinc-200 truncate">
              {loadingLocs ? "…" : activeLoc.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Night
            </p>
            <p className="text-zinc-200 tabular-nums text-xs">{nightLabel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Session window
            </p>
            <p className="text-zinc-300 tabular-nums text-xs">
              {formatLocalHm(session.start)} – {formatLocalHm(session.end)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Moon (calculated)
            </p>
            <p className="text-zinc-200 text-xs">
              {moon
                ? `${Math.round(moon.phaseFraction * 100)}% · ${moon.phaseLabel}${
                    moon.altitudeDeg != null
                      ? ` · ~${moon.altitudeDeg.toFixed(0)}° mid-dark`
                      : ""
                  }`
                : "Select a site with coordinates"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8 space-y-2">
          <div className="flex flex-wrap items-center gap-2 px-0.5">
            <span className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-400/90">
              Calculated
            </span>
            <p className="text-[11px] text-zinc-500">
              Drag to rotate. Not a live camera or mount orientation. Scrub
              time ±6h around the session start.
            </p>
          </div>
          <LiveSkyView
            locationName={activeLoc.name}
            latDeg={activeLoc.lat}
            lonDeg={activeLoc.lon}
            locationBortle={activeLoc.bortle}
            baseDateTime={dateTime}
            skyTargets={skyTargets}
            moonPhaseFraction={moon?.phaseFraction ?? null}
          />
        </div>

        <div className="lg:col-span-4 rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
          <div className="border-b border-zinc-800/60 px-3 py-2.5">
            <h2 className="dash-section-title">
              {recResult.sectionTitle || "Visible / recommended"}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Ranked like Tonight (altitude + Moon). Markers on the globe match
              these IDs when catalog coords exist.
            </p>
          </div>
          <div className="p-2.5 max-h-[520px] overflow-y-auto">
            {recResult.status === "no_site" ||
            activeLoc.lat == null ||
            activeLoc.lon == null ? (
              <p className="px-1 py-3 text-xs text-zinc-500">
                Select a location with coordinates to compute visibility.
              </p>
            ) : recResult.recommendations.length === 0 ? (
              <p className="px-1 py-3 text-xs text-zinc-500">
                {recResult.emptyMessage ??
                  "No recommended targets for this session window."}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recResult.recommendations.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/targets/${t.id}`}
                      className="block rounded-md border border-zinc-800/50 bg-zinc-950/40 px-2.5 py-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-100 truncate">
                          {t.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-[11px] text-indigo-300/90">
                          {t.score}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                        Peak {t.peakAltitudeDeg.toFixed(0)}° · Moon sep{" "}
                        {t.minMoonSeparationDeg.toFixed(0)}° · {t.windowLabel}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {recResult.rejected.length > 0 && (
              <details className="mt-3 rounded-md border border-zinc-800/40">
                <summary className="cursor-pointer px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Not suitable ({recResult.rejected.length})
                </summary>
                <ul className="space-y-1 px-2 pb-2">
                  {recResult.rejected.slice(0, 12).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 text-[11px] text-zinc-500"
                    >
                      <span className="truncate text-zinc-400">{t.name}</span>
                      <span className="shrink-0 truncate text-zinc-600">
                        {t.reasonLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
