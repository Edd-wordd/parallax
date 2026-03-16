"use client";

import { cn } from "@/lib/utils";

const FACTOR_LABELS: Record<string, string> = {
  altitude: "Altitude Window",
  moon: "Moon Separation",
  framing: "Rig Framing",
  sessionFit: "Session Duration Fit",
};

interface ScoreFactorMiniBarsProps {
  factors: { altitude: number; moon: number; framing: number; sessionFit: number };
  className?: string;
}

export function ScoreFactorMiniBars({ factors, className }: ScoreFactorMiniBarsProps) {
  const entries = Object.entries(factors).filter(
    ([key]) => key !== "sessionFit",
  ) as [keyof typeof factors, number][];

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-zinc-500 w-20 shrink-0 uppercase tracking-wider">
            {FACTOR_LABELS[key]}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500/60 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-zinc-400 w-6 text-right">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
