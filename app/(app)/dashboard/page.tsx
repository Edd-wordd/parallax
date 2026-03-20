"use client";

import { useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { getMissionStatus } from "@/lib/missionStatus";
import type { MissionTarget } from "@/lib/types";
import {
  RECOMMENDED_TARGETS,
  REJECTED_TARGETS,
  TARGET_WINDOW_PARTS,
} from "@/lib/mock/intelligenceLayer";
import { SkyTabsCard } from "@/components/dashboard/SkyTabsCard";
import { SessionHistoryCard } from "@/components/sessions/SessionHistoryCard";
import { DashboardMissionStatusCard } from "@/components/dashboard/DashboardMissionStatusCard";
import { DashboardSkyIntelligenceCard } from "@/components/dashboard/DashboardSkyIntelligenceCard";
import {
  TonightRecommendationsSection,
  RejectedTargetPanel,
} from "@/components/intelligence";

function generateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Map recommendation type string to Mission targetType. */
function toTargetType(type: string): MissionTarget["targetType"] {
  if (type.toLowerCase().includes("nebula")) return "nebula";
  if (type.toLowerCase().includes("cluster"))
    return type.includes("Open") ? "open_cluster" : "globular_cluster";
  if (type.toLowerCase().includes("galaxy")) return "galaxy";
  return "nebula";
}

/** Convert RecommendedTarget to MissionTarget. */
function recommendedToMissionTarget(
  target: (typeof RECOMMENDED_TARGETS)[0],
): MissionTarget {
  const win = TARGET_WINDOW_PARTS[target.id] ?? {
    start: "21:00",
    end: "00:00",
  };
  return {
    targetId: target.id,
    targetName: target.name,
    targetType: toTargetType(target.type),
    plannedWindowStart: win.start,
    plannedWindowEnd: win.end,
    score: target.score,
  };
}

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
  } = useDashboardRecommendationStore();

  const activeLoc = useMemo(
    () =>
      MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ??
      MOCK_LOCATIONS[0],
    [activeLocationId],
  );
  const hasGear = true;
  const hasLocation = true;
  const canCreateMission = hasGear && hasLocation;
  const createMissionHelperText =
    !hasGear && !hasLocation
      ? "Set up a gear profile and location to create your first mission."
      : hasGear && !hasLocation
        ? "Add a location to get started."
        : !hasGear && hasLocation
          ? "Add a gear profile to get started."
          : null;

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

  const plannedTargetsResolved = useMemo(
    () =>
      plannedTargets
        .map((id) => RECOMMENDED_TARGETS.find((t) => t.id === id))
        .filter((t): t is (typeof RECOMMENDED_TARGETS)[0] => !!t),
    [plannedTargets],
  );

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
    ],
  );

  const handleAddToPlan = useCallback(
    (target: (typeof RECOMMENDED_TARGETS)[0]) => {
      addToPlan(target.id);
    },
    [addToPlan],
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

  /** Highest-ranked recommended target by score (used for mission-initialized hint). */
  const topRecommendedTarget = useMemo(
    () =>
      RECOMMENDED_TARGETS.length > 0
        ? RECOMMENDED_TARGETS.reduce((a, b) => (a.score >= b.score ? a : b))
        : null,
    [],
  );

  /** Clear active mission and return to no-mission state. */
  const handleClearMission = useCallback(() => {
    setActiveMission(null);
  }, [setActiveMission]);

  // No Framer Motion — removed staggered card animations for performance
  return (
    <div className="space-y-4">
      {/* Top row: Mission Control, Observing Conditions, Last Session */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardMissionStatusCard
          mission={displayMission}
          missionStatus={missionStatus}
          activeLocationId={activeLocationId}
          activeGearId={activeGearId}
          canCreateMission={canCreateMission}
          createMissionHelperText={createMissionHelperText}
          onClearMission={handleClearMission}
          activeMission={
            hasActiveMission && activeMission ? activeMission : null
          }
          plannedTargets={plannedTargetsResolved}
          plannedTargetNames={plannedTargetsResolved.map((t) => t.name)}
          onStartPlannedMission={
            plannedTargetsResolved.length > 0
              ? handleStartPlannedMission
              : undefined
          }
          noTargetsMessage={
            hasActiveMission && activeMission?.targets.length === 0
              ? "No recommended targets available for automatic mission setup."
              : undefined
          }
          missionInitializedFromRecommendation={
            !!(
              hasActiveMission &&
              activeMission?.targets.length === 1 &&
              topRecommendedTarget &&
              activeMission.targets[0]?.targetId === topRecommendedTarget.id
            )
          }
        />
        <DashboardSkyIntelligenceCard
          activeLocationId={activeLocationId}
          dateTime={dateTime}
          locationName={activeLoc?.name}
          isLiveConnected={isLiveConnected}
        />
        <SessionHistoryCard compact />
      </div>

      {/* NO MISSION: Sky tabs, Rejected Tonight, then Recommendations, Last Session, etc. */}
      {(missionStatus === "NONE" || missionStatus === "COMPLETED") && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
            <SkyTabsCard
              activeLocationId={activeLocationId}
              dateTime={dateTime}
            />
            <RejectedTargetPanel targets={REJECTED_TARGETS} />
          </div>
          <TonightRecommendationsSection
            selectedTargetId={null}
            onSelectTarget={() => {}}
            activeMissionTargetId={plannedTargetsResolved[0]?.id ?? null}
            plannedTargets={plannedTargetsResolved}
            onStartMission={handleStartMission}
            onAddToPlan={handleAddToPlan}
            onBuildOptimalMission={handleBuildOptimalMission}
            onRemoveFromPlan={removeFromPlan}
            onClearPlan={clearPlan}
            onStartPlannedMission={
              plannedTargetsResolved.length > 0
                ? handleStartPlannedMission
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}
