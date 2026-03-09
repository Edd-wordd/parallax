"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TonightSkyCard } from "@/components/TonightSkyCard";
import {
  getSkyStateForSiteDate,
  getForecastForSiteDate,
} from "@/lib/mock/dashboardData";

const LiveSkyView = dynamic(
  () => import("./LiveSkyView").then((m) => m.LiveSkyView),
  { ssr: false }
);

type SkyView = "sky" | "live";

interface SkyTabsCardProps {
  /** Site ID for sky-state derivation. Refreshes on site change. */
  activeLocationId: string;
  /** ISO date string. Refreshes on date change. */
  dateTime: string;
  /** @deprecated Use activeLocationId; bortle now comes from site data */
  locationBortle?: number;
  compact?: boolean;
}

export function SkyTabsCard({
  activeLocationId,
  dateTime,
  locationBortle: _locationBortle,
  compact,
}: SkyTabsCardProps) {
  const [view, setView] = useState<SkyView>("sky");

  const skyState = useMemo(
    () => getSkyStateForSiteDate(activeLocationId, dateTime),
    [activeLocationId, dateTime]
  );
  const forecast = useMemo(
    () => getForecastForSiteDate(activeLocationId, dateTime),
    [activeLocationId, dateTime]
  );

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-visible">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 px-3 pt-2.5 pb-2">
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
                : "text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400"
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
                : "text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400"
            )}
          >
            Live Sky View
          </button>
        </div>
      </div>
      <div className="p-3 min-h-[200px] md:min-h-[240px]">
        <div
          className={view === "sky" ? "block" : "hidden"}
          role="tabpanel"
          aria-hidden={view !== "sky"}
        >
          <TonightSkyCard
            skyState={skyState}
            forecastConfidence={forecast.forecastConfidence}
            compact={compact}
            embedded
          />
        </div>
        <div
          className={view === "live" ? "block" : "hidden"}
          role="tabpanel"
          aria-hidden={view !== "live"}
        >
          <LiveSkyView compact={compact} embedded locationBortle={skyState.bortle} />
        </div>
      </div>
    </div>
  );
}
