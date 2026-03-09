"use client";

import { useMemo, useState } from "react";
import { MissionConfidenceCard } from "@/components/sky-intelligence/MissionConfidenceCard";
import { SkyMetricPill } from "@/components/sky-intelligence/SkyMetricPill";
import {
  getSkyIntelligenceForSiteDate,
  getLiveSkyIntelligenceForSiteDate,
  formatCoordinates,
} from "@/lib/mock/dashboardData";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import type { ConditionMode } from "@/lib/mock/skyIntelligence";
import { cn } from "@/lib/utils";

interface DashboardSkyIntelligenceCardProps {
  activeLocationId: string;
  dateTime: string;
  /** Fallback if site lookup fails */
  locationName?: string;
  /** When false, Live Site tab shows "unavailable" state. Mock UI state for dev. */
  isLiveConnected?: boolean;
}

/**
 * Observing Conditions: quantified environmental data.
 * - Forecast: predicted conditions (confidence, cloud, humidity, seeing, wind, moon).
 * - Live Site: field telemetry when connected (camera temp, guide RMS, dew heater, mount, focus).
 * - Distinct from Tonight's Sky (astronomical sky-state).
 */
export function DashboardSkyIntelligenceCard({
  activeLocationId,
  dateTime,
  locationName: fallbackName,
  isLiveConnected = false,
}: DashboardSkyIntelligenceCardProps) {
  const [mode, setMode] = useState<ConditionMode>("forecast");

  const forecastState = useMemo(
    () => getSkyIntelligenceForSiteDate(activeLocationId, dateTime),
    [activeLocationId, dateTime]
  );
  const liveState = useMemo(
    () => getLiveSkyIntelligenceForSiteDate(activeLocationId, dateTime),
    [activeLocationId, dateTime]
  );
  const state = mode === "forecast" ? forecastState : liveState;

  const loc = useMemo(
    () => MOCK_LOCATIONS.find((l) => l.id === activeLocationId),
    [activeLocationId]
  );
  const displayLocation = state.locationName ?? fallbackName ?? "—";
  const coords = useMemo(
    () => (loc ? formatCoordinates(loc.lat, loc.lon) : null),
    [loc]
  );

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col min-h-[140px]">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center justify-between gap-2 shrink-0">
        <h2 className="dash-section-title">Observing Conditions</h2>
        <div className="inline-flex rounded border border-zinc-700/60 bg-zinc-800/30 p-0.5" role="group">
          <button
            type="button"
            onClick={() => setMode("forecast")}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors",
              mode === "forecast"
                ? "bg-indigo-500/15 text-indigo-400/90"
                : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            Forecast
          </button>
          <button
            type="button"
            onClick={() => setMode("live")}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors",
              mode === "live"
                ? "bg-indigo-500/15 text-indigo-400/90"
                : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            Live Site
          </button>
        </div>
      </div>
      <div className="p-3 space-y-3 min-h-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
            <span className="text-zinc-500">Location</span>
            <span className="truncate text-zinc-400">{displayLocation}</span>
            <span className="text-zinc-500">Mode</span>
            <span className="truncate text-zinc-400">
              {mode === "forecast" ? "Forecast" : "Live Site"}
            </span>
          </div>
          {coords && (
            <p className="text-[10px] text-zinc-600 mt-0.5" aria-hidden>
              {coords}
            </p>
          )}
        </div>

        {mode === "forecast" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <MissionConfidenceCard
                confidence={forecastState.forecastConfidence}
                label="Forecast Confidence"
                size="sm"
              />
              <SkyMetricPill label="Cloud Cover" value={`${forecastState.forecast.cloudCover}%`} />
              <SkyMetricPill label="Humidity" value={`${forecastState.forecast.humidity}%`} />
              <SkyMetricPill label="Seeing" value={`${forecastState.forecast.seeing}/5`} />
              <SkyMetricPill label="Wind" value={`${forecastState.forecast.windMph} mph`} />
              <SkyMetricPill label="Moon Impact" value={forecastState.forecast.moonInterference} />
            </div>
            <p className="text-xs text-zinc-500 leading-snug line-clamp-2">{forecastState.status}</p>
          </>
        )}

        {mode === "live" && (
          <>
            {isLiveConnected && liveState.live ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <MissionConfidenceCard
                    confidence={liveState.liveConfidence ?? forecastState.forecastConfidence}
                    label="Live Confidence"
                    size="sm"
                  />
                  <SkyMetricPill
                    label="Camera Temp"
                    value={
                      liveState.live.cameraTemp != null
                        ? `${liveState.live.cameraTemp}°C`
                        : "—"
                    }
                    variant="success"
                  />
                  <SkyMetricPill
                    label="Guide RMS"
                    value={liveState.live.guideRms ?? "—"}
                    variant="success"
                  />
                  <SkyMetricPill
                    label="Dew Heater"
                    value={liveState.live.dewHeater ?? "—"}
                    variant="success"
                  />
                  <SkyMetricPill
                    label="Mount"
                    value={liveState.live.mountStatus ?? "—"}
                    variant="success"
                  />
                  <SkyMetricPill
                    label="Focus"
                    value={liveState.live.focusStatus ?? "—"}
                    variant="success"
                  />
                </div>
                <p className="text-xs text-zinc-500 leading-snug line-clamp-2">{liveState.status}</p>
              </>
            ) : (
              <div className="flex flex-col gap-1.5 py-2">
                <p className="text-sm text-zinc-500 font-medium">Live telemetry unavailable</p>
                <p className="text-xs text-zinc-600 leading-snug">
                  Connect your rig or field controller to view live site data
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
