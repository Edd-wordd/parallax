"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { getMissionStatus } from "@/lib/missionStatus";
import type { Location, MissionTarget } from "@/lib/types";
import { SkyTabsCard } from "@/components/dashboard/SkyTabsCard";
import { SessionHistoryCard } from "@/components/sessions/SessionHistoryCard";
import { DashboardMissionStatusCard } from "@/components/dashboard/DashboardMissionStatusCard";
import { DashboardSkyIntelligenceCard } from "@/components/dashboard/DashboardSkyIntelligenceCard";
import {
  TonightRecommendationsSection,
  NotSuitableSessionPanel,
  MissionDecisionDrawer,
  type DrawerTarget,
} from "@/components/intelligence";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import { useDashboardRecommendations } from "@/lib/recommendations/useDashboardRecommendations";
import {
  recommendationToMissionTarget,
  recommendationsContextKey,
} from "@/lib/recommendations/mapper";
import type {
  DashboardRecommendation,
  RejectedRecommendation,
} from "@/lib/recommendations/types";
import { useToast } from "@/components/ui/toast";

function generateId(): string {
  return crypto.randomUUID();
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
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

  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const rows = await listLocations(client);
        if (cancelled) return;
        setDbLocations(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lon: r.lon,
            bortle: r.bortle,
            notes: r.notes ?? undefined,
          })),
        );
      } catch {
        // Keep mock fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLoc = useMemo(() => {
    if (isUuid(activeLocationId)) {
      const fromDb = dbLocations.find((l) => l.id === activeLocationId);
      if (fromDb) return fromDb;
    }
    return (
      MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ??
      dbLocations[0] ??
      MOCK_LOCATIONS[0]
    );
  }, [activeLocationId, dbLocations]);

  const constraints = useMemo(
    () => ({
      minAltitude,
      moonTolerance,
      targetTypes: [...targetTypes],
      driveToDarker,
      driveRadius,
    }),
    [minAltitude, moonTolerance, targetTypes, driveToDarker, driveRadius],
  );

  const recResult = useDashboardRecommendations({
    latDeg: activeLoc?.lat,
    lonDeg: activeLoc?.lon,
    dateTime,
    constraints,
  });

  const contextKey = recommendationsContextKey({
    locationId: activeLocationId || activeLoc?.id || "",
    dateTime,
    minAltitude,
    moonTolerance,
    targetTypes: [...targetTypes],
  });
  const prevContextKey = useRef<string | null>(null);

  useEffect(() => {
    if (prevContextKey.current === null) {
      prevContextKey.current = contextKey;
      return;
    }
    if (prevContextKey.current !== contextKey) {
      prevContextKey.current = contextKey;
      if (plannedTargets.length > 0) {
        clearPlan();
        toast("Plan cleared — site or time changed", "default");
      }
    }
  }, [contextKey, plannedTargets.length, clearPlan, toast]);

  const plannedTargetsResolved = useMemo(
    () =>
      plannedTargets
        .map((id) => recResult.recommendations.find((t) => t.id === id))
        .filter((t): t is DashboardRecommendation => !!t),
    [plannedTargets, recResult.recommendations],
  );

  const hasGear = Boolean(activeGearId);
  const hasLocation = Boolean(activeLocationId);
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

  const buildMission = useCallback(
    (targets: MissionTarget[], name: string) => {
      const mission = {
        id: generateId(),
        name,
        dateTime: recResult.sessionStart.toISOString(),
        locationId: activeLocationId,
        gearId: activeGearId,
        constraints,
        targets,
        status: "ready" as const,
        phase: "planning" as const,
        createdAt: new Date().toISOString(),
      };
      addMission(mission);
      setActiveMission(mission.id);
      clearPlan();
      router.push(`/missions/${mission.id}`);
    },
    [
      recResult.sessionStart,
      activeLocationId,
      activeGearId,
      constraints,
      addMission,
      setActiveMission,
      clearPlan,
      router,
    ],
  );

  const handleCreateMissionPlan = useCallback(
    (target: DashboardRecommendation) => {
      if (!canCreateMission) {
        toast("Select a location and gear profile first", "error");
        return;
      }
      buildMission(
        [recommendationToMissionTarget(target, 1)],
        `Mission · ${target.name}`,
      );
    },
    [canCreateMission, buildMission, toast],
  );

  const handleAddToPlan = useCallback(
    (target: DashboardRecommendation) => {
      addToPlan(target.id);
    },
    [addToPlan],
  );

  const handlePlanTopTargets = useCallback(() => {
    if (!canCreateMission) {
      toast("Select a location and gear profile first", "error");
      return;
    }
    const top = recResult.recommendations.slice(0, 3);
    if (top.length === 0) {
      toast("No targets available to plan", "error");
      return;
    }
    const ids = top.map((t) => t.id);
    setPlannedTargets(ids);
    const missionTargets = top.map((t, i) =>
      recommendationToMissionTarget(t, i + 1),
    );
    buildMission(missionTargets, "Planned night");
  }, [
    canCreateMission,
    recResult.recommendations,
    setPlannedTargets,
    buildMission,
    toast,
  ]);

  const handleStartPlannedMission = useCallback(() => {
    if (!canCreateMission) {
      toast("Select a location and gear profile first", "error");
      return;
    }
    if (plannedTargetsResolved.length === 0) return;
    const missionTargets = plannedTargetsResolved.map((t, i) =>
      recommendationToMissionTarget(t, i + 1),
    );
    buildMission(missionTargets, "Planned night");
  }, [canCreateMission, plannedTargetsResolved, buildMission, toast]);

  const topRecommendedTarget = recResult.recommendations[0] ?? null;

  const handleClearMission = useCallback(() => {
    setActiveMission(null);
  }, [setActiveMission]);

  const openEvidence = useCallback((target: DashboardRecommendation) => {
    setDrawerTarget({ ...target, isRejected: false });
    setDrawerOpen(true);
  }, []);

  const openRejected = useCallback((target: RejectedRecommendation) => {
    setDrawerTarget({ ...target, isRejected: true });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerTarget(null);
  }, []);

  return (
    <div className="space-y-4">
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
          lat={activeLoc?.lat}
          lon={activeLoc?.lon}
          isLiveConnected={isLiveConnected}
          minAltitudeDeg={minAltitude}
          moonToleranceDeg={moonTolerance}
        />
        <SessionHistoryCard compact />
      </div>

      {(missionStatus === "NONE" || missionStatus === "COMPLETED") && (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
            <SkyTabsCard
              activeLocationId={activeLocationId}
              dateTime={dateTime}
              lat={activeLoc?.lat}
              lon={activeLoc?.lon}
              bortle={activeLoc?.bortle}
              minAltitudeDeg={minAltitude}
              moonToleranceDeg={moonTolerance}
            />
            <NotSuitableSessionPanel
              rejected={recResult.rejected}
              onOpen={openRejected}
              className="h-full"
            />
          </div>
          <TonightRecommendationsSection
            sectionTitle={recResult.sectionTitle}
            recommendations={recResult.recommendations}
            emptyMessage={recResult.emptyMessage}
            selectedTargetId={selectedTargetId}
            onSelectTarget={setSelectedTargetId}
            activeMissionTargetId={plannedTargetsResolved[0]?.id ?? null}
            plannedTargets={plannedTargetsResolved}
            onCreateMissionPlan={handleCreateMissionPlan}
            onAddToPlan={handleAddToPlan}
            onPlanTopTargets={handlePlanTopTargets}
            onRemoveFromPlan={removeFromPlan}
            onClearPlan={clearPlan}
            onStartPlannedMission={
              plannedTargetsResolved.length > 0
                ? handleStartPlannedMission
                : undefined
            }
            onOpenEvidence={openEvidence}
          />
        </>
      )}

      <MissionDecisionDrawer
        target={drawerTarget}
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}
