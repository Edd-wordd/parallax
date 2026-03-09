"use client";

import { cn } from "@/lib/utils";
import type { ExposureOption } from "@/lib/mock/exposurePlans";

interface ExposureTradeoffSelectorProps {
  options: ExposureOption[];
  className?: string;
}

export function ExposureTradeoffSelector({
  options,
  className,
}: ExposureTradeoffSelectorProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
        Exposure tradeoffs
      </p>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div
            key={i}
            className={cn(
              "rounded border px-2.5 py-2 flex items-center justify-between gap-3 text-xs transition-colors",
              opt.recommended
                ? "border-indigo-500/40 bg-indigo-500/5"
                : "border-zinc-800/60 bg-zinc-900/20"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "font-medium tabular-nums shrink-0",
                  opt.recommended ? "text-indigo-300" : "text-zinc-300"
                )}
              >
                {opt.exposure}
              </span>
              <span className="text-zinc-500 truncate">{opt.note}</span>
            </div>
            {opt.recommended && (
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-indigo-400/90">
                Recommended
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
