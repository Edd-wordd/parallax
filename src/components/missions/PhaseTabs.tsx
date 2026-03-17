"use client";

import { cn } from "@/lib/utils";
import type { ActivePhase } from "@/lib/missionUIStore";

interface PhaseTabsProps {
  activePhase: ActivePhase;
  /** When true and phase is logging, show final Session Ended badge */
  loggingLocked?: boolean;
}

/** Read-only mission phase status badge. */
export function PhaseTabs({ activePhase, loggingLocked }: PhaseTabsProps) {
  const label =
    activePhase === "logging" && loggingLocked ? "Session Ended" : (
      activePhase === "logging" ? "Logging" : (
        activePhase === "planning"
          ? "Planning"
          : activePhase === "setup"
            ? "Setup"
            : "Capturing"
      )
    );

  return (
    <span className={cn(
      "rounded-full px-2.5 py-0.5 text-xs font-medium",
      activePhase === "planning" && "bg-zinc-600 text-zinc-200",
      activePhase === "setup" && "bg-amber-500/20 text-amber-400",
      activePhase === "capturing" && "bg-violet-500/20 text-violet-400",
      activePhase === "logging" && (
        loggingLocked
          ? "bg-blue-500/20 text-blue-400"
          : "bg-sky-500/20 text-sky-300"
      ),
    )}>
      {label}
    </span>
  );
}
