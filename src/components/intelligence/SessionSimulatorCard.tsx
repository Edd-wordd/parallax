"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SessionRiskList } from "./SessionRiskList";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { computeSessionAstronomy } from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import { buildRealSessionSimulation } from "@/lib/missions/sessionSimulation";
import type { Mission } from "@/lib/types";

interface SessionSimulatorCardProps {
  mission: Mission;
  lat?: number | null;
  lon?: number | null;
  siteTimezone?: string | null;
  className?: string;
}

export function SessionSimulatorCard({
  mission,
  lat = null,
  lon = null,
  siteTimezone = null,
  className,
}: SessionSimulatorCardProps) {
  const interval = useMemo(
    () =>
      sessionIntervalFromDateTime(mission.dateTime, mission.sessionEndAt),
    [mission.dateTime, mission.sessionEndAt],
  );

  const astronomy = useMemo(() => {
    if (lat == null || lon == null) return null;
    return computeSessionAstronomy({
      site: { latDeg: lat, lonDeg: lon },
      sessionStart: interval.start,
      sessionEnd: interval.end,
      minAltitudeDeg: mission.constraints?.minAltitude ?? 30,
      moonToleranceDeg: mission.constraints?.moonTolerance ?? 15,
      targets: [],
    });
  }, [
    lat,
    lon,
    interval.start,
    interval.end,
    mission.constraints?.minAltitude,
    mission.constraints?.moonTolerance,
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

  const simulation = useMemo(
    () =>
      buildRealSessionSimulation({
        mission,
        forecast: forecastHook.forecast,
        forecastStatus: forecastHook.status,
        forecastError: forecastHook.error,
        hasSite: lat != null && lon != null,
        siteTimezone,
        moonInterference: astronomy?.moon?.interferenceLabel ?? null,
      }),
    [
      mission,
      forecastHook.forecast,
      forecastHook.status,
      forecastHook.error,
      lat,
      lon,
      siteTimezone,
      astronomy?.moon?.interferenceLabel,
    ],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">Session Simulator</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
          {simulation.sessionLabel}
        </p>
      </div>
      <div className="p-3 space-y-4">
        <p className="text-xs text-zinc-300 leading-relaxed">
          {simulation.summary}
        </p>

        {simulation.recommendedStop && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Recommended stop
            </p>
            <p className="text-xs text-zinc-400 font-mono tabular-nums">
              {simulation.recommendedStop}
              <span className="ml-1.5 text-zinc-600 normal-case tracking-normal font-sans">
                (last segment or session end)
              </span>
            </p>
          </div>
        )}

        {simulation.weatherNote && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Weather
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {simulation.weatherNote}
            </p>
          </div>
        )}

        {simulation.timeline.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Timeline
            </p>
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {simulation.timeline.map((evt, i) => (
                <li
                  key={`${evt.time}-${evt.event}-${i}`}
                  className="flex gap-2 text-[11px] tabular-nums"
                >
                  <span className="shrink-0 font-mono text-zinc-500 w-14">
                    {evt.time}
                  </span>
                  <span className="text-zinc-300 leading-snug">{evt.event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SessionRiskList risks={simulation.risks} />

        <p className="text-[10px] text-zinc-600 leading-snug">
          Sources: {simulation.sources.join(" · ")}
        </p>
      </div>
    </div>
  );
}
