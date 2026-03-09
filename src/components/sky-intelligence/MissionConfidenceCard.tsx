"use client";

import { cn } from "@/lib/utils";

interface MissionConfidenceCardProps {
  confidence: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function MissionConfidenceCard({
  confidence,
  label = "Mission Confidence",
  size = "md",
  className,
}: MissionConfidenceCardProps) {
  const tier =
    confidence >= 80 ? "high" : confidence >= 60 ? "medium" : "low";
  const colorClass =
    tier === "high"
      ? "text-indigo-400/90"
      : tier === "medium"
        ? "text-amber-400/90"
        : "text-rose-400/90";

  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("dash-pill text-zinc-500", size === "sm" ? "text-[10px]" : "text-xs")}>
        {label}
      </span>
      <span
        className={cn(
          "dash-metric font-medium",
          size === "sm" ? "text-base" : "text-lg",
          colorClass
        )}
      >
        {confidence}%
      </span>
    </div>
  );
}
