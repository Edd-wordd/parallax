"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  ABORTED: "Aborted",
  CANCELLED: "Cancelled",
};

export type MissionPlanTarget = {
  id: string;
  name: string;
  desiredMinutes?: number;
};

interface DashboardMissionStatusCardProps {
  mission: Mission | null;
  missionStatus: DashboardMissionStatus;
  /** Resolved display names from DB / context (not mock catalogs). */
  siteName?: string | null;
  rigName?: string | null;
  /** Fallback date when no mission yet (store dateTime). */
  contextDateTime?: string | null;
  /** Observing-night label (Tonight · …) for the mission session window */
  observingNightLabel?: string | null;
  canCreateMission?: boolean;
  createMissionHelperText?: string | null;
  /** Called when user clicks Clear Mission in planning state. */
  onClearMission?: () => void;
  activeMission?: Mission | null;
  /** Targets in plan (Add to Plan / Build Optimal) when no mission started yet. */
  plannedTargets?: MissionPlanTarget[];
  plannedTargetNames?: string[];
  /** Called when user clicks Start Planned Mission in planning state. */
  onStartPlannedMission?: () => void;
  onProposeSchedule?: () => void;
  onRemoveFromPlan?: (targetId: string) => void;
  onClearPlan?: () => void;
  /** When true, show Propose even with an empty plan */
  canProposeSchedule?: boolean;
  /** Shown when mission has no targets (e.g. no recommendations available). */
  noTargetsMessage?: string;
  /** When true, show subtle "Planning started from tonight's best target" hint. */
  missionInitializedFromRecommendation?: boolean;
  /** Full-width Tonight hero when a mission is in the field loop */
  variant?: "default" | "hero";
  className?: string;
}

function focusTargetName(mission: Mission | null | undefined): string | null {
  if (!mission?.targets.length) return null;
  const id = mission.currentTargetId;
  if (id) {
    const hit = mission.targets.find((t) => t.targetId === id);
    if (hit) return hit.targetName;
  }
  return mission.targets[0]?.targetName ?? null;
}

function CreateMissionHelper({ text }: { text: string }) {
  if (text.includes("gear profile") && text.includes("location")) {
    return (
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
    );
  }
  if (text.includes("location")) {
    return (
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
    );
  }
  if (text.includes("gear profile")) {
    return (
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
    );
  }
  return <>{text}</>;
}

