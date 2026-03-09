"use client";

import { cn } from "@/lib/utils";
import type { MissionFit } from "@/lib/mock/exposurePlans";

interface MissionFitSummaryProps {
  missionFit: MissionFit;
  className?: string;
}

const WINDOW_FIT_STYLES: Record<string, string> = {
  Yes: "text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20",
  Tight: "text-amber-400/90 bg-amber-500/10 border-amber-500/20",
  No: "text-zinc-500 bg-zinc-700/50 border-zinc-600/40",
};

export function MissionFitSummary({
  missionFit,
  className,
}: MissionFitSummaryProps) {
  return (
    <div
      className={cn(
        "rounded border border-zinc-800/60 bg-zinc-900/30 p-2.5 space-y-2",
        className
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Mission fit
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-zinc-500">Setup</span>
        <span className="text-zinc-300 font-medium tabular-nums">
          {missionFit.setupTime}
        </span>
        <span className="text-zinc-500">Capture</span>
        <span className="text-zinc-300 font-medium tabular-nums">
          {missionFit.captureTime}
        </span>
        <span className="text-zinc-500">Wrap</span>
        <span className="text-zinc-300 font-medium tabular-nums">
          {missionFit.wrapTime}
        </span>
        <span className="text-zinc-500">Window fit</span>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border w-fit",
            WINDOW_FIT_STYLES[missionFit.windowFit] ?? WINDOW_FIT_STYLES.No
          )}
        >
          {missionFit.windowFit}
        </span>
        {missionFit.expectedUsableIntegration && (
          <>
            <span className="text-zinc-500">Expected usable integration</span>
            <span className="text-zinc-300 font-medium tabular-nums">
              {missionFit.expectedUsableIntegration}
            </span>
          </>
        )}
        {missionFit.bufferRemaining && (
          <>
            <span className="text-zinc-500">Buffer remaining</span>
            <span className="text-zinc-300 font-medium tabular-nums">
              {missionFit.bufferRemaining}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
