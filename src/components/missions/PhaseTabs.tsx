"use client";

import { cn } from "@/lib/utils";
import type { ActivePhase } from "@/lib/missionUIStore";

const PHASES: { id: ActivePhase; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "setup", label: "Setup" },
  { id: "capturing", label: "Capturing" },
  { id: "logging", label: "Logging" },
];

interface PhaseTabsProps {
  activePhase: ActivePhase;
  /** When true and phase is logging, show final Session Ended badge */
  loggingLocked?: boolean;
  /** Disable all navigation (completed / cancelled / log locked) */
  navigationLocked?: boolean;
  /** Capturing tab enabled once mission has been started */
  canOpenCapturing?: boolean;
  /** Logging tab enabled once session has entered logging */
  canOpenLogging?: boolean;
  onPhaseSelect?: (phase: ActivePhase) => void;
}

/** Mission phase tabs — clickable to revisit Planning / Setup / Capturing when unlocked. */
export function PhaseTabs({
  activePhase,
  loggingLocked,
  navigationLocked = false,
  canOpenCapturing = false,
  canOpenLogging = false,
  onPhaseSelect,
}: PhaseTabsProps) {
  if (loggingLocked && activePhase === "logging") {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400">
        Session Ended
      </span>
    );
  }

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/30 p-0.5"
      role="tablist"
      aria-label="Mission phase"
    >
      {PHASES.map(({ id, label }) => {
        const isActive = activePhase === id;
        let enabled = !navigationLocked && !!onPhaseSelect;
        if (enabled) {
          if (id === "capturing") enabled = canOpenCapturing || isActive;
          if (id === "logging") enabled = canOpenLogging || isActive;
        }

        const activeClass =
          id === "planning"
            ? "bg-zinc-600 text-zinc-100"
            : id === "setup"
              ? "bg-amber-500/25 text-amber-300"
              : id === "capturing"
                ? "bg-violet-500/25 text-violet-300"
                : "bg-sky-500/25 text-sky-300";

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={!enabled || isActive}
            title={
              !enabled && id === "capturing"
                ? "Start the mission from Setup to open Capturing"
                : !enabled && id === "logging"
                  ? "End the session to open Logging"
                  : navigationLocked
                    ? "Phase locked for this session"
                    : `Go to ${label}`
            }
            onClick={() => {
              if (!enabled || isActive || !onPhaseSelect) return;
              onPhaseSelect(id);
            }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              isActive
                ? activeClass
                : enabled
                  ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  : "cursor-not-allowed text-zinc-600",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
