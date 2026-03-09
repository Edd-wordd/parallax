"use client";

import { cn } from "@/lib/utils";
import type { ComparisonRow } from "@/lib/mock/skyIntelligence";

interface ForecastVsLiveComparisonProps {
  rows: ComparisonRow[];
  compact?: boolean;
  className?: string;
}

const DELTA_CLASSES: Record<string, string> = {
  better: "text-teal-400",
  worse: "text-rose-400",
  slightly_worse: "text-amber-400",
  same: "text-zinc-400",
  verified: "text-teal-400",
  "n/a": "text-zinc-500",
};

const DELTA_LABELS: Record<string, string> = {
  better: "Better",
  worse: "Worse",
  slightly_worse: "Slightly Worse",
  same: "Same",
  verified: "Verified",
  "n/a": "—",
};

export function ForecastVsLiveComparison({
  rows,
  compact,
  className,
}: ForecastVsLiveComparisonProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/30", className)}>
      <div className="grid grid-cols-4 gap-0 border-b border-zinc-800/60 bg-zinc-800/20">
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Metric
        </div>
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Planned
        </div>
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Live
        </div>
        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 text-right">
          Delta
        </div>
      </div>
      {rows.map((row) => (
        <div
          key={row.metric}
          className={cn(
            "grid grid-cols-4 gap-0 border-b border-zinc-800/40 last:border-0",
            compact ? "px-3 py-1.5" : "px-3 py-2"
          )}
        >
          <div className="text-xs text-zinc-300 truncate">{row.metric}</div>
          <div className="text-xs text-zinc-400 truncate">{row.planned}</div>
          <div className="text-xs text-zinc-200 truncate">{row.live}</div>
          <div
            className={cn(
              "text-xs font-medium text-right truncate",
              DELTA_CLASSES[row.delta] ?? "text-zinc-500"
            )}
          >
            {DELTA_LABELS[row.delta] ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
