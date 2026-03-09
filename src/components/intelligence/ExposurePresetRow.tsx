"use client";

import { cn } from "@/lib/utils";
import type { ExposurePlan } from "@/lib/mock/exposurePlans";

interface ExposurePresetRowProps {
  plan: ExposurePlan;
  className?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Efficient: "text-violet-400/90 bg-violet-500/10 border-violet-500/20",
  Balanced: "text-indigo-400/90 bg-indigo-500/10 border-indigo-500/20",
  "Detail Focused": "text-blue-400/90 bg-blue-500/10 border-blue-500/20",
};

export function ExposurePresetRow({ plan, className }: ExposurePresetRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs",
        className
      )}
    >
      <div>
        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
          Exposure
        </span>
        <span className="font-mono font-medium tabular-nums text-zinc-200">
          {plan.exposure}
        </span>
      </div>
      <div>
        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
          ISO / Gain
        </span>
        <span className="font-mono font-medium tabular-nums text-zinc-200">
          {plan.iso}
        </span>
      </div>
      <div>
        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
          Subs
        </span>
        <span className="font-mono font-medium tabular-nums text-zinc-200">
          {plan.subs}
        </span>
      </div>
      <div>
        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
          Integration
        </span>
        <span className="font-mono font-medium tabular-nums text-zinc-200">
          {plan.integration}
        </span>
      </div>
      {plan.filter && (
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
            Filter
          </span>
          <span className="font-medium text-zinc-300">{plan.filter}</span>
        </div>
      )}
      <div>
        <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">
          Priority
        </span>
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border",
            PRIORITY_STYLES[plan.capturePriority] ?? PRIORITY_STYLES.Balanced
          )}
        >
          {plan.capturePriority}
        </span>
      </div>
    </div>
  );
}
