"use client";

import { cn } from "@/lib/utils";

interface SessionOutcomeBadgeProps {
  score: number;
  maxScore?: number;
  className?: string;
}

export function SessionOutcomeBadge({
  score,
  maxScore = 10,
  className,
}: SessionOutcomeBadgeProps) {
  const displayScore = score.toFixed(1);
  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span className="font-display text-2xl font-semibold tabular-nums text-zinc-100">
        {displayScore}
      </span>
      <span className="text-sm text-zinc-500 font-medium">/ {maxScore}</span>
    </div>
  );
}
