"use client";

import { cn } from "@/lib/utils";
import type { ConditionMode } from "@/lib/mock/skyIntelligence";

interface ModeBadgeProps {
  mode: ConditionMode;
  className?: string;
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  const isLive = mode === "live";
  return (
    <span
      className={cn(
        "dash-pill inline-flex items-center rounded-full px-2 py-0.5",
        isLive
          ? "bg-indigo-500/10 text-indigo-400/90"
          : "bg-indigo-500/10 text-indigo-400/80",
        className
      )}
    >
      {mode === "forecast" ? "Forecast Mode" : "Live Site Mode"}
    </span>
  );
}
