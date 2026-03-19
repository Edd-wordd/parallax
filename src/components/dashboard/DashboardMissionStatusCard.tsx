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
  LOGGING: "Logging",
  COMPLETED: "Completed",
};

interface DashboardMissionStatusCardProps {
  mission: Mission | null;
  missionStatus: DashboardMissionStatus;
  activeLocationId?: string;
  activeGearId?: string;
  canCreateMission?: boolean;
  createMissionHelperText?: string | null;
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
  canCreateMission = true,
  createMissionHelperText,
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
  const hasMissionContext =
    showActiveActions ||
    showPlanningState ||
    (missionStatus === "COMPLETED" && mission);
  const site = hasMissionContext
    ? (MOCK_LOCATIONS.find(
        (l) => l.id === (mission?.locationId ?? activeLocationId),
      ) ?? null)
    : null;
  const rig = hasMissionContext
    ? (MOCK_GEAR.find((g) => g.id === (mission?.gearId ?? activeGearId)) ??
      null)
    : null;

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
                ? "bg-zinc-700/40 text-zinc-400"
                : missionStatus === "CAPTURING" || missionStatus === "LOGGING"
                  ? "bg-indigo-500/15 text-indigo-400/90 border border-indigo-500/20"
                  : "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15",
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
                  : (mission?.name ?? "No Active Mission")}
          </p>
          <div className="text-xs text-zinc-500 mt-2 space-y-1.5">
            {showActiveActions && activeMission?.targets[0] && (
              <p>Current focus: {activeMission.targets[0].targetName}</p>
            )}
            {showActiveActions &&
              activeMission &&
              activeMission.targets.length > 0 && (
                <p>
                  {activeMission.targets.length} planned target
                  {activeMission.targets.length !== 1 ? "s" : ""}
                </p>
              )}
            {showPlanningState &&
              (plannedTargetNames[0] ?? plannedTargets[0]?.name) && (
                <p>
                  Current focus:{" "}
                  {plannedTargetNames[0] ?? plannedTargets[0]?.name}
                </p>
              )}
            {noTargetsMessage && (
              <p className="text-amber-500/90">{noTargetsMessage}</p>
            )}
            {missionInitializedFromRecommendation && (
              <p className="text-indigo-400/70 text-[11px] italic">
                Planning started from tonight&apos;s best target
              </p>
            )}
            {hasMissionContext ? (
              <div className="space-y-2 pt-1">
                <p>
                  <span className="text-zinc-500 font-medium">Site</span>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span className="text-zinc-300">{site?.name ?? "—"}</span>
                </p>
                <p>
                  <span className="text-zinc-500 font-medium">Rig</span>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span className="text-zinc-300">{rig?.name ?? "—"}</span>
                </p>
                <p>
                  <span className="text-zinc-500 font-medium">Date</span>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span className="text-zinc-300">
                    {mission ? formatDateTime(mission.dateTime) : "—"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 pt-1 space-y-2">
                <p>
                  You can view tonight&apos;s recommended targets below to build
                  your mission and get insights on visibility windows, setup
                  impact, and capture settings.
                </p>
                <p>
                  <Link
                    href="#tonight-recommendations"
                    className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2 font-medium"
                  >
                    View tonight&apos;s recommendations →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto pt-3">
          {showPlanningState ? (
            <>
              {onStartPlannedMission ? (
                <Button
                  variant="cta"
                  size="sm"
                  className="text-xs"
                  onClick={onStartPlannedMission}
                  disabled={!canCreateMission}
                >
                  Start Planned Mission
                </Button>
              ) : canCreateMission ? (
                <Link href="/missions/new">
                  <Button variant="cta" size="sm" className="text-xs">
                    Start Planned Mission
                  </Button>
                </Link>
              ) : (
                <Button variant="cta" size="sm" className="text-xs" disabled>
                  Start Planned Mission
                </Button>
              )}
              {canCreateMission ? (
                <Link href="/missions/new">
                  <Button variant="secondary" size="sm" className="text-xs">
                    Create Mission
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  disabled
                >
                  Create Mission
                </Button>
              )}
              {createMissionHelperText && (
                <p className="w-full text-xs text-amber-400/90 mt-2">
                  {createMissionHelperText.includes("gear profile") &&
                  createMissionHelperText.includes("location") ? (
                    <>
                      Set up a{" "}
                      <Link
                        href="/gear"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        gear profile
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/locations"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        location
                      </Link>{" "}
                      to create your first mission.
                    </>
                  ) : createMissionHelperText.includes("location") ? (
                    <>
                      Add a{" "}
                      <Link
                        href="/locations"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        location
                      </Link>{" "}
                      to get started.
                    </>
                  ) : createMissionHelperText.includes("gear profile") ? (
                    <>
                      Add a{" "}
                      <Link
                        href="/gear"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        gear profile
                      </Link>{" "}
                      to get started.
                    </>
                  ) : (
                    createMissionHelperText
                  )}
                </p>
              )}
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={onClearMission}
                >
                  Clear Mission
                </Button>
              )}
              {(missionStatus === "CAPTURING" ||
                missionStatus === "LOGGING") && (
                <Link href={`/missions/${activeMission!.id}/log`}>
                  <Button variant="secondary" size="sm" className="text-xs">
                    Log Results
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              {canCreateMission ? (
                <Link href="/missions/new">
                  <Button variant="cta" size="sm" className="text-xs">
                    Create Mission
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs text-zinc-500"
                  disabled
                >
                  Create Mission
                </Button>
              )}
              {createMissionHelperText && (
                <p className="w-full text-xs text-amber-400/90 mt-2">
                  {createMissionHelperText.includes("gear profile") &&
                  createMissionHelperText.includes("location") ? (
                    <>
                      Set up a{" "}
                      <Link
                        href="/gear"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        gear profile
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/locations"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        location
                      </Link>{" "}
                      to create your first mission.
                    </>
                  ) : createMissionHelperText.includes("location") ? (
                    <>
                      Add a{" "}
                      <Link
                        href="/locations"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        location
                      </Link>{" "}
                      to get started.
                    </>
                  ) : createMissionHelperText.includes("gear profile") ? (
                    <>
                      Add a{" "}
                      <Link
                        href="/gear"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-1"
                      >
                        gear profile
                      </Link>{" "}
                      to get started.
                    </>
                  ) : (
                    createMissionHelperText
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
