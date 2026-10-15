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

/** Mission phase tabs — Tonight zinc/indigo chrome (matches Mission Control). */
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
      <span className="rounded border border-zinc-700/60 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        Session Ended
      </span>
    );
  }

  return (
    <div
      className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-0.5"
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
          id === "capturing"
            ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
            : id === "logging"
              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
              : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20";

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
              "rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
              isActive
                ? activeClass
                : enabled
                  ? "border border-transparent text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                  : "cursor-not-allowed border border-transparent text-zinc-700",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
