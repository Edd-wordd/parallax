"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivePhase } from "@/lib/missionUIStore";

const PHASES: ActivePhase[] = ["planning", "setup", "capturing", "logging"];
const LABELS: Record<ActivePhase, string> = {
  planning: "Planning",
  setup: "Setup",
  capturing: "Capturing",
  logging: "Logging",
};

interface PhaseTabsProps {
  activePhase: ActivePhase;
  onPhaseClick: (phase: ActivePhase, firstTargetId?: string) => void;
  firstTargetId?: string;
}

/** Compact pill segmented stepper — sizes to content, inline-flex. */
export function PhaseTabs({ activePhase, onPhaseClick, firstTargetId }: PhaseTabsProps) {
  const idx = PHASES.indexOf(activePhase);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm p-0.5"
      role="tablist"
      aria-label="Mission phases"
    >
      {PHASES.map((p, i) => {
        const isComplete = i < idx;
        const isActive = i === idx;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${p}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onPhaseClick(p, firstTargetId)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
              isActive && "bg-white/10 text-white",
              isComplete && !isActive && "text-white/60",
              !isActive && !isComplete && "text-white/50 hover:bg-white/5 hover:text-white/70"
            )}
          >
            {isComplete ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-60" />
            )}
            <span>{LABELS[p]}</span>
          </button>
        );
      })}
    </div>
  );
}
