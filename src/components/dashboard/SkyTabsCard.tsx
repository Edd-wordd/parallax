"use client";

import React, { useMemo } from "react";
import { TonightSkyCard } from "@/components/TonightSkyCard";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import { buildTonightSkyDisplay } from "@/lib/sky/tonightSkyDisplay";

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

/**
 * Tonight's Sky planning visual (no Live tab — Live lives under Observing Conditions).
 */
export function SkyTabsCard({
  dateTime,
  lat,
  lon,
  bortle,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
  compact,
}: SkyTabsCardProps) {
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
        <h2 className="dash-section-title">Tonight&apos;s Sky</h2>
      </div>
      <div className="min-h-[200px] p-3 md:min-h-[240px]">
        <TonightSkyCard display={display} compact={compact} embedded />
      </div>
    </div>
  );
}
