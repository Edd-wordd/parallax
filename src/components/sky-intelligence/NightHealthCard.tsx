"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NightHealth } from "@/lib/mock/fieldOps";

interface NightHealthCardProps {
  health: NightHealth;
  compact?: boolean;
  className?: string;
}

const OVERALL_STYLES: Record<NightHealth["overall"], string> = {
  Strong: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  Good: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
  Moderate: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  Degraded: "text-amber-500 border-amber-500/40 bg-amber-500/10",
  Poor: "text-rose-400 border-rose-500/30 bg-rose-500/5",
};

const TREND_LABELS: Record<NightHealth["trendVsForecast"], string> = {
  better: "Better than forecast",
  stable: "Stable vs forecast",
  slightly_worse: "Slightly worse than forecast",
  worse: "Worse than forecast",
};

export function NightHealthCard({ health, compact, className }: NightHealthCardProps) {
  const chips = [
    { label: "Sky Clarity", value: health.skyClarity },
    { label: "Cloud Risk", value: health.cloudRisk },
    { label: "Tracking", value: health.trackingStability },
    { label: "Moon", value: health.moonInterference },
    { label: "Dew Risk", value: health.dewRisk },
    { label: "Confidence", value: `${health.confidence}%` },
  ];

  return (
    <Card className={cn("border-neutral-800/60 bg-black/20", className)}>
      <CardHeader className={compact ? "px-3 py-2" : ""}>
        <h2 className="text-sm font-medium uppercase tracking-wider">Night Health</h2>
      </CardHeader>
      <CardContent className={cn(compact ? "px-3 pt-0 pb-3 space-y-3" : "space-y-4")}>
        <div
          className={cn(
            "rounded-lg border px-3 py-2.5",
            OVERALL_STYLES[health.overall],
          )}
        >
          <div className="flex justify-between items-baseline gap-2">
            <span className="font-semibold">Overall: {health.overall}</span>
            <span className="text-sm opacity-90">
              Session success: {health.sessionSuccessProbability}%
            </span>
          </div>
          <p className="text-sm mt-0.5 opacity-90">{TREND_LABELS[health.trendVsForecast]}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300"
            >
              {c.label}: {c.value}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
            Recommendation
          </span>
          <p className="text-sm font-medium text-zinc-200">
            {health.recommendation}
          </p>
          {health.recheckTime && (
            <p className="text-xs text-zinc-500 mt-1">
              Recheck after {health.recheckTime}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
            Adaptive Mission Advice
          </span>
          <p className="text-xs font-medium text-zinc-200">
            Continue primary target
          </p>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            Stable vs forecast
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Conditions stable vs forecast. Planned exposures remain valid.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            <li className="flex gap-2">
              <span className="mt-[3px] text-zinc-500">•</span>
              <span>Proceed with primary target</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[3px] text-zinc-500">•</span>
              <span>Conditions support planned sub lengths</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[3px] text-zinc-500">•</span>
              <span>Recheck after 10:45 PM if cloud confidence falls</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
