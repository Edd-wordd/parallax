"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecommendedTarget } from "@/lib/mock/intelligenceLayer";

interface MissionPlanPanelProps {
  targets: RecommendedTarget[];
  activeTargetId: string | null;
  status: "planning" | "ready" | "capturing" | "completed";
  onRemoveTarget?: (targetId: string) => void;
  onClearPlan?: () => void;
  onStartPlannedMission?: () => void;
  className?: string;
}

export function MissionPlanPanel({
  targets,
  activeTargetId,
  status,
  onRemoveTarget,
  onClearPlan,
  onStartPlannedMission,
  className,
}: MissionPlanPanelProps) {
  if (targets.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Mission Plan
        </h3>
        <span className="text-[10px] text-zinc-500 tabular-nums">
          {targets.length} target{targets.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <ol className="space-y-1.5">
          {targets.map((t, i) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center justify-between gap-2 text-sm py-1",
                activeTargetId === t.id ? "text-zinc-100" : "text-zinc-400"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] tabular-nums text-zinc-500 w-4 shrink-0">
                  {i + 1}.
                </span>
                <span className="truncate">{t.name}</span>
                {activeTargetId === t.id && (
                  <span className="shrink-0 text-[9px] font-medium uppercase text-indigo-400">
                    Current focus
                  </span>
                )}
              </div>
              {onRemoveTarget && (
                <button
                  type="button"
                  onClick={() => onRemoveTarget(t.id)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-400"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ol>
        <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-800/60">
          {onStartPlannedMission && (
            <Button variant="cta" size="sm" className="text-xs" onClick={onStartPlannedMission}>
              Start Planned Mission
            </Button>
          )}
          {onClearPlan && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClearPlan}>
              Reset Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
