"use client";

import Link from "next/link";
import { MoonPhaseVisual } from "@/components/MoonPhaseVisual";
import { MOCK_NIGHT } from "@/lib/mock/night";
import { cn } from "@/lib/utils";

interface TonightSkyPanelProps {
  locationBortle?: number;
  compact?: boolean;
  className?: string;
}

/** Imaging condition: Good / Fair / Poor - derived from seeing, clouds, moon */
function imagingConditionBadge(bortle: number, cloudCover: number, seeing: number) {
  const score = (5 - bortle) * 0.2 + (100 - cloudCover) * 0.003 + seeing * 0.15;
  if (score >= 2.5) return { label: "Good", cls: "bg-emerald-500/10 text-emerald-400/90" };
  if (score >= 1.5) return { label: "Fair", cls: "bg-amber-500/10 text-amber-400/90" };
  return { label: "Poor", cls: "bg-zinc-700/50 text-zinc-400" };
}

export function TonightSkyPanel({
  locationBortle,
  compact,
  className,
}: TonightSkyPanelProps) {
  const night = MOCK_NIGHT;
  const bortle = locationBortle ?? night.bortle;
  const badge = imagingConditionBadge(bortle, night.cloudCover, night.seeing);

  const moonData = {
    moonPhase: night.moonPhase,
    illumination: night.illumination ?? night.moonPhasePercent / 100,
    moonset: night.moonset,
    altitude: `${night.moonAltitude}°`,
    moonAngle: night.moonAngle,
  };

  const metrics = [
    { label: "Bortle", value: `Class ${bortle}` },
    { label: "Seeing", value: `${night.seeing}/5` },
    { label: "Cloud", value: `${night.cloudCover}%` },
    { label: "Wind", value: `${night.windSpeed} mph` },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50",
        compact ? "p-2.5" : "p-3",
        className
      )}
    >
      <h2 className="dash-section-title mb-2">Tonight&apos;s Sky</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex flex-col items-center shrink-0">
          <MoonPhaseVisual data={moonData} size={compact ? "md" : "lg"} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="dash-pill text-zinc-500">Moonset</span>
              <span className="dash-metric text-zinc-400">{night.moonset}</span>
            </div>
            <div className="flex justify-between">
              <span className="dash-pill text-zinc-500">Altitude</span>
              <span className="dash-metric text-zinc-400">{night.moonAltitude}°</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="dash-pill text-zinc-500">Dark Window</span>
              <span className="dash-metric text-zinc-400">
                {night.astronomicalDarknessStart} → {night.astronomicalDarknessEnd}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {metrics.map((m) => (
              <span
                key={m.label}
                className="dash-pill px-2 py-0.5 rounded bg-zinc-800/40 text-zinc-400"
              >
                {m.label} {m.value}
              </span>
            ))}
            <span
              className={cn(
                "dash-pill px-2 py-0.5 rounded text-[9px]",
                badge.cls
              )}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex gap-3 pt-0.5">
            <Link href="/site-check" className="text-[10px] text-indigo-400/80 hover:text-indigo-400/90">
              Site Check
            </Link>
            <Link href="/skymap" className="text-[10px] text-indigo-400/80 hover:text-indigo-400/90">
              Sky Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