export function DashboardMissionStatusCard({
  mission,
  missionStatus,
  siteName = null,
  rigName = null,
  contextDateTime = null,
  observingNightLabel = null,
  canCreateMission = true,
  createMissionHelperText,
  onClearMission,
  activeMission,
  plannedTargets = [],
  plannedTargetNames = [],
  onStartPlannedMission,
  onProposeSchedule,
  onRemoveFromPlan,
  onClearPlan,
  canProposeSchedule = false,
  noTargetsMessage,
  missionInitializedFromRecommendation,
  variant = "default",
  className,
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
  const dateIso = mission?.dateTime ?? contextDateTime;
  const focus =
    focusTargetName(activeMission) ??
    focusTargetName(mission) ??
    plannedTargetNames[0] ??
    plannedTargets[0]?.name ??
    null;
  const isHero = variant === "hero" && showActiveActions;
  const isLive = missionStatus === "CAPTURING";
  const isInProgress =
    (missionStatus === "SETUP" || missionStatus === "PLANNING") &&
    mission?.status === "in_progress";

  const showEmbeddedPlan =
    !isHero &&
    !showActiveActions &&
    (hasPlan || canProposeSchedule);

  const planNames: MissionPlanTarget[] =
    plannedTargets.length > 0
      ? plannedTargets
      : plannedTargetNames.map((name, i) => ({
          id: `name-${i}`,
          name,
        }));

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden flex flex-col h-full",
        isHero
          ? cn(
              "min-h-[180px] bg-zinc-900/70",
              isLive
                ? "border-rose-500/40 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]"
                : "border-indigo-500/30 bg-zinc-900/60",
            )
          : "border-zinc-800/60 bg-zinc-900/50 min-h-[140px]",
        className,
      )}
    >
      <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0 flex items-center justify-between gap-2">
        <h2 className="dash-section-title">Mission Control</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLive && (
            <span
              className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-300"
              title="Mission is live"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
              </span>
              Live
            </span>
          )}
          {isInProgress && (
            <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-300">
              In progress
            </span>
          )}
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
              showPlanningState || showEmbeddedPlan
                ? "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15"
                : missionStatus === "NONE" || missionStatus === "COMPLETED"
                  ? "bg-zinc-700/40 text-zinc-400"
                  : missionStatus === "CAPTURING"
                    ? "bg-rose-500/15 text-rose-300/90 border border-rose-500/25"
                    : missionStatus === "LOGGING"
                      ? "bg-indigo-500/15 text-indigo-400/90 border border-indigo-500/20"
                      : "bg-indigo-500/10 text-indigo-400/80 border border-indigo-500/15",
            )}
          >
            {showPlanningState || (showEmbeddedPlan && hasPlan)
              ? "Planning"
              : STATUS_LABELS[missionStatus]}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "p-3 flex flex-col gap-2 min-h-0 flex-1",
          isHero && "sm:flex-row sm:items-stretch sm:gap-6 sm:p-4",
        )}
      >
        <div className={cn("min-w-0", isHero && "sm:flex-1")}>
          <p
            className={cn(
              "font-display font-medium text-zinc-200 truncate",
              isHero ? "text-lg sm:text-xl" : "text-sm",
            )}
          >
            {showActiveActions && activeMission
              ? activeMission.name
              : showPlanningState
                ? `Tonight's Mission · ${planCount} planned target${planCount !== 1 ? "s" : ""}`
                : (mission?.name ?? "No Active Mission")}
          </p>

          {isHero && observingNightLabel && (
            <p className="mt-1 text-sm text-zinc-300 tabular-nums">
              {observingNightLabel}
            </p>
          )}

          <div className="text-xs text-zinc-500 mt-1.5 space-y-1">
            {showActiveActions && focus && (
              <p>
                <span className="text-zinc-500 font-medium">Current focus</span>
                <span className="text-zinc-600 mx-1.5">·</span>
                <span className="text-zinc-200">{focus}</span>
              </p>
            )}
            {showActiveActions &&
              activeMission &&
              activeMission.targets.length > 0 && (
                <p>
                  {activeMission.targets.length} planned target
                  {activeMission.targets.length !== 1 ? "s" : ""}
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
              <div
                className={cn(
                  "space-y-1 pt-0.5",
                  isHero &&
                    "sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:space-y-0",
                )}
              >
                {!isHero && observingNightLabel && (
                  <p>
                    <span className="text-zinc-500 font-medium">Night</span>
                    <span className="text-zinc-600 mx-1.5">·</span>
                    <span className="text-zinc-300">{observingNightLabel}</span>
                  </p>
                )}
                <p>
                  <span className="text-zinc-500 font-medium">Site</span>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span className="text-zinc-300">{siteName ?? "—"}</span>
                </p>
                <p>
                  <span className="text-zinc-500 font-medium">Rig</span>
                  <span className="text-zinc-600 mx-1.5">·</span>
                  <span className="text-zinc-300">{rigName ?? "—"}</span>
                </p>
                {!observingNightLabel && (
                  <p>
                    <span className="text-zinc-500 font-medium">Date</span>
                    <span className="text-zinc-600 mx-1.5">·</span>
                    <span className="text-zinc-300">
                      {dateIso ? formatDateTime(dateIso) : "—"}
                    </span>
                  </p>
                )}
              </div>
            ) : !showEmbeddedPlan ? (
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
            ) : null}
          </div>
        </div>

        {showEmbeddedPlan && (
          <div className="min-h-0 flex-1 flex flex-col rounded border border-zinc-800/50 bg-zinc-950/40 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Mission plan
              </p>
              <span className="text-[10px] tabular-nums text-zinc-600">
                {hasPlan
                  ? `${planCount} target${planCount !== 1 ? "s" : ""}`
                  : "Empty"}
              </span>
            </div>
            {hasPlan ? (
              <ol className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto max-h-[88px]">
                {planNames.map((t, i) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-[11px] text-zinc-300"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-zinc-600 tabular-nums mr-1.5">
                        {i + 1}.
                      </span>
                      {t.name}
                      {typeof t.desiredMinutes === "number" ? (
                        <span className="ml-1 text-zinc-600 tabular-nums">
                          {t.desiredMinutes}m
                        </span>
                      ) : null}
                    </span>
                    {onRemoveFromPlan && plannedTargets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onRemoveFromPlan(t.id)}
                        className="shrink-0 text-[10px] text-zinc-600 hover:text-zinc-400"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1.5 text-[11px] leading-snug text-zinc-600 flex-1">
                Add targets below, or propose a schedule.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5 shrink-0 border-t border-zinc-800/50 pt-2">
              {onProposeSchedule && canProposeSchedule && (
                <Button
                  variant={hasPlan ? "secondary" : "cta"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onProposeSchedule}
                >
                  Propose schedule
                </Button>
              )}
              {hasPlan && onStartPlannedMission && (
                <Button
                  variant="cta"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onStartPlannedMission}
                  disabled={!canCreateMission}
                >
                  Review schedule
                </Button>
              )}
              {hasPlan && onClearPlan && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-500"
                  onClick={onClearPlan}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex flex-wrap gap-2 mt-auto pt-1",
            isHero &&
              "sm:mt-0 sm:pt-0 sm:flex-col sm:justify-center sm:items-stretch sm:min-w-[11rem]",
            showEmbeddedPlan && "pt-2",
          )}
        >
          {showEmbeddedPlan ? (
            <>
              {canCreateMission ? (
                <Link href="/missions/new">
                  <Button variant="secondary" size="sm" className="text-xs h-7">
                    Create Mission
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7"
                  disabled
                >
                  Create Mission
                </Button>
              )}
              {createMissionHelperText && (
                <p className="w-full text-xs text-amber-400/90">
                  <CreateMissionHelper text={createMissionHelperText} />
                </p>
              )}
            </>
          ) : showPlanningState ? (
            <>
              {onStartPlannedMission ? (
                <Button
                  variant="cta"
                  size="sm"
                  className="text-xs"
                  onClick={onStartPlannedMission}
                  disabled={!canCreateMission}
                >
                  Review night schedule
                </Button>
              ) : canCreateMission ? (
                <Link href="/missions/new">
                  <Button variant="cta" size="sm" className="text-xs">
                    Create Mission
                  </Button>
                </Link>
              ) : (
                <Button variant="cta" size="sm" className="text-xs" disabled>
                  Create Mission
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
                  <CreateMissionHelper text={createMissionHelperText} />
                </p>
              )}
            </>
          ) : showActiveActions ? (
            <>
              <Link
                href={`/missions/${activeMission!.id}`}
                className={isHero ? "w-full" : undefined}
              >
                <Button
                  variant="cta"
                  size={isHero ? "default" : "sm"}
                  className={cn("text-xs", isHero && "w-full")}
                >
                  {missionStatus === "CAPTURING"
                    ? "Resume Live Mission"
                    : missionStatus === "LOGGING"
                      ? "Resume Logging"
                      : missionStatus === "SETUP"
                        ? "Continue Setup"
                        : "Open Mission"}
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
                <Link
                  href={`/missions/${activeMission!.id}?phase=logging`}
                  className={isHero ? "w-full" : undefined}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn("text-xs", isHero && "w-full")}
                  >
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
                  <CreateMissionHelper text={createMissionHelperText} />
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
