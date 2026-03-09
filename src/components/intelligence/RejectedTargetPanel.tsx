"use client";

import { cn } from "@/lib/utils";
import { RejectedTargetRow } from "./RejectedTargetRow";
import type { RejectedTarget } from "@/lib/mock/intelligenceLayer";

interface RejectedTargetPanelProps {
  targets: RejectedTarget[];
  onOpenRejectionDrawer?: (target: RejectedTarget) => void;
  className?: string;
}

export function RejectedTargetPanel({
  targets,
  onOpenRejectionDrawer,
  className,
}: RejectedTargetPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">Rejected Tonight</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Targets excluded by the mission engine for this session
        </p>
      </div>
      <div className="p-2.5 space-y-2 flex-1 min-h-0 overflow-auto">
        {targets.map((target) => (
          <RejectedTargetRow
            key={target.id}
            target={target}
            onOpenDecisionDrawer={() => onOpenRejectionDrawer?.(target)}
          />
        ))}
      </div>
    </div>
  );
}
