"use client";

/**
 * Tonight's Sky: astronomical sky-state (moon phase, bortle, seeing, dark window).
 * Distinct from Sky Intelligence (forecast/environmental). Both use same site/date context.
 */
import type { SkyState } from "@/lib/mock/dashboardData";
import { MoonPhaseVisual } from "@/components/MoonPhaseVisual";
import { cn } from "@/lib/utils";

interface TonightSkyCardProps {
  /** Sky-state data (site + date derived). */
  skyState: SkyState;
  /** Forecast confidence from Sky Intelligence, for summary tone. */
  forecastConfidence?: number;
  compact?: boolean;
  /** When true, renders without outer card styling (for embedding in tabbed layout) */
  embedded?: boolean;
}

/** Compact planner insight using real values. */
function buildTonightSummary(
  skyState: SkyState,
  forecastConfidence?: number
): string {
  const hoursMatch = skyState.astronomicalDarknessStart.match(/(\d+):(\d+)/);
  const endMatch = skyState.astronomicalDarknessEnd.match(/(\d+):(\d+)/);
  let windowHours: string | number = "—";
  if (hoursMatch && endMatch) {
    const startH = parseInt(hoursMatch[1], 10) + parseInt(hoursMatch[2], 10) / 60;
    const endH = parseInt(endMatch[1], 10) + parseInt(endMatch[2], 10) / 60;
    const span = endH > startH ? endH - startH : 24 - startH + endH;
    windowHours = span.toFixed(1);
  }

  const viable = skyState.cloudCover < 50 && skyState.seeing >= 2.5;
  const moonNote =
    skyState.moonPhasePercent < 10
      ? "no moon interference"
      : skyState.moonPhasePercent < 50
        ? "low moon interference"
        : "moderate moon interference";

  const windowStr = `${skyState.astronomicalDarknessStart} to ${skyState.astronomicalDarknessEnd}`;
  const confidenceStr =
    forecastConfidence != null
      ? `Forecast confidence ${forecastConfidence}% with best dark window from ${windowStr}.`
      : `Best dark window from ${windowStr}.`;

  if (viable) {
    return `Conditions look viable for imaging tonight with a ${windowHours}h usable window and ${moonNote}. ${confidenceStr}`;
  }
  return `Conditions challenging: cloud cover ${skyState.cloudCover}%, seeing ${skyState.seeing}/5. ${moonNote}. ${confidenceStr}`;
}

export function TonightSkyCard({
  skyState,
  forecastConfidence,
  compact,
  embedded,
}: TonightSkyCardProps) {
  const rows = [
    { label: "Moon Phase", value: `${skyState.moonPhase} (${skyState.moonPhasePercent}%)` },
    { label: "Bortle Scale", value: `Class ${skyState.bortle}` },
    { label: "Seeing", value: `${skyState.seeing}/5` },
    { label: "Cloud Cover", value: `${skyState.cloudCover}%` },
    { label: "Wind Speed", value: `${skyState.windSpeed} mph` },
    {
      label: "Dark Window",
      value: `${skyState.astronomicalDarknessStart} → ${skyState.astronomicalDarknessEnd}`,
    },
  ];

  const moonData = {
    moonPhase: skyState.moonPhase,
    illumination: skyState.illumination,
    moonset: skyState.moonset,
    altitude: `${skyState.moonAltitude}°`,
    moonAngle: skyState.moonAngle,
  };

  const summary = buildTonightSummary(skyState, forecastConfidence);

  return (
    <div
      className={cn(
        embedded ? "p-1.5" : "rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5"
      )}
    >
      {!embedded && (
        <h2 className="dash-section-title mb-2">Tonight&apos;s Sky</h2>
      )}
      {/* 3-zone layout: labels | moon visual | values */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <div className="min-w-0 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline">
              <span className="dash-pill text-zinc-500 truncate">{r.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center shrink-0 py-1">
          <MoonPhaseVisual
            data={moonData}
            size="sm"
            imageOnly
            className="opacity-90"
          />
        </div>
        <div className="min-w-0 space-y-1.5 text-right">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-end items-baseline">
              <span className="dash-metric text-xs text-zinc-400 truncate">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Compact footer insight */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
          {summary}
        </p>
      </div>
    </div>
  );
}
