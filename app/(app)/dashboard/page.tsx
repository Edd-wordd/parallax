"use client";

import { useCallback, useEffect, useMemo, memo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import { generateMockPlan } from "@/lib/mock/missions";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { getTargetById } from "@/lib/mock/recommendations";
import { getMissionStatus } from "@/lib/missionStatus";
import { formatTime } from "@/lib/utils";
import type { MissionTarget } from "@/lib/types";
import {
  RECOMMENDED_TARGETS,
  REJECTED_TARGETS,
  TONIGHT_CONDITIONS_NO_MISSION,
  getMissionWhyTonightPoints,
  ADAPTATION_INSIGHTS,
  ADAPTATION_EFFECTS,
  SETUP_IMPACT_BY_TARGET,
  TARGET_WINDOW_PARTS,
} from "@/lib/mock/intelligenceLayer";
import { EXPOSURE_PLANS_BY_TARGET } from "@/lib/mock/exposurePlans";
import { SESSION_SIMULATIONS_BY_TARGET } from "@/lib/mock/sessionSimulations";
import { SkyTabsCard } from "@/components/dashboard/SkyTabsCard";
import { MissionTimeline } from "@/components/MissionTimeline";
import { TargetCard } from "@/components/TargetCard";
import { SessionHistoryCard } from "@/components/sessions/SessionHistoryCard";
import { AdaptiveMissionCard } from "@/components/AdaptiveMissionCard";
import { CaptureRunSheetCard } from "@/components/CaptureRunSheetCard";
import { ObjectSpotlightCard } from "@/components/ObjectSpotlightCard";
import { DashboardMissionStatusCard } from "@/components/dashboard/DashboardMissionStatusCard";
import { DashboardSkyIntelligenceCard } from "@/components/dashboard/DashboardSkyIntelligenceCard";
import { DashboardImagingWindowCard } from "@/components/dashboard/DashboardImagingWindowCard";
import {
  TonightRecommendationsSection,
  MissionWhyTonightCard,
  LearnedFromSessionsCard,
  RejectedTargetPanel,
  ExposurePlannerCard,
  SessionSimulatorCard,
} from "@/components/intelligence";

function generateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Map recommendation type string to Mission targetType. */
function toTargetType(type: string): MissionTarget["targetType"] {
  if (type.toLowerCase().includes("nebula")) return "nebula";
  if (type.toLowerCase().includes("cluster")) return type.includes("Open") ? "open_cluster" : "globular_cluster";
  if (type.toLowerCase().includes("galaxy")) return "galaxy";
  return "nebula";
}

/** Convert RecommendedTarget to MissionTarget. */
function recommendedToMissionTarget(
  target: (typeof RECOMMENDED_TARGETS)[0]
): MissionTarget {
  const win = TARGET_WINDOW_PARTS[target.id] ?? { start: "21:00", end: "00:00" };
  return {
    targetId: target.id,
    targetName: target.name,
    targetType: toTargetType(target.type),
    plannedWindowStart: win.start,
    plannedWindowEnd: win.end,
    score: target.score,
  };
}

/**
 * Isolated clock component — only this rerenders on time tick, not the whole page.
 * Runs setInterval(60_000) to avoid full-page rerenders every second.
 */
const HeaderClock = memo(function HeaderClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="text-xs tabular-nums text-zinc-500 font-medium"
      aria-label="Current time"
    >
      {time ? formatTime(time.toISOString()) : "—"}
    </span>
  );
});

