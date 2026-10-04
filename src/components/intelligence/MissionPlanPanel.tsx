"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlanPanelTarget = { id: string; name: string };

interface MissionPlanPanelProps {
  targets: PlanPanelTarget[];
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
  onRemoveTarget,
  onClearPlan,
  onStartPlannedMission,
  className,
}: MissionPlanPanelProps) {
  if (targets.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/50",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Mission Plan
        </h3>
        <span className="text-[10px] tabular-nums text-zinc-500">
          {targets.length} target{targets.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <ol className="space-y-1.5">
          {targets.map((t, i) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center justify-between gap-2 py-1 text-sm",
                activeTargetId === t.id ? "text-zinc-100" : "text-zinc-400",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-[10px] tabular-nums text-zinc-500">
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
        <div className="flex flex-wrap gap-2 border-t border-zinc-800/60 pt-2">
          {onStartPlannedMission && (
            <Button
              variant="cta"
              size="sm"
              className="text-xs"
              onClick={onStartPlannedMission}
            >
              Create Mission Plan
            </Button>
          )}
          {onClearPlan && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500"
              onClick={onClearPlan}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
