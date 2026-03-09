"use client";

import { cn } from "@/lib/utils";
import type { SessionConditionMetadata } from "@/lib/mock/skyIntelligence";

interface SessionConditionSummaryProps {
  metadata: SessionConditionMetadata;
  compact?: boolean;
  className?: string;
}

export function SessionConditionSummary({
  metadata,
  compact,
  className,
}: SessionConditionSummaryProps) {
  const items = [
    { label: "Forecast Confidence", value: `${metadata.forecastConfidence}%` },
    { label: "Live Confidence", value: `${metadata.liveConfidence}%` },
    { label: "Cloud interruption", value: `${metadata.cloudInterruptionMinutes} min` },
    { label: "Avg sky brightness", value: `${metadata.averageSkyBrightness} mag/arcsec²` },
    { label: "Outcome", value: metadata.outcome },
  ];

  return (
    <div
      className={cn(
        "rounded border border-zinc-800/40 bg-zinc-900/20 p-1.5",
        compact && "p-1",
        className
      )}
    >
      <div className={cn("space-y-1", compact && "space-y-0.5")}>
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex justify-between gap-2",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            <span className="text-zinc-500 truncate text-[10px]">{item.label}</span>
            <span className="text-zinc-300 font-medium truncate shrink-0 text-[10px]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
