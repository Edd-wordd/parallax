"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { getMissionStatus } from "@/lib/missionStatus";
import type { GearProfile, Location, MissionTarget } from "@/lib/types";
import { SkyTabsCard } from "@/components/dashboard/SkyTabsCard";
import { SessionHistoryCard } from "@/components/sessions/SessionHistoryCard";
import { DashboardMissionStatusCard } from "@/components/dashboard/DashboardMissionStatusCard";
import { DashboardSkyIntelligenceCard } from "@/components/dashboard/DashboardSkyIntelligenceCard";
import {
  TonightRecommendationsSection,
  NotSuitableSessionPanel,
  MissionDecisionDrawer,
  NightScheduleReview,
  type DrawerTarget,
} from "@/components/intelligence";
import type { ScheduleReviewRow } from "@/components/intelligence/NightScheduleReview";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import { useDashboardRecommendations } from "@/lib/recommendations/useDashboardRecommendations";
import {
  buildRecommendationForCatalogId,
  recommendationsContextKey,
} from "@/lib/recommendations/mapper";
import type {
  DashboardRecommendation,
  RejectedRecommendation,
} from "@/lib/recommendations/types";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { useToast } from "@/components/ui/toast";
import {
  defaultDurationFitsWindow,
  missionTargetsFromSchedule,
  recommendationToScheduleInput,
} from "@/lib/schedule/applySchedule";
import { proposeFeasibleSchedule } from "@/lib/schedule/buildNightSchedule";
import {
  DEFAULT_IMAGING_MINUTES,
  DEFAULT_TRANSITION_MINUTES,
  type NightScheduleResult,
} from "@/lib/schedule/types";

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
    plannedEntries,
    addToPlan,
    removeFromPlan,
    clearPlan,
    setPlannedTargets,
    setDesiredMinutes,
    reorderPlan,
  } = useDashboardRecommendationStore();
  const plannedTargets = plannedEntries.map((e) => e.catalogId);

  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [dbGear, setDbGear] = useState<GearProfile[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<ScheduleReviewRow[]>([]);
  const [scheduleProposalNote, setScheduleProposalNote] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const [locRows, gearRows] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        setDbLocations(
          locRows.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lon: r.lon,
            bortle: r.bortle,
            notes: r.notes ?? undefined,
          })),
        );
        setDbGear(
          gearRows.map((r) => ({
            id: r.id,
            name: r.name,
            telescope_name: r.telescope_name,
            focal_length: r.focal_length,
            aperture: r.aperture,
            camera_name: r.camera_name,
            sensor_preset: r.sensor_preset,
            sensor_width_mm: r.sensor_width_mm ?? null,
            sensor_height_mm: r.sensor_height_mm ?? null,
            optics_factor: r.optics_factor ?? null,
            pixel_size: r.pixel_size ?? undefined,
            mount_type: r.mount_type,
            guiding: r.guiding,
            active: r.is_active,
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

  const activeGear = useMemo(() => {
    if (isUuid(activeGearId)) {
      const fromDb = dbGear.find((g) => g.id === activeGearId);
      if (fromDb) return fromDb;
    }
    return (
      MOCK_GEAR.find((g) => g.id === activeGearId) ??
      dbGear.find((g) => g.active) ??
      dbGear[0] ??
      MOCK_GEAR[0]
    );
  }, [activeGearId, dbGear]);

  const framingGear = useMemo(() => {
    if (!activeGear) return null;
    return {
      focalLengthMm: activeGear.focal_length,
      sensorWidthMm: activeGear.sensor_width_mm,
      sensorHeightMm: activeGear.sensor_height_mm,
      opticsFactor: activeGear.optics_factor,
    };
  }, [activeGear]);

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
    gear: framingGear,
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

  const plannedTargetsResolved = useMemo(() => {
    return plannedTargets
      .map((id) => {
        const fromRecs = recResult.recommendations.find((t) => t.id === id);
        if (fromRecs) return fromRecs;
        // Visible-unranked (or any catalog id with a session window)
        return buildRecommendationForCatalogId({
          targetId: id,
          latDeg: activeLoc?.lat,
          lonDeg: activeLoc?.lon,
          dateTime,
          constraints,
          gear: framingGear,
        });
      })
      .filter((t): t is DashboardRecommendation => t != null);
  }, [
    plannedTargets,
    recResult.recommendations,
    activeLoc?.lat,
    activeLoc?.lon,
    dateTime,
    constraints,
    framingGear,
  ]);

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
    (targets: MissionTarget[], name: string, transitionMinutes?: number) => {
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
        transitionMinutes: transitionMinutes ?? DEFAULT_TRANSITION_MINUTES,
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

  const openScheduleReview = useCallback(
    (rows: ScheduleReviewRow[], proposalNote: string | null = null) => {
      setScheduleRows(rows);
      setScheduleProposalNote(proposalNote);
      setScheduleOpen(true);
    },
    [],
  );

  const rowsFromResolved = useCallback((): ScheduleReviewRow[] => {
    return plannedTargetsResolved.map((rec) => {
      const entry = plannedEntries.find((e) => e.catalogId === rec.id);
      return {
        catalogId: rec.id,
        name: rec.name,
        desiredMinutes: entry?.desiredMinutes ?? DEFAULT_IMAGING_MINUTES,
        recommendation: rec,
      };
    });
  }, [plannedTargetsResolved, plannedEntries]);

  const handleCreateMissionPlan = useCallback(
    (target: DashboardRecommendation) => {
      if (!canCreateMission) {
        toast("Select a location and gear profile first", "error");
        return;
      }
      if (!defaultDurationFitsWindow(target, DEFAULT_IMAGING_MINUTES)) {
        openScheduleReview(
          [
            {
              catalogId: target.id,
              name: target.name,
              desiredMinutes: DEFAULT_IMAGING_MINUTES,
              recommendation: target,
            },
          ],
          `Default ${DEFAULT_IMAGING_MINUTES} min exceeds the usable window (${target.windowDurationMinutes} min). Adjust duration to continue.`,
        );
        return;
      }
      const single = proposeFeasibleSchedule({
        sessionStart: recResult.sessionStart,
        sessionEnd: recResult.sessionEnd,
        targets: [
          recommendationToScheduleInput(target, DEFAULT_IMAGING_MINUTES),
        ],
        transitionMinutes: DEFAULT_TRANSITION_MINUTES,
      });
      if (!single.ok || single.segments.length === 0) {
        openScheduleReview(
          [
            {
              catalogId: target.id,
              name: target.name,
              desiredMinutes: DEFAULT_IMAGING_MINUTES,
              recommendation: target,
            },
          ],
          single.proposalNote,
        );
        return;
      }
      buildMission(
        missionTargetsFromSchedule(single, [target]),
        `Mission · ${target.name}`,
        single.transitionMinutes,
      );
    },
    [
      canCreateMission,
      buildMission,
      toast,
      openScheduleReview,
      recResult.sessionStart,
      recResult.sessionEnd,
    ],
  );

  const handleAddToPlan = useCallback(
    (target: DashboardRecommendation) => {
      addToPlan(target.id, DEFAULT_IMAGING_MINUTES);
    },
    [addToPlan],
  );

  const handleProposeSchedule = useCallback(() => {
    if (!canCreateMission) {
      toast("Select a location and gear profile first", "error");
      return;
    }
    const top = recResult.recommendations.slice(0, 3);
    if (top.length === 0) {
      toast("No targets available to plan", "error");
      return;
    }
    setPlannedTargets(top.map((t) => t.id), DEFAULT_IMAGING_MINUTES);
    const proposed = proposeFeasibleSchedule({
      sessionStart: recResult.sessionStart,
      sessionEnd: recResult.sessionEnd,
      targets: top.map((t) =>
        recommendationToScheduleInput(t, DEFAULT_IMAGING_MINUTES),
      ),
      transitionMinutes: DEFAULT_TRANSITION_MINUTES,
    });
    const scheduledIds = new Set(proposed.segments.map((s) => s.catalogId));
    const rows: ScheduleReviewRow[] = [
      ...proposed.segments.map((s) => {
        const rec = top.find((t) => t.id === s.catalogId)!;
        return {
          catalogId: s.catalogId,
          name: s.name,
          desiredMinutes: DEFAULT_IMAGING_MINUTES,
          recommendation: rec,
        };
      }),
      ...top
        .filter((t) => !scheduledIds.has(t.id))
        .map((t) => ({
          catalogId: t.id,
          name: t.name,
          desiredMinutes: DEFAULT_IMAGING_MINUTES,
          recommendation: t,
        })),
    ];
    openScheduleReview(rows, proposed.proposalNote);
  }, [
    canCreateMission,
    recResult.recommendations,
    recResult.sessionStart,
    recResult.sessionEnd,
    setPlannedTargets,
    openScheduleReview,
    toast,
  ]);

  const handleReviewSchedule = useCallback(() => {
    if (!canCreateMission) {
      toast("Select a location and gear profile first", "error");
      return;
    }
    const rows = rowsFromResolved();
    if (rows.length === 0) return;
    openScheduleReview(rows, null);
  }, [canCreateMission, rowsFromResolved, openScheduleReview, toast]);

  const handleAcceptSchedule = useCallback(
    (result: NightScheduleResult, orderedRows: ScheduleReviewRow[]) => {
      if (result.segments.length === 0) {
        toast("Nothing to schedule — adjust durations or targets", "error");
        return;
      }
      reorderPlan(orderedRows.map((r) => r.catalogId));
      for (const row of orderedRows) {
        setDesiredMinutes(row.catalogId, row.desiredMinutes);
      }
      const recs = orderedRows.map((r) => r.recommendation);
      buildMission(
        missionTargetsFromSchedule(result, recs),
        "Planned night",
        result.transitionMinutes,
      );
      setScheduleOpen(false);
    },
    [buildMission, reorderPlan, setDesiredMinutes, toast],
  );

  const plannedDurations = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of plannedEntries) m[e.catalogId] = e.desiredMinutes;
    return m;
  }, [plannedEntries]);

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
              ? handleReviewSchedule
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
            plannedDurations={plannedDurations}
            onCreateMissionPlan={handleCreateMissionPlan}
            onAddToPlan={handleAddToPlan}
            onProposeSchedule={handleProposeSchedule}
            onRemoveFromPlan={removeFromPlan}
            onClearPlan={clearPlan}
            onReviewSchedule={
              plannedTargetsResolved.length > 0
                ? handleReviewSchedule
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

      <NightScheduleReview
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        sessionStart={recResult.sessionStart}
        sessionEnd={recResult.sessionEnd}
        rows={scheduleRows}
        proposalNote={scheduleProposalNote}
        onAccept={handleAcceptSchedule}
      />
    </div>
  );
}
