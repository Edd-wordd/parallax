"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SessionOutcomeBadge } from "./SessionOutcomeBadge";
import { SessionTimeline } from "./SessionTimeline";
import { SessionRiskList } from "./SessionRiskList";
import type { SessionSimulation } from "@/lib/mock/sessionSimulations";

interface SessionSimulatorCardProps {
  targetName?: string | null;
  simulation: SessionSimulation | null;
  className?: string;
}

function SessionEmptyState() {
  return (
    <div className="p-3 space-y-2">
      <p className="text-xs text-zinc-400 leading-relaxed">
        Build a mission to preview timing, risks, and expected session quality.
      </p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        The simulator forecasts how the session is likely to unfold based on
        target timing and observing conditions.
      </p>
    </div>
  );
}

export function SessionSimulatorCard({
  targetName,
  simulation,
  className,
}: SessionSimulatorCardProps) {
  const [reasonsExpanded, setReasonsExpanded] = useState(false);
  const isEmpty = !simulation;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">Session Simulator</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {isEmpty
            ? "Select a target for session forecasts"
            : `Predicted session for ${targetName ?? "Target"}`}
        </p>
      </div>
      {isEmpty ? (
        <SessionEmptyState />
      ) : (
        <div className="p-3 space-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Expected session quality
            </p>
            <SessionOutcomeBadge score={simulation.expectedQuality} />
          </div>

          <div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {simulation.summary}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Expected outcome
            </p>
            <p className="text-xs font-medium text-zinc-300">
              {simulation.predictedOutcome}
            </p>
          </div>

          {simulation.expectedIntegration && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Expected integration
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {simulation.expectedIntegration}
              </p>
            </div>
          )}

          {simulation.altitudeRange && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Altitude progression
              </p>
              <p className="text-xs text-zinc-400 font-mono tabular-nums">
                {simulation.altitudeRange}
              </p>
            </div>
          )}

          {simulation.qualityWindow && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Session quality over time
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {simulation.qualityWindow}
              </p>
            </div>
          )}

          <SessionTimeline events={simulation.timeline} />

          {simulation.interruptionNote && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Mount / interruption
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {simulation.interruptionNote}
              </p>
            </div>
          )}

          {simulation.weatherShiftNote && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Weather shift
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {simulation.weatherShiftNote}
              </p>
            </div>
          )}

          <SessionRiskList risks={simulation.risks} />

          <div className="pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setReasonsExpanded(!reasonsExpanded)}
              className="flex items-center gap-2 text-[11px] font-medium text-indigo-400/90 hover:text-indigo-300 transition-colors"
            >
              {reasonsExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              )}
              Why this simulation looks this way
            </button>
            {reasonsExpanded && (
              <ul className="mt-2 space-y-1.5 pl-5">
                {simulation.simulationReasons.map((reason, i) => (
                  <li
                    key={i}
                    className="text-xs text-zinc-500 leading-relaxed flex gap-2"
                  >
                    <span className="text-indigo-500/50 shrink-0">·</span>
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