export default function DashboardPage() {
  const {
    activeMissionId,
    missions,
    getMission,
    addMission,
    setActiveMission,
  } = useMissionStore();
  const {
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
    activeLocationId,
    activeGearId,
    dateTime,
  } = useAppStore();
  const {
    plannedTargets,
    addToPlan,
    removeFromPlan,
    clearPlan,
    setPlannedTargets,
    selectedSetupImpactTargetId,
    setSelectedSetupImpactTargetId,
  } = useDashboardRecommendationStore();

  const activeLoc = useMemo(
    () =>
      MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ?? MOCK_LOCATIONS[0],
    [activeLocationId],
  );
  const activeMission = activeMissionId
    ? (getMission(activeMissionId) ?? null)
    : null;
  const missionStatus = getMissionStatus(activeMission);
  const hasActiveMission =
    missionStatus === "PLANNING" ||
    missionStatus === "SETUP" ||
    missionStatus === "CAPTURING" ||
    missionStatus === "LOGGING";

  /** Mock UI state: set to true to test Live Site telemetry in Observing Conditions. */
  const MOCK_IS_LIVE_CONNECTED = false;
  const isLiveConnected = MOCK_IS_LIVE_CONNECTED;

  const lastSessionMission = useMemo(
    () =>
      missionStatus === "COMPLETED" && activeMission
        ? activeMission
        : (missions
            .filter((m) => m.status === "completed")
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0] ?? null),
    [missionStatus, activeMission, missions],
  );

  const displayMission =
    activeMission ??
    (missionStatus === "COMPLETED" ? lastSessionMission : null);

  const handleStartMission = useCallback(
    (target: (typeof RECOMMENDED_TARGETS)[0]) => {
      const mt = recommendedToMissionTarget(target);
      const mission = {
        id: generateId(),
        name: `Tonight's Mission · ${target.name}`,
        dateTime: new Date().toISOString(),
        locationId: activeLocationId,
        gearId: activeGearId,
        constraints: {
          minAltitude,
          moonTolerance,
          targetTypes,
          driveToDarker,
          driveRadius,
        },
        targets: [mt],
        status: "ready" as const,
        phase: "planning" as const,
        createdAt: new Date().toISOString(),
      };
      addMission(mission);
      setActiveMission(mission.id);
      clearPlan();
      setSelectedSetupImpactTargetId(target.id);
    },
    [
      activeLocationId,
      activeGearId,
      minAltitude,
      moonTolerance,
      targetTypes,
      driveToDarker,
      driveRadius,
      addMission,
      setActiveMission,
      clearPlan,
      setSelectedSetupImpactTargetId,
    ]
  );

  const handleAddToPlan = useCallback(
    (target: (typeof RECOMMENDED_TARGETS)[0]) => {
      addToPlan(target.id);
    },
    [addToPlan]
  );

  /** Mock optimal sequence: Pleiades (early) → M42 (mid) → Rosette (late). */
  const handleBuildOptimalMission = useCallback(() => {
    const optimalIds = ["pleiades", "m42", "rosette"];
    const targets = optimalIds
      .map((id) => RECOMMENDED_TARGETS.find((t) => t.id === id))
      .filter((t): t is (typeof RECOMMENDED_TARGETS)[0] => !!t);
    const missionTargets = targets.map(recommendedToMissionTarget);
    const mission = {
      id: generateId(),
      name: "Tonight's Optimal Mission",
      dateTime: new Date().toISOString(),
      locationId: activeLocationId,
      gearId: activeGearId,
      constraints: {
        minAltitude,
        moonTolerance,
        targetTypes,
        driveToDarker,
        driveRadius,
      },
      targets: missionTargets,
      status: "ready" as const,
      phase: "planning" as const,
      createdAt: new Date().toISOString(),
    };
    addMission(mission);
    setActiveMission(mission.id);
    setPlannedTargets(optimalIds);
    setSelectedSetupImpactTargetId(targets[0]?.id ?? null);
  }, [
    activeLocationId,
    activeGearId,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
    addMission,
    setActiveMission,
    setPlannedTargets,
    setSelectedSetupImpactTargetId,
  ]);

  const handleStartPlannedMission = useCallback(() => {
    const targets = plannedTargets
      .map((id) => RECOMMENDED_TARGETS.find((t) => t.id === id))
      .filter((t): t is (typeof RECOMMENDED_TARGETS)[0] => !!t);
    if (targets.length === 0) return;
    const missionTargets = targets.map(recommendedToMissionTarget);
    const mission = {
      id: generateId(),
      name: "Tonight's Mission",
      dateTime: new Date().toISOString(),
      locationId: activeLocationId,
      gearId: activeGearId,
      constraints: {
        minAltitude,
        moonTolerance,
        targetTypes,
        driveToDarker,
        driveRadius,
      },
      targets: missionTargets,
      status: "ready" as const,
      phase: "planning" as const,
      createdAt: new Date().toISOString(),
    };
    addMission(mission);
    setActiveMission(mission.id);
    clearPlan();
  }, [
    plannedTargets,
    activeLocationId,
    activeGearId,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
    addMission,
    setActiveMission,
    clearPlan,
  ]);

  const handleQuickMission = useCallback(() => {
    const mission = {
      id: generateId(),
      name: "Tonight's Quick Mission",
      dateTime: new Date().toISOString(),
      locationId: activeLocationId,
      gearId: activeGearId,
      constraints: {
        minAltitude,
        moonTolerance,
        targetTypes,
        driveToDarker,
        driveRadius,
      },
      targets: generateMockPlan(
        activeLocationId,
        activeGearId,
        new Date().toISOString(),
        { minAltitude, moonTolerance, targetTypes, driveToDarker, driveRadius },
      ),
      status: "ready" as const,
      createdAt: new Date().toISOString(),
    };
    addMission(mission);
    setActiveMission(mission.id);
  }, [
    activeLocationId,
    activeGearId,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
    addMission,
    setActiveMission,
  ]);

  const timelineDateContext = useMemo(() => {
    const dt = activeMission?.dateTime ?? dateTime;
    if (!dt) return null;
    const d = new Date(dt);
    const today = new Date();
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    return isToday
      ? "Tonight"
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [activeMission?.dateTime, dateTime]);

  const missionRecommendations = useMemo(
    () =>
      activeMission?.targets
        .map((t) => {
          const target = getTargetById(t.targetId);
          if (!target) return null;
          return {
            target,
            shootability_score: t.score,
            best_window_start: t.plannedWindowStart,
            best_window_end: t.plannedWindowEnd,
            peak_altitude: 60,
            moon_separation: 30,
            difficulty: "moderate" as const,
            why: [`Planned ${t.plannedWindowStart}–${t.plannedWindowEnd}`],
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null) ?? [],
    [activeMission?.targets],
  );

  const activeMissionFirstTargetId = activeMission?.targets[0]?.targetId ?? null;
  const plannedTargetsResolved = useMemo(
    () =>
      plannedTargets
        .map((id) => RECOMMENDED_TARGETS.find((t) => t.id === id))
        .filter((t): t is (typeof RECOMMENDED_TARGETS)[0] => !!t),
    [plannedTargets]
  );
  const plannedFirstTargetId = plannedTargetsResolved[0]?.id ?? null;

  /** Highest-ranked recommended target by score (used for mission-initialized hint). */
  const topRecommendedTarget = useMemo(
    () =>
      RECOMMENDED_TARGETS.length > 0
        ? RECOMMENDED_TARGETS.reduce((a, b) =>
            a.score >= b.score ? a : b
          )
        : null,
    []
  );

  /** Clear active mission and return to no-mission state. */
  const handleClearMission = useCallback(() => {
    setActiveMission(null);
  }, [setActiveMission]);

  const setupImpactTargetId =
    selectedSetupImpactTargetId ??
    activeMissionFirstTargetId ??
    plannedFirstTargetId ??
    null;
  const setupImpactItems = setupImpactTargetId
    ? (SETUP_IMPACT_BY_TARGET[setupImpactTargetId] ?? SETUP_IMPACT_BY_TARGET.m42 ?? [])
    : [];
  const setupImpactTargetName = setupImpactTargetId
    ? (RECOMMENDED_TARGETS.find((t) => t.id === setupImpactTargetId)?.name ??
       activeMission?.targets.find((t) => t.targetId === setupImpactTargetId)?.targetName ??
       null)
    : null;
  const setupImpactEmpty = !setupImpactTargetId && !hasActiveMission;

  /**
   * Single derived target context for all mission-dependent cards.
   * Resolves in order: active mission target > selected planned target > first planned target > null.
   */
  const firstMissionTarget = activeMission?.targets?.[0];
  const currentMissionTargetContext = useMemo(() => {
    if (hasActiveMission && firstMissionTarget) {
      return { targetId: firstMissionTarget.targetId, targetName: firstMissionTarget.targetName };
    }
    if (plannedTargetsResolved.length > 0) {
      const selectedInPlan =
        selectedSetupImpactTargetId &&
        plannedTargets.includes(selectedSetupImpactTargetId);
      const target = selectedInPlan
        ? plannedTargetsResolved.find((t) => t.id === selectedSetupImpactTargetId)
        : plannedTargetsResolved[0];
      return target ? { targetId: target.id, targetName: target.name } : null;
    }
    return null;
  }, [
    hasActiveMission,
    firstMissionTarget,
    plannedTargetsResolved,
    plannedTargets,
    selectedSetupImpactTargetId,
  ]);

  const currentPlanningTargetId = currentMissionTargetContext?.targetId ?? null;
  const currentPlanningTargetName = currentMissionTargetContext?.targetName ?? null;

  const exposurePlan = currentPlanningTargetId
    ? (EXPOSURE_PLANS_BY_TARGET[currentPlanningTargetId] ?? null)
    : null;
  const sessionSimulation = currentPlanningTargetId
    ? (SESSION_SIMULATIONS_BY_TARGET[currentPlanningTargetId] ?? null)
    : null;

  const constraints = useMemo(
    () => ({
      minAltitude,
      moonTolerance,
      targetTypes,
      driveToDarker,
      driveRadius: driveToDarker ? driveRadius : undefined,
    }),
    [minAltitude, moonTolerance, targetTypes, driveToDarker, driveRadius],
  );

  // No Framer Motion — removed staggered card animations for performance
  return (
    <div className="space-y-4">
      {/* Top row: Mission Control, Conditions/Why Mission, Observing Conditions, Capture Window */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMissionStatusCard
          mission={displayMission}
          missionStatus={missionStatus}
          activeLocationId={activeLocationId}
          activeGearId={activeGearId}
          onQuickMission={handleQuickMission}
          onClearMission={handleClearMission}
          activeMission={
            hasActiveMission && activeMission ? activeMission : null
          }
          plannedTargets={plannedTargetsResolved}
          plannedTargetNames={plannedTargetsResolved.map((t) => t.name)}
          onStartPlannedMission={
            plannedTargetsResolved.length > 0 ? handleStartPlannedMission : undefined
          }
          noTargetsMessage={
            hasActiveMission && activeMission?.targets.length === 0
              ? "No recommended targets available for automatic mission setup."
              : undefined
          }
          missionInitializedFromRecommendation={
            !!(hasActiveMission &&
              activeMission?.targets.length === 1 &&
              topRecommendedTarget &&
              activeMission.targets[0]?.targetId === topRecommendedTarget.id)
          }
        />
        <MissionWhyTonightCard
          hasActiveMission={hasActiveMission || plannedTargetsResolved.length > 0}
          points={
            hasActiveMission && activeMission?.targets[0]
              ? getMissionWhyTonightPoints(activeMission.targets[0].targetName)
              : plannedTargetsResolved[0]
                ? getMissionWhyTonightPoints(plannedTargetsResolved[0].name)
                : TONIGHT_CONDITIONS_NO_MISSION.points
          }
        />
        <DashboardSkyIntelligenceCard
          activeLocationId={activeLocationId}
          dateTime={dateTime}
          locationName={activeLoc?.name}
          isLiveConnected={isLiveConnected}
        />
        <DashboardImagingWindowCard
          activeLocationId={activeLocationId}
          dateTime={dateTime}
          hasActiveMission={hasActiveMission || plannedTargetsResolved.length > 0}
          primaryTarget={
            hasActiveMission && activeMission?.targets[0]
              ? {
                  name: activeMission.targets[0].targetName,
                  plannedWindowStart: activeMission.targets[0].plannedWindowStart,
                  plannedWindowEnd: activeMission.targets[0].plannedWindowEnd,
                }
              : plannedTargetsResolved[0]
                ? (() => {
                    const win = TARGET_WINDOW_PARTS[plannedTargetsResolved[0].id] ?? {
                      start: "21:00",
                      end: "00:00",
                    };
                    return {
                      name: plannedTargetsResolved[0].name,
                      plannedWindowStart: win.start,
                      plannedWindowEnd: win.end,
                    };
                  })()
                : undefined
          }
        />
      </div>

      {/* NO MISSION: Sky tabs (Tonight Sky + Live Sky), Intelligence layer, Session History, Object Spotlight */}
      {missionStatus === "NONE" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
            <SkyTabsCard
              activeLocationId={activeLocationId}
              dateTime={dateTime}
            />
            <SessionHistoryCard compact />
          </div>
          <TonightRecommendationsSection
            selectedTargetId={selectedSetupImpactTargetId}
            onSelectTarget={setSelectedSetupImpactTargetId}
            setupImpactTargetName={setupImpactTargetName}
            setupImpactItems={setupImpactItems}
            setupImpactEmpty={setupImpactEmpty}
            activeMissionTargetId={plannedTargetsResolved[0]?.id ?? null}
            plannedTargets={plannedTargetsResolved}
            onStartMission={handleStartMission}
            onAddToPlan={handleAddToPlan}
            onBuildOptimalMission={handleBuildOptimalMission}
            onRemoveFromPlan={removeFromPlan}
            onClearPlan={clearPlan}
            onStartPlannedMission={
              plannedTargetsResolved.length > 0 ? handleStartPlannedMission : undefined
            }
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LearnedFromSessionsCard
              insights={ADAPTATION_INSIGHTS}
              effects={ADAPTATION_EFFECTS}
            />
            <RejectedTargetPanel targets={REJECTED_TARGETS} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExposurePlannerCard
              targetName={currentPlanningTargetName}
              plan={exposurePlan}
            />
            <SessionSimulatorCard
              targetName={currentPlanningTargetName}
              simulation={sessionSimulation}
            />
          </div>
          <div>
            <ObjectSpotlightCard
              activeLocationId={activeLocationId}
              activeGearId={activeGearId}
              dateTime={dateTime}
              constraints={constraints}
            />
          </div>
        </>
      )}

      {/* COMPLETED (no active mission, but has displayMission for context) */}
      {missionStatus === "COMPLETED" && !hasActiveMission && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
            <SkyTabsCard
              activeLocationId={activeLocationId}
              dateTime={dateTime}
            />
            <SessionHistoryCard compact />
          </div>
          <TonightRecommendationsSection
            selectedTargetId={selectedSetupImpactTargetId}
            onSelectTarget={setSelectedSetupImpactTargetId}
            setupImpactTargetName={setupImpactTargetName}
            setupImpactItems={setupImpactItems}
            setupImpactEmpty={setupImpactEmpty}
            activeMissionTargetId={plannedTargetsResolved[0]?.id ?? null}
            plannedTargets={plannedTargetsResolved}
            onStartMission={handleStartMission}
            onAddToPlan={handleAddToPlan}
            onBuildOptimalMission={handleBuildOptimalMission}
            onRemoveFromPlan={removeFromPlan}
            onClearPlan={clearPlan}
            onStartPlannedMission={
              plannedTargetsResolved.length > 0 ? handleStartPlannedMission : undefined
            }
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LearnedFromSessionsCard
              insights={ADAPTATION_INSIGHTS}
              effects={ADAPTATION_EFFECTS}
            />
            <RejectedTargetPanel targets={REJECTED_TARGETS} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExposurePlannerCard
              targetName={currentPlanningTargetName}
              plan={exposurePlan}
            />
            <SessionSimulatorCard
              targetName={currentPlanningTargetName}
              simulation={sessionSimulation}
            />
          </div>
          <div>
            <ObjectSpotlightCard
              activeLocationId={activeLocationId}
              activeGearId={activeGearId}
              dateTime={dateTime}
              constraints={constraints}
            />
          </div>
        </>
      )}

      {/* ACTIVE MISSION: timeline, mission plan, session history, etc. */}
      {hasActiveMission && activeMission && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] items-stretch">
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/80 p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
                <h2 className="text-sm font-semibold text-zinc-200">
                  Mission Timeline
                  {timelineDateContext && (
                    <span className="text-zinc-500 font-normal">
                      {" "}
                      — {timelineDateContext}
                    </span>
                  )}
                </h2>
                <HeaderClock />
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <MissionTimeline
                  targets={activeMission.targets}
                  missionDate={activeMission.dateTime}
                  compact
                />
              </div>
            </div>
            <SkyTabsCard
              activeLocationId={activeLocationId}
              dateTime={dateTime}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200">
                Mission Plan (Targets)
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {missionRecommendations.map((rec) => (
                  <TargetCard
                    key={rec.target.id}
                    target={rec.target}
                    recommendation={rec}
                    missionPlan
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <RejectedTargetPanel targets={REJECTED_TARGETS} />
              <ExposurePlannerCard
                targetName={currentPlanningTargetName}
                plan={exposurePlan}
              />
              <SessionSimulatorCard
                targetName={currentPlanningTargetName}
                simulation={sessionSimulation}
              />
              {missionStatus === "CAPTURING" && <AdaptiveMissionCard />}
              {(missionStatus === "CAPTURING" ||
                missionStatus === "LOGGING") && <CaptureRunSheetCard />}
              <SessionHistoryCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
