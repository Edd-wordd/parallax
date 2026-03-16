"use client";

import { cn } from "@/lib/utils";
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
          {simulation.timeline && (
            (() => {
              const stop = simulation.timeline.find((evt) =>
                evt.event.toLowerCase().includes("recommended stop"),
              );
              if (!stop) return null;
              return (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    Recommended stop time
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono tabular-nums">
                    {stop.time}
                  </p>
                </div>
              );
            })()
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
        </div>
      )}
    </div>
  );
}
