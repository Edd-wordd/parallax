"use client";

import { useMemo, useState } from "react";
import { MissionConfidenceCard } from "@/components/sky-intelligence/MissionConfidenceCard";
import { SkyMetricPill } from "@/components/sky-intelligence/SkyMetricPill";
import {
  getLiveSkyIntelligenceForSiteDate,
  formatCoordinates,
} from "@/lib/mock/dashboardData";
import type { ConditionMode } from "@/lib/mock/skyIntelligence";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { computeSessionAstronomy } from "@/lib/sky/visibility";
import { cn } from "@/lib/utils";

interface DashboardSkyIntelligenceCardProps {
  /** WGS84 latitude of active site (Supabase location preferred) */
  lat?: number | null;
  lon?: number | null;
  dateTime: string;
  locationName?: string;
  activeLocationId?: string;
  /** When false, Live Site tab shows "unavailable" state. */
  isLiveConnected?: boolean;
  /** Match recommendation / Tonight's Sky altitude floor */
  minAltitudeDeg?: number;
  /** Match recommendation / Tonight's Sky Moon separation floor */
  moonToleranceDeg?: number;
}

/**
 * Observing Conditions: quantified environmental data.
 * Forecast weather from Open-Meteo / 7Timer; Moon from Astronomy Engine.
 * Live Site remains telemetry placeholder.
 */
export function DashboardSkyIntelligenceCard({
  lat,
  lon,
  dateTime,
  locationName: fallbackName,
  activeLocationId = "",
  isLiveConnected = false,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
}: DashboardSkyIntelligenceCardProps) {
  const [mode, setMode] = useState<ConditionMode>("forecast");

  const sessionInterval = useMemo(() => {
    const start = new Date(dateTime);
    if (Number.isNaN(start.getTime())) {
      const now = new Date();
      return { start: now, end: new Date(now.getTime() + 6 * 3_600_000) };
    }
    // Dashboard has no session end — use 6h window from store dateTime
    return {
      start,
      end: new Date(start.getTime() + 6 * 3_600_000),
    };
  }, [dateTime]);

  const moonInterference = useMemo(() => {
    if (lat == null || lon == null) return null;
    const astro = computeSessionAstronomy({
      site: { latDeg: lat, lonDeg: lon },
      sessionStart: sessionInterval.start,
      sessionEnd: sessionInterval.end,
      minAltitudeDeg,
      moonToleranceDeg,
      targets: [],
    });
    return astro.moon?.interferenceLabel ?? null;
  }, [
    lat,
    lon,
    sessionInterval.start,
    sessionInterval.end,
    minAltitudeDeg,
    moonToleranceDeg,
  ]);

  const forecastHook = useSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart: sessionInterval.start,
    sessionEnd: sessionInterval.end,
    includeAstroWx: true,
    moonInterference,
    enabled: lat != null && lon != null,
  });

  const liveState = useMemo(
    () => getLiveSkyIntelligenceForSiteDate(activeLocationId, dateTime),
    [activeLocationId, dateTime],
  );

  const displayLocation = fallbackName ?? "—";
  const coords =
    lat != null && lon != null ? formatCoordinates(lat, lon) : null;

  const weather = forecastHook.forecast?.weather;
  const astroWx = forecastHook.forecast?.astroWx;
  const loading = forecastHook.status === "loading";

  const pill = (
    value: string | null,
    unavailableReason?: string,
  ): string => {
    if (lat == null || lon == null) return "Select a site";
    if (loading) return "…";
    if (forecastHook.status === "error") return "Unavailable";
    if (value == null) return unavailableReason ?? "Unavailable";
    return value;
  };

  const coverage =
    weather?.coveragePct != null ? weather.coveragePct : null;
  const statusLine = (() => {
    if (lat == null || lon == null) return "Select a location to load forecast.";
    if (loading) return "Loading forecast…";
    if (forecastHook.status === "error") {
      return forecastHook.error ?? "Forecast unavailable.";
    }
    const w = forecastHook.forecast?.status.weather;
    const a = forecastHook.forecast?.status.astroWx;
    if (w === "out_of_range") {
      return "Weather forecast out of range for this date.";
    }
    if (w === "ok" && a === "ok") {
      return "Forecast supports planning for this session window.";
    }
    if (w === "ok" && a !== "ok") {
      return "Weather loaded; seeing/transparency unavailable.";
    }
    if (w !== "ok") return "Weather forecast unavailable.";
    return "Forecast ready.";
  })();

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col min-h-[140px]">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center justify-between gap-2 shrink-0">
        <h2 className="dash-section-title">Observing Conditions</h2>
        <div
          className="inline-flex rounded border border-zinc-700/60 bg-zinc-800/30 p-0.5"
          role="group"
        >
          <button
            type="button"
            onClick={() => setMode("forecast")}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors",
              mode === "forecast"
                ? "bg-indigo-500/15 text-indigo-400/90"
                : "text-zinc-500 hover:text-zinc-400",
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
                : "text-zinc-500 hover:text-zinc-400",
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
                confidence={coverage ?? 0}
                label="Forecast Coverage"
                size="sm"
              />
              <SkyMetricPill
                label="Cloud Cover"
                value={pill(
                  weather?.cloudCoverPct != null
                    ? `${weather.cloudCoverPct}%`
                    : null,
                  forecastHook.forecast?.status.weather === "out_of_range"
                    ? "Out of range"
                    : undefined,
                )}
              />
              <SkyMetricPill
                label="Humidity"
                value={pill(
                  weather?.humidityPct != null
                    ? `${weather.humidityPct}%`
                    : null,
                )}
              />
              <SkyMetricPill
                label="Seeing"
                value={pill(
                  astroWx?.seeingUi1to5 != null
                    ? `${astroWx.seeingUi1to5}/5`
                    : null,
                  forecastHook.forecast?.status.astroWx === "out_of_range"
                    ? "Out of range"
                    : undefined,
                )}
              />
              <SkyMetricPill
                label="Wind"
                value={pill(
                  weather?.windMph != null ? `${weather.windMph} mph` : null,
                )}
              />
              <SkyMetricPill
                label="Moon Impact"
                value={moonInterference ?? "—"}
              />
            </div>
            <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
              {statusLine}
            </p>
            <p className="text-[10px] text-zinc-600">
              Weather:{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-zinc-400"
              >
                Open-Meteo
              </a>
              {" · "}
              Seeing:{" "}
              <a
                href="https://www.7timer.info/doc.php"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-zinc-400"
              >
                7Timer!
              </a>
            </p>
          </>
        )}

        {mode === "live" && (
          <>
            {isLiveConnected && liveState.live ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <MissionConfidenceCard
                    confidence={liveState.liveConfidence ?? coverage ?? 0}
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
                <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
                  {liveState.status}
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-1.5 py-2">
                <p className="text-sm text-zinc-500 font-medium">
                  Live telemetry unavailable
                </p>
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
