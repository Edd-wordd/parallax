"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  type MissionPhase,
} from "@/lib/missions/phase";
import { cn } from "@/lib/utils";

interface MissionPhaseStepperProps {
  phase: MissionPhase;
  onPhaseChange?: (phase: MissionPhase) => void;
  onPhaseChipClick?: (phase: MissionPhase) => void;
  compact?: boolean;
}

export function MissionPhaseStepper({
  phase,
  onPhaseChange,
  onPhaseChipClick,
  compact = false,
}: MissionPhaseStepperProps) {
  const [showEdit, setShowEdit] = useState(false);
  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="inline-flex items-center gap-0">
      <div className="inline-flex items-center rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-1">
        {PHASE_ORDER.map((p, i) => {
          const isComplete = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={p} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => onPhaseChipClick?.(p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive && "bg-cyan-500/15 text-cyan-400",
                  isComplete && "text-emerald-500/90",
                  !isActive && !isComplete && "text-zinc-500",
                  onPhaseChipClick && "hover:bg-white/5 cursor-pointer"
                )}
              >
                {isComplete ? (
                  <Check className="h-3 w-3 shrink-0" />
                ) : (
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0 border",
                      isActive ? "border-cyan-500/60 bg-cyan-500/20" : "border-zinc-600"
                    )}
                  />
                )}
                {!compact && <span>{PHASE_LABELS[p]}</span>}
              </button>
              {i < PHASE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "w-px h-4 mx-0.5 shrink-0",
                    isComplete ? "bg-emerald-500/40" : "bg-zinc-700/80"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {onPhaseChange && (
        <div className="relative">
          <button
            onClick={() => setShowEdit(!showEdit)}
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white/70"
            title="Set Phase"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {showEdit && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEdit(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/10 bg-black/90 py-1 min-w-[120px] shadow-lg">
                {PHASE_ORDER.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onPhaseChange(p);
                      setShowEdit(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-white/5",
                      p === phase && "text-indigo-400"
                    )}
                  >
                    {PHASE_LABELS[p]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
