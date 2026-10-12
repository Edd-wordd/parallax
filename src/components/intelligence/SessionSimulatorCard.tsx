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
        Demo session forecasts appear when a known mock target is selected.
      </p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Not connected to live weather or your Night Schedule — use Capture
        worksheet for real timing.
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="dash-section-title text-zinc-400">Session Simulator</h2>
          {!isEmpty && (
            <span className="text-[9px] uppercase tracking-wider text-amber-400/90">
              Demo
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {isEmpty
            ? "Select a target for session forecasts"
            : `Demo preview for ${targetName ?? "Target"} — not live forecast`}
        </p>
      </div>
      {isEmpty ? (
        <SessionEmptyState />
      ) : (
        <div className="p-3 space-y-4">
          <p className="text-[11px] text-amber-200/80 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
            Demo placeholder — risks and stop times are mocked. Use Night Schedule
            and Capture worksheet for real plan timing.
          </p>
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
