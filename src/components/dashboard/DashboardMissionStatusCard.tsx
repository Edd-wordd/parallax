"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDateTime } from "@/lib/utils";
import type { Mission } from "@/lib/types";
import type { DashboardMissionStatus } from "@/lib/missionStatus";

/** User-facing labels for mission status badge. */
const STATUS_LABELS: Record<DashboardMissionStatus, string> = {
  NONE: "No Active Mission",
  PLANNING: "Planning",
  SETUP: "Ready",
  CAPTURING: "Capturing",
  LOGGING: "Capturing",
  COMPLETED: "Completed",
};

interface DashboardMissionStatusCardProps {
  mission: Mission | null;
  missionStatus: DashboardMissionStatus;
  activeLocationId?: string;
  activeGearId?: string;
  onQuickMission: () => void;
  /** Called when user clicks Clear Mission in planning state. */
  onClearMission?: () => void;
  activeMission?: Mission | null;
  /** Targets in plan (Add to Plan / Build Optimal) when no mission started yet. */
  plannedTargets?: { id: string; name: string }[];
  plannedTargetNames?: string[];
  /** Called when user clicks Start Planned Mission in planning state. */
  onStartPlannedMission?: () => void;
  /** Shown when mission has no targets (e.g. no recommendations available). */
  noTargetsMessage?: string;
  /** When true, show subtle "Planning started from tonight's best target" hint. */
  missionInitializedFromRecommendation?: boolean;
}

export function DashboardMissionStatusCard({
  mission,
  missionStatus,
  activeLocationId,
  activeGearId,
  onQuickMission,
  onClearMission,
  activeMission,
  plannedTargets = [],
  plannedTargetNames = [],
  onStartPlannedMission,
  noTargetsMessage,
  missionInitializedFromRecommendation,
}: DashboardMissionStatusCardProps) {
  const isActive =
    missionStatus === "PLANNING" ||
    missionStatus === "SETUP" ||
    missionStatus === "CAPTURING" ||
    missionStatus === "LOGGING";
  const hasPlan = plannedTargets.length > 0 || plannedTargetNames.length > 0;
  const planCount = plannedTargets.length || plannedTargetNames.length;
  const showPlanningState = !isActive && hasPlan && !activeMission;
  const showActiveActions = isActive && activeMission;
  const site =
    MOCK_LOCATIONS.find((l) => l.id === (mission?.locationId ?? activeLocationId)) ?? MOCK_LOCATIONS[0];
  const rig =
    MOCK_GEAR.find((g) => g.id === (mission?.gearId ?? activeGearId)) ?? MOCK_GEAR[0];

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col min-h-[140px]">
      <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0 flex items-center justify-between gap-2">
        <h2 className="dash-section-title">Mission Control</h2>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
            showPlanningState
              ? "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15"
              : missionStatus === "NONE" || missionStatus === "COMPLETED"
                ? "bg-zinc-800/50 text-zinc-500"
                : missionStatus === "CAPTURING" || missionStatus === "LOGGING"
                  ? "bg-indigo-500/15 text-indigo-400/90 border border-indigo-500/20"
                  : "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15"
          )}
        >
          {showPlanningState ? "Planning" : STATUS_LABELS[missionStatus]}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-3 min-h-0">
        <div>
          <p className="font-display text-sm font-medium text-zinc-200 truncate">
            {showActiveActions && activeMission?.targets[0]
              ? `${activeMission.name} · ${activeMission.targets[0].targetName}`
              : showActiveActions && activeMission
                ? activeMission.name
                : showPlanningState
                  ? `Tonight's Mission · ${planCount} planned target${planCount !== 1 ? "s" : ""}`
                  : mission?.name ?? "No Active Mission"}
          </p>
          <div className="text-xs text-zinc-500 mt-0.5 space-y-0.5">
            {showActiveActions && activeMission?.targets[0] && (
              <p>Current focus: {activeMission.targets[0].targetName}</p>
            )}
            {showActiveActions && activeMission && activeMission.targets.length > 0 && (
              <p>{activeMission.targets.length} planned target{activeMission.targets.length !== 1 ? "s" : ""}</p>
            )}
            {showPlanningState && (plannedTargetNames[0] ?? plannedTargets[0]?.name) && (
              <p>Current focus: {plannedTargetNames[0] ?? plannedTargets[0]?.name}</p>
            )}
            {noTargetsMessage && (
              <p className="text-amber-500/90">{noTargetsMessage}</p>
            )}
            {missionInitializedFromRecommendation && (
              <p className="text-indigo-400/70 text-[11px] italic">
                Planning started from tonight&apos;s best target
              </p>
            )}
            <p>{site?.name ?? "—"}</p>
            <p>
              {rig?.name ?? "—"}
              {mission && ` · ${formatDateTime(mission.dateTime)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          {showPlanningState ? (
            <>
              {onStartPlannedMission ? (
                <Button variant="cta" size="sm" className="text-xs" onClick={onStartPlannedMission}>
                  Start Planned Mission
                </Button>
              ) : (
                <Link href="/missions/new">
                  <Button variant="cta" size="sm" className="text-xs">
                    Start Planned Mission
                  </Button>
                </Link>
              )}
              <Link href="/missions/new">
                <Button variant="secondary" size="sm" className="text-xs">
                  Create Mission
                </Button>
              </Link>
            </>
          ) : showActiveActions ? (
            <>
              <Link href={`/missions/${activeMission!.id}`}>
                <Button variant="cta" size="sm" className="text-xs">
                  {missionStatus === "CAPTURING" || missionStatus === "LOGGING"
                    ? "Resume Mission"
                    : "View Plan"}
                </Button>
              </Link>
              {missionStatus === "PLANNING" && onClearMission && (
                <Button variant="secondary" size="sm" className="text-xs" onClick={onClearMission}>
                  Clear Mission
                </Button>
              )}
              {(missionStatus === "CAPTURING" || missionStatus === "LOGGING") && (
                <Link href={`/missions/${activeMission!.id}/log`}>
                  <Button variant="secondary" size="sm" className="text-xs">
                    Log Results
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/missions/new">
                <Button variant="cta" size="sm" className="text-xs">
                  Create Mission
                </Button>
              </Link>
              <Button variant="secondary" size="sm" className="text-xs" onClick={onQuickMission}>
                Quick Mission
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
