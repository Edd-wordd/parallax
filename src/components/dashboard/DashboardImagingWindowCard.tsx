"use client";

import { useMemo } from "react";
import {
  getGeneralImagingWindow,
  getMissionCaptureWindow,
} from "@/lib/mock/dashboardData";
interface DashboardImagingWindowCardProps {
  activeLocationId: string;
  dateTime: string;
  /** When true, shows target-specific capture window. When false, shows general night window. */
  hasActiveMission?: boolean;
  /** Primary target for mission-specific window (required when hasActiveMission is true). */
  primaryTarget?: { name: string; plannedWindowStart: string; plannedWindowEnd: string };
}

/**
 * Capture Window: when to image.
 * - No mission: general usable imaging window for the night.
 * - Active mission: target-specific capture window.
 */
export function DashboardImagingWindowCard({
  activeLocationId,
  dateTime,
  hasActiveMission = false,
  primaryTarget,
}: DashboardImagingWindowCardProps) {
  const windowData = useMemo(() => {
    if (hasActiveMission && primaryTarget) {
      return getMissionCaptureWindow(
        activeLocationId,
        dateTime,
        primaryTarget.name,
        primaryTarget.plannedWindowStart,
        primaryTarget.plannedWindowEnd
      );
    }
    return getGeneralImagingWindow(activeLocationId, dateTime);
  }, [
    activeLocationId,
    dateTime,
    hasActiveMission,
    primaryTarget?.name,
    primaryTarget?.plannedWindowStart,
    primaryTarget?.plannedWindowEnd,
  ]);

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col min-h-[140px]">
      <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title">Capture Window</h2>
      </div>
      <div className="p-3 flex flex-col gap-3 min-h-0">
        <div>
          <p className="font-display text-sm font-medium text-zinc-200 tabular-nums">
            {windowData.label}
          </p>
          <p className="text-sm text-zinc-300 mt-1 tabular-nums">
            {windowData.timeRange}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{windowData.duration}</p>
          {windowData.subtitle && (
            <p className="text-xs text-zinc-500 mt-1">{windowData.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
