"use client";

import { cn } from "@/lib/utils";
import type { ActivePhase } from "@/lib/missionUIStore";

const LABELS: Record<ActivePhase, string> = {
  planning: "Planning",
  setup: "Setup",
  capturing: "Capturing",
  logging: "Logging",
};

interface PhaseTabsProps {
  activePhase: ActivePhase;
}

/** Read-only mission phase status badge. */
export function PhaseTabs({ activePhase }: PhaseTabsProps) {
  return (
    <span className={cn(
      "rounded-full px-2.5 py-0.5 text-xs font-medium",
      activePhase === "planning" && "bg-zinc-600 text-zinc-200",
      activePhase === "setup" && "bg-amber-500/20 text-amber-400",
      activePhase === "capturing" && "bg-violet-500/20 text-violet-400",
      activePhase === "logging" && "bg-blue-500/20 text-blue-400",
    )}>
      {LABELS[activePhase]}
    </span>
  );
}
