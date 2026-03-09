"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreFactorMiniBars } from "./ScoreFactorMiniBars";
import { Button } from "@/components/ui/button";
import type { RecommendedTarget } from "@/lib/mock/intelligenceLayer";

interface RecommendedTargetCardProps {
  target: RecommendedTarget;
  selected?: boolean;
  isActive?: boolean;
  inPlan?: boolean;
  onSelect?: () => void;
  onStartMission?: () => void;
  onAddToPlan?: () => void;
  onViewSetupImpact?: () => void;
  onOpenDecisionDrawer?: () => void;
}

const BADGE_STYLES: Record<string, string> = {
  "Best Match": "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25",
  "Good Framing": "bg-violet-500/15 text-violet-300 border border-violet-500/20",
  "Narrow Window": "bg-zinc-700/60 text-zinc-400 border border-zinc-600/50",
};

export function RecommendedTargetCard({
  target,
  selected,
  isActive,
  inPlan,
  onSelect,
  onStartMission,
  onAddToPlan,
  onViewSetupImpact,
  onOpenDecisionDrawer,
}: RecommendedTargetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "rounded-lg border bg-zinc-900/60 overflow-hidden transition-colors cursor-pointer",
        selected
          ? "border-indigo-500/40 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]"
          : "border-zinc-800/60 hover:border-indigo-500/20",
        isActive && "border-indigo-500/50 ring-1 ring-indigo-500/20"
      )}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-sm font-semibold text-zinc-100 truncate">
                {target.name}
              </h3>
              {isActive && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/25">
                  Active
                </span>
              )}
              {inPlan && !isActive && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-zinc-700/60 text-zinc-400 border border-zinc-600/50">
                  In Plan
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
              {target.type}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                BADGE_STYLES[target.badge] ?? BADGE_STYLES["Narrow Window"]
              )}
            >
              {target.badge}
            </span>
            <span className="text-sm font-mono font-semibold tabular-nums text-indigo-300/90">
              {target.score}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          {target.explanation}
        </p>

        <div className="mt-2 text-[10px] text-zinc-500">
          Best window: <span className="text-zinc-400 font-medium">{target.window}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/80">
          <ScoreFactorMiniBars factors={target.factors} />
        </div>

        {/* Primary & secondary actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="cta"
            size="sm"
            className="text-[11px] px-3 py-1.5 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              onStartMission?.();
            }}
          >
            Start Mission
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-[11px] px-3 py-1.5 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlan?.();
            }}
          >
            {inPlan ? "Added" : "Add to Plan"}
          </Button>
        </div>

        {/* Tertiary text actions */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDecisionDrawer?.();
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-400/90 hover:text-indigo-300"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            Why this was chosen
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewSetupImpact?.();
            }}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-400"
          >
            View setup impact
          </button>
        </div>
      </div>
    </div>
  );
}
