"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TonightSkyCard } from "@/components/TonightSkyCard";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import { buildTonightSkyDisplay } from "@/lib/sky/tonightSkyDisplay";

const LiveSkyView = dynamic(
  () => import("./LiveSkyView").then((m) => m.LiveSkyView),
  { ssr: false },
);

type SkyView = "sky" | "live";

interface SkyTabsCardProps {
  activeLocationId: string;
  dateTime: string;
  lat?: number | null;
  lon?: number | null;
  bortle?: number | null;
  minAltitudeDeg?: number;
  moonToleranceDeg?: number;
  compact?: boolean;
}

export function SkyTabsCard({
  dateTime,
  lat,
  lon,
  bortle,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
  compact,
}: SkyTabsCardProps) {
  const [view, setView] = useState<SkyView>("sky");

  const session = useMemo(
    () => sessionIntervalFromDateTime(dateTime),
    [dateTime],
  );

  const forecastHook = useSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart: session.start,
    sessionEnd: session.end,
    includeAstroWx: true,
    enabled: lat != null && lon != null,
  });

  const display = useMemo(
    () =>
      buildTonightSkyDisplay({
        latDeg: lat,
        lonDeg: lon,
        bortle,
        dateTime,
        minAltitudeDeg,
        moonToleranceDeg,
        forecast: forecastHook.forecast,
        forecastLoading: forecastHook.status === "loading",
      }),
    [
      lat,
      lon,
      bortle,
      dateTime,
      minAltitudeDeg,
      moonToleranceDeg,
      forecastHook.forecast,
      forecastHook.status,
    ],
  );

  return (
    <div className="overflow-visible rounded-lg border border-zinc-800/60 bg-zinc-900/50">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 px-3 pb-2 pt-2.5">
        <div
          className="inline-flex rounded-lg border border-zinc-700/80 bg-zinc-800/40 p-0.5"
          role="group"
          aria-label="Sky view"
        >
          <button
            type="button"
            onClick={() => setView("sky")}
            aria-pressed={view === "sky"}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
              view === "sky"
                ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400",
            )}
          >
            Tonight&apos;s Sky
          </button>
          <button
            type="button"
            onClick={() => setView("live")}
            aria-pressed={view === "live"}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
              view === "live"
                ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400",
            )}
          >
            Live Sky View
          </button>
        </div>
      </div>
      <div className="min-h-[200px] p-3 md:min-h-[240px]">
        <div
          className={view === "sky" ? "block" : "hidden"}
          role="tabpanel"
          aria-hidden={view !== "sky"}
        >
          <TonightSkyCard display={display} compact={compact} embedded />
        </div>
        <div
          className={view === "live" ? "block" : "hidden"}
          role="tabpanel"
          aria-hidden={view !== "live"}
        >
          <LiveSkyView
            compact={compact}
            embedded
            locationBortle={bortle ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
