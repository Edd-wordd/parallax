"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { assessGoNoGo, type GoNoGoVerdict } from "@/lib/forecast/goNoGo";
import { computeSessionAstronomy } from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";

export interface GoNoGoBannerProps {
  lat: number | null | undefined;
  lon: number | null | undefined;
  dateTime: string;
  sessionEndAt?: string | null;
  minAltitudeDeg?: number;
  moonToleranceDeg?: number;
  className?: string;
}

const VERDICT_STYLES: Record<
  GoNoGoVerdict,
  { border: string; bg: string; title: string; body: string }
> = {
  go: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    title: "text-emerald-300",
    body: "text-emerald-100",
  },
  marginal: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    title: "text-amber-300",
    body: "text-amber-100",
  },
  no_go: {
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    title: "text-rose-300",
    body: "text-rose-100",
  },
  unavailable: {
    border: "border-zinc-600/50",
    bg: "bg-zinc-800/40",
    title: "text-zinc-300",
    body: "text-zinc-200",
  },
};

export function GoNoGoBanner({
  lat,
  lon,
  dateTime,
  sessionEndAt = null,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
  className,
}: GoNoGoBannerProps) {
  const interval = useMemo(
    () => sessionIntervalFromDateTime(dateTime, sessionEndAt),
    [dateTime, sessionEndAt],
  );

  const astronomy = useMemo(() => {
    if (lat == null || lon == null) return null;
    return computeSessionAstronomy({
      site: { latDeg: lat, lonDeg: lon },
      sessionStart: interval.start,
      sessionEnd: interval.end,
      minAltitudeDeg,
      moonToleranceDeg,
      targets: [],
    });
  }, [
    lat,
    lon,
    interval.start,
    interval.end,
    minAltitudeDeg,
    moonToleranceDeg,
  ]);

  const forecastHook = useSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart: interval.start,
    sessionEnd: interval.end,
    includeAstroWx: true,
    moonInterference: astronomy?.moon?.interferenceLabel ?? null,
    enabled: lat != null && lon != null,
  });

  const assessment = useMemo(
    () =>
      assessGoNoGo({
        forecast: forecastHook.forecast,
        forecastStatus: forecastHook.status,
        forecastError: forecastHook.error,
        hasSite: lat != null && lon != null,
        sessionEnded: interval.end.getTime() < Date.now(),
        moonInterference: astronomy?.moon?.interferenceLabel ?? null,
      }),
    [
      forecastHook.forecast,
      forecastHook.status,
      forecastHook.error,
      lat,
      lon,
      interval.end,
      astronomy?.moon?.interferenceLabel,
    ],
  );

  const styles = VERDICT_STYLES[assessment.verdict];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm",
        styles.border,
        styles.bg,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            styles.title,
          )}
        >
          Go / No-Go
        </span>
        <span className="text-[11px] text-zinc-400">
          Forecast clouds, wind, seeing &amp; moon
        </span>
      </div>
      <p className={cn("text-sm font-medium", styles.body)}>
        {assessment.headline}
      </p>
      <p className="text-[11px] text-zinc-400 leading-snug">
        {assessment.detail}
      </p>
      {assessment.factors.length > 0 && (
        <p className="text-[10px] text-zinc-500 tabular-nums">
          {assessment.factors.join(" · ")}
        </p>
      )}
    </div>
  );
}
