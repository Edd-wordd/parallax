/**
 * Mission Page — Field Operations Dashboard
 *
 * Parallax = Mission Intelligence Layer. This page supports:
 * - Reviewing the active mission
 * - Watching target timing
 * - Monitoring sky/condition health
 * - Adjusting the mission plan
 * - Deciding whether to continue, pause, switch targets, or abort
 * - Logging notes and results
 *
 * Parallax guides the session; actual capture runs in NINA, Ekos, ASIAIR, Voyager, etc.
 */

"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { MissionUIProvider, useMissionUI } from "@/lib/missionUIStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Play, Trash2, ClipboardList, XCircle, Pencil } from "lucide-react";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { AddTargetPicker } from "@/components/missions/AddTargetPicker";
import { PlanningView } from "@/components/missions/views/PlanningView";
import {
  SetupView,
  type ChecklistTogglePayload,
} from "@/components/missions/views/SetupView";
import { CapturingView } from "@/components/missions/views/CapturingView";
import { LoggingView } from "@/components/missions/views/LoggingView";
import { PhaseTabs } from "@/components/missions/PhaseTabs";
import { getAvailableTargetsForAdd } from "@/lib/mock/availableTargetsForMission";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import {
  ExposurePlannerCard,
  SessionSimulatorCard,
} from "@/components/intelligence";
import { RigSetupCard } from "@/components/missions/RigSetupCard";
import { phaseFromStatus } from "@/lib/missions/phase";
import { buildPlanSnapshot } from "@/lib/missions/planSnapshot";
import { getMissionStatus } from "@/lib/missionStatus";
import type { MissionPhase, MissionTarget, Mission } from "@/lib/types";
import type { ActivePhase } from "@/lib/missionUIStore";
import type { MissionEventKind } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { persistMissionToDb } from "@/lib/missions/persistMission";
import { upsertSessionFromLog } from "@/lib/supabase/queries/sessions";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";
import {
  cancelMissionInDb,
  getMissionWithTargets,
} from "@/lib/supabase/queries/missions";
import type { SessionLogPayload } from "@/components/missions/views/LoggingView";
import { targetScheduleLabel } from "@/lib/schedule/display";
import { DEFAULT_TRANSITION_MINUTES } from "@/lib/schedule/types";
import {
  formatObservingNightLabel,
  scheduleOutsideWindow,
  sessionWindowFromMission,
} from "@/lib/time/sessionWindow";
import {
  attachConditionLogsToSession,
  insertManualFieldReading,
  latestManualReading,
  listConditionLogsForMission,
  type ManualFieldReadingPayload,
} from "@/lib/supabase/queries/conditionLogs";
import {
  appendMissionEvent,
  attachMissionEventsToSession,
  listMissionEvents,
} from "@/lib/supabase/queries/missionEvents";
import type { ConditionLogRow, MissionEventRow } from "@/lib/schemas";

const PANEL_STYLE = "mission-panel";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function latestFieldReadingEventId(
  events: MissionEventRow[],
): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i]!;
    if (
      ev.kind === "field_reading" ||
      (ev.kind === "correction" && ev.payload?.seeing != null)
    ) {
      return ev.id;
    }
  }
  return null;
}

function MissionDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const id = params.id as string;
  const isFieldMode = useAppStore((s) => s.isFieldMode);
  const fieldModeOptions = useAppStore((s) => s.fieldModeOptions);
  const {
    state: uiState,
    setSelectedTarget,
    setConditions,
    setSoftware,
    recalculate,
    phaseClick,
  } = useMissionUI();
  const {
    getMission,
    updateMission,
    replaceMission,
    deleteMission,
    addMission,
    setActiveMission,
    activeMissionId,
  } = useMissionStore();
  const clearPlan = useDashboardRecommendationStore((s) => s.clearPlan);
  const mission = getMission(id);
  const [simOpen, setSimOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [abortOpen, setAbortOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [abortReason, setAbortReason] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addTargetPickerOpen, setAddTargetPickerOpen] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Site");
  const [siteLat, setSiteLat] = useState<number | null>(null);
  const [siteLon, setSiteLon] = useState<number | null>(null);
  const [siteTimezone, setSiteTimezone] = useState<string | null>(null);
  const [gearLabel, setGearLabel] = useState("Rig");
  const [gearCameraName, setGearCameraName] = useState<string | null>(null);
  const [gearHasGuiding, setGearHasGuiding] = useState(false);
  const [fetchingMission, setFetchingMission] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [conditionLogs, setConditionLogs] = useState<ConditionLogRow[]>([]);
  const [missionEvents, setMissionEvents] = useState<MissionEventRow[]>([]);
  const [committingReading, setCommittingReading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  /** True once this mission id is known to exist in `missions` (not just a client UUID). */
  const missionRowReadyRef = useRef(false);

  useEffect(() => {
    let frame: number;
    if (!mounted) {
      frame = requestAnimationFrame(() => setMounted(true));
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mounted]);

  useEffect(() => {
    missionRowReadyRef.current = false;
  }, [id]);

  /** Phase D.1: load from DB when store has no entry (refresh / new device). */
  useEffect(() => {
    if (!mounted || mission) {
      setFetchingMission(false);
      return;
    }
    let cancelled = false;
    async function loadFromDb() {
      setFetchingMission(true);
      setFetchError(null);
      try {
        const row = await getMissionWithTargets(
          getSupabaseBrowserClient(),
          id,
        );
        if (cancelled) return;
        if (row) {
          missionRowReadyRef.current = true;
          const existing = useMissionStore.getState().getMission(id);
          if (existing) replaceMission(id, row);
          else addMission(row);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(
            e instanceof Error ? e.message : "Failed to load mission",
          );
        }
      } finally {
        if (!cancelled) setFetchingMission(false);
      }
    }
    void loadFromDb();
    return () => {
      cancelled = true;
    };
  }, [mounted, mission, id, addMission, replaceMission]);

  /**
   * Observing events / condition_logs require a real `missions` row.
   * Create Mission only stores a client UUID until Setup (or first event write).
   */
  const ensureMissionRowForEvents = async (): Promise<string | null> => {
    const latest = getMission(id);
    if (!latest) return null;

    if (missionRowReadyRef.current && isUuid(latest.id)) {
      return latest.id;
    }

    try {
      const client = getSupabaseBrowserClient();
      // Cheap existence check — avoids rewriting targets on every stamp.
      if (isUuid(latest.id)) {
        const existing = await getMissionWithTargets(client, latest.id);
        if (existing) {
          missionRowReadyRef.current = true;
          return existing.id;
        }
      }

      const persisted = await persistMissionToDb(client, {
        ...latest,
        phase: latest.phase ?? "planning",
        status: latest.status === "draft" ? "ready" : latest.status,
      });
      if (persisted.id !== id) {
        replaceMission(id, persisted);
        router.replace(`/missions/${persisted.id}`);
      }
      missionRowReadyRef.current = true;
      return persisted.id;
    } catch (e) {
      toast(
        e instanceof Error
          ? e.message
          : "Could not save mission before logging",
        "error",
      );
      return null;
    }
  };

  const attachedSessionId = (): string | undefined => {
    for (let i = missionEvents.length - 1; i >= 0; i--) {
      const sid = missionEvents[i]?.session_id;
      if (sid) return sid;
    }
    return undefined;
  };

  useEffect(() => {
    if (!mission) return;
    let cancelled = false;
    async function loadLabels() {
      try {
        const client = getSupabaseBrowserClient();
        const [locations, gear] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        const loc = locations.find((l) => l.id === mission!.locationId);
        setLocationLabel(loc?.name ?? "Site");
        setSiteLat(loc?.lat ?? null);
        setSiteLon(loc?.lon ?? null);
        setSiteTimezone(loc?.timezone ?? null);
        const g = gear.find((row) => row.id === mission!.gearId);
        setGearLabel(g?.name ?? "Rig");
        setGearCameraName(g?.camera_name ?? null);
        setGearHasGuiding(!!g?.guiding);
      } catch {
        /* labels are display-only */
      }
    }
    void loadLabels();
    return () => {
      cancelled = true;
    };
  }, [mission?.locationId, mission?.gearId, mission]);

  /** Load durable condition logs + observing events for this mission. */
  useEffect(() => {
    if (!mission || !isUuid(mission.id)) {
      setConditionLogs([]);
      setMissionEvents([]);
      return;
    }
    let cancelled = false;
    async function loadObservingHistory() {
      try {
        const client = getSupabaseBrowserClient();
        const [logs, events] = await Promise.all([
          listConditionLogsForMission(client, mission!.id),
          listMissionEvents(client, mission!.id),
        ]);
        if (cancelled) return;
        setConditionLogs(logs);
        setMissionEvents(events);
        if (logs.length > 0 || events.length > 0) {
          missionRowReadyRef.current = true;
        }

        const noteLogFromEvents = events
          .filter((e) => e.kind === "note")
          .map((e) => ({
            at: e.recorded_at,
            text:
              typeof e.payload.text === "string"
                ? e.payload.text
                : typeof e.payload.quick_event === "string"
                  ? `[Event] ${String(e.payload.quick_event)}`
                  : e.summary,
          }));
        if (noteLogFromEvents.length > 0) {
          const current = useMissionStore.getState().getMission(mission!.id);
          if (current) {
            updateMission(mission!.id, { noteLog: noteLogFromEvents });
          }
        }

        const latestReading = latestManualReading(logs);
        if (latestReading?.payload) {
          const p = latestReading.payload;
          setConditions({
            seeing:
              typeof p.seeing === "number"
                ? p.seeing
                : Number(p.seeing) || uiState.conditions.seeing,
            transparency:
              typeof p.transparency === "number"
                ? p.transparency
                : Number(p.transparency) || uiState.conditions.transparency,
            clouds:
              typeof p.cloudsPct === "number"
                ? p.cloudsPct
                : Number(p.cloudsPct) || uiState.conditions.clouds,
            wind:
              p.wind === "low" || p.wind === "med" || p.wind === "high"
                ? p.wind
                : uiState.conditions.wind,
            moonGlare:
              typeof p.moonGlare === "boolean"
                ? p.moonGlare
                : uiState.conditions.moonGlare,
          });
        }
      } catch {
        if (!cancelled) {
          /* keep prior; toast only on write failures */
        }
      }
    }
    void loadObservingHistory();
    return () => {
      cancelled = true;
    };
  }, [mission?.id]);

  /** Deep-link from dashboard "Log Results" → logging phase (no separate /log route). */
  useEffect(() => {
    if (searchParams.get("phase") !== "logging") return;
    const m = getMission(id);
    if (!m || m.logLocked) return;
    if (m.phase === "logging") return;
    updateMission(id, { phase: "logging" });
  }, [searchParams, id, getMission, updateMission]);

  const availableTargetsForAdd = useMemo(
    () => getAvailableTargetsForAdd(mission?.targets ?? []),
    [mission?.targets],
  );

  const noteLog =
    mission?.noteLog ??
    (mission?.notes ? [{ text: mission.notes, at: mission.createdAt }] : []);

  const status = getMissionStatus(mission ?? null);
  const isPlanning = status === "PLANNING" || status === "SETUP";
  const isCapturing = status === "CAPTURING";
  const isLoggingStatus = status === "LOGGING";
  const isTerminal =
    mission?.status === "completed" ||
    (mission?.status === "aborted" && mission?.phase !== "logging") ||
    mission?.status === "cancelled";
  const isReadOnlySession =
    !!mission?.logLocked || isTerminal || mission?.status === "completed";

  // Precomputed mock intelligence values (currently unused on this page)
  const [sessionNow, setSessionNow] = useState(() => new Date());
  useEffect(() => {
    const timerId = setInterval(() => setSessionNow(new Date()), 60_000);
    return () => clearInterval(timerId);
  }, []);

  const sessionStart = useMemo(() => {
    const startedAt =
      (mission as { startedAt?: string } | null)?.startedAt ??
      mission?.dateTime;
    return new Date(startedAt ?? new Date().toISOString());
  }, [mission]);
  const elapsedMs = Math.max(0, sessionNow.getTime() - sessionStart.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMinutesRemainder = elapsedMinutes % 60;
  const sessionElapsedLabel =
    elapsedHours > 0
      ? `Session: ${elapsedHours}h ${elapsedMinutesRemainder}m`
      : `Session: ${elapsedMinutesRemainder}m`;

  if (!mounted || fetchingMission) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-zinc-500 text-sm">
          Loading mission…
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">
          {fetchError ?? "Mission not found"}
        </p>
        <Link href="/missions">
          <Button variant="link" className="mt-2 text-indigo-400">
            Back to missions
          </Button>
        </Link>
      </div>
    );
  }
  if (isTerminal) {
    return null;
  }

  const isActive = activeMissionId === mission.id;
  const missionPhase = (mission.phase ??
    phaseFromStatus(mission.status)) as MissionPhase;
  const activePhase: ActivePhase =
    missionPhase === "planning" ||
    missionPhase === "setup" ||
    missionPhase === "capturing" ||
    missionPhase === "logging"
      ? missionPhase
      : "planning";
  const firstTargetId = mission.targets[0]?.targetId;
  const currentTargetId = mission.currentTargetId ?? firstTargetId;
  const currentTarget =
    mission.targets.find((t) => t.targetId === currentTargetId) ??
    mission.targets[0];
  const selectedTarget = uiState.selectedTargetId
    ? (mission.targets.find((t) => t.targetId === uiState.selectedTargetId) ??
      null)
    : (currentTarget ?? null);

  const missionSessionWindow = sessionWindowFromMission({
    dateTime: mission.dateTime,
    sessionEndAt: mission.sessionEndAt,
  });
  const scheduleNeedsReview = scheduleOutsideWindow(
    mission.targets,
    missionSessionWindow,
  );
  const observingNightLabel = formatObservingNightLabel({
    start: missionSessionWindow.start,
    end: missionSessionWindow.end,
    siteTimezone,
  });

  const currentIndex = mission.targets.findIndex(
    (t) => t.targetId === currentTargetId,
  );
  const nextTarget =
    currentIndex >= 0 && currentIndex + 1 < mission.targets.length
      ? mission.targets[currentIndex + 1]
      : (mission.targets[1] ?? null);

  let nextTargetLabel: string | null = null;
  if (nextTarget) {
    const planned = nextTarget.scheduledStartAt
      ? targetScheduleLabel(nextTarget)
      : `${nextTarget.plannedWindowStart}–${nextTarget.plannedWindowEnd}`;
    nextTargetLabel = `Next: ${nextTarget.targetName} · Planned ${planned}`;
  }

  const pushMissionEvent = async (
    missionId: string,
    input: {
      kind: MissionEventKind;
      source: "user" | "system";
      summary: string;
      payload: Record<string, unknown>;
    },
  ) => {
    try {
      const client = getSupabaseBrowserClient();
      const ev = await appendMissionEvent(client, {
        mission_id: missionId,
        session_id: attachedSessionId(),
        recorded_at: new Date().toISOString(),
        kind: input.kind,
        source: input.source,
        summary: input.summary,
        payload: input.payload,
        client_event_id: crypto.randomUUID(),
      });
      setMissionEvents((prev) =>
        prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
      );
    } catch {
      /* timeline stamp is secondary to phase persist */
    }
  };

  const handlePhaseClick = async (
    phase: ActivePhase,
    options?: {
      planEvent?: "plan_snapshot" | "mission_started";
      planReason?: string;
    },
  ) => {
    if (isReadOnlySession) return;
    const before = getMission(id);
    if (!before) return;

    const prevPhase = before.phase ?? phaseFromStatus(before.status);
    const started =
      before.status === "in_progress" ||
      prevPhase === "capturing" ||
      prevPhase === "logging" ||
      options?.planEvent === "mission_started";

    if (phase === "capturing" && !started) {
      toast("Start the mission from Setup to enter Capturing", "default");
      return;
    }
    if (
      phase === "logging" &&
      prevPhase !== "logging" &&
      activePhase !== "logging"
    ) {
      toast("End the session to open Logging", "default");
      return;
    }
    if (prevPhase === phase && !options?.planEvent) return;

    const status: Mission["status"] =
      before.status === "in_progress" ||
      phase === "capturing" ||
      phase === "logging" ||
      options?.planEvent === "mission_started"
        ? "in_progress"
        : before.status === "draft"
          ? "ready"
          : before.status;

    updateMission(id, {
      phase,
      status,
      ...(options?.planEvent === "mission_started" && firstTargetId
        ? { currentTargetId: before.currentTargetId ?? firstTargetId }
        : {}),
    });
    phaseClick(phase, firstTargetId);

    // Persist once the mission has left pure draft planning, or when going to Setup+.
    const shouldPersist =
      missionRowReadyRef.current ||
      before.status !== "draft" ||
      phase === "setup" ||
      phase === "capturing" ||
      phase === "logging" ||
      !!options?.planEvent;

    if (!shouldPersist) return;

    try {
      const client = getSupabaseBrowserClient();
      const latest = getMission(id);
      if (!latest) return;
      const persisted = await persistMissionToDb(client, {
        ...latest,
        phase,
        status,
      });
      if (persisted.id !== id) {
        replaceMission(id, persisted);
        router.replace(`/missions/${persisted.id}`);
      } else if (
        persisted.locationId !== latest.locationId ||
        persisted.gearId !== latest.gearId
      ) {
        updateMission(id, {
          locationId: persisted.locationId,
          gearId: persisted.gearId,
        });
      }
      missionRowReadyRef.current = true;

      if (prevPhase !== phase && isUuid(persisted.id)) {
        await pushMissionEvent(persisted.id, {
          kind: "phase_change",
          source: "user",
          summary: `Phase → ${phase}`,
          payload: { from: prevPhase, to: phase },
        });
      }

      if (options?.planEvent && isUuid(persisted.id)) {
        const snap = buildPlanSnapshot(
          persisted,
          options.planReason ??
            (options.planEvent === "mission_started"
              ? "Mission started"
              : "Plan snapshot"),
        );
        await pushMissionEvent(persisted.id, {
          kind: options.planEvent,
          source: "system",
          summary: snap.summary,
          payload: snap.payload as unknown as Record<string, unknown>,
        });
      }
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Failed to save mission",
        "error",
      );
    }
  };

  const handleStart = async () => {
    setActiveMission(id);
    await handlePhaseClick("capturing", {
      planEvent: "mission_started",
      planReason: "Mission started",
    });
    toast("Mission started — plan saved to observing log");
  };
  const handleSetActive = () => {
    setActiveMission(id);
    toast("Active mission set");
  };

  const handleClearPlan = () => {
    updateMission(id, { targets: [] });
    setSelectedTarget(null);
    toast("Plan cleared");
  };
  const handleCancelMission = async () => {
    const reason = cancelReason.trim() || "No reason given";
    setCancelOpen(false);
    setCancelReason("");

    if (activePhase === "planning") {
      deleteMission(id);
      if (activeMissionId === id) setActiveMission(null);
      clearPlan();
      toast("Mission discarded");
      router.push("/dashboard");
      return;
    }
    try {
      await cancelMissionInDb(getSupabaseBrowserClient(), id, reason);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Failed to cancel mission in database",
        "error",
      );
      return;
    }
    deleteMission(id);
    if (activeMissionId === id) setActiveMission(null);
    toast("Mission cancelled");
    clearPlan();
    router.push("/dashboard");
  };
  const handleAbortMission = () => {
    const reason = abortReason.trim() || "Aborted in field";
    const entry = { text: `[Aborted] ${reason}`, at: new Date().toISOString() };
    updateMission(id, {
      status: "aborted",
      phase: "logging",
      cancelledReason: reason,
      noteLog: [...noteLog, entry],
    });
    if (activeMissionId === id) setActiveMission(null);
    setAbortOpen(false);
    setAbortReason("");
    clearPlan();
    toast("Mission aborted — log results to save partial data");
  };

  const handleSaveLog = async (payload: SessionLogPayload) => {
    const latest = getMission(id);
    if (!latest) return;
    if (latest.logLocked) {
      toast("Log already saved for this mission", "error");
      return;
    }
    setSavingLog(true);
    try {
      const client = getSupabaseBrowserClient();
      const completed: Mission = {
        ...latest,
        status: "completed",
        phase: "completed",
        logLocked: true,
        targets: latest.targets.map((t) => {
          const logged = payload.targets.find((x) => x.catalogId === t.targetId);
          if (!logged) return t;
          return {
            ...t,
            result: logged.result ?? t.result,
            frames:
              logged.framesCaptured != null
                ? logged.framesCaptured
                : t.frames,
            subLength:
              logged.exposureSeconds != null
                ? logged.exposureSeconds
                : t.subLength,
            isoGain:
              logged.iso != null
                ? String(logged.iso)
                : logged.gain != null
                  ? String(logged.gain)
                  : t.isoGain,
            notes: logged.notes || t.notes,
            actualStartAt: logged.actualStartAt ?? t.actualStartAt ?? null,
            actualEndAt: logged.actualEndAt ?? t.actualEndAt ?? null,
          };
        }),
      };

      const actualStarts = completed.targets
        .map((t) => t.actualStartAt)
        .filter((v): v is string => Boolean(v))
        .map((v) => new Date(v).getTime())
        .filter((n) => !Number.isNaN(n));
      const actualEnds = completed.targets
        .map((t) => t.actualEndAt)
        .filter((v): v is string => Boolean(v))
        .map((v) => new Date(v).getTime())
        .filter((n) => !Number.isNaN(n));
      const sessionStartedAt =
        actualStarts.length > 0
          ? new Date(Math.min(...actualStarts)).toISOString()
          : new Date(completed.dateTime).toISOString();
      const sessionEndedAt =
        actualEnds.length > 0
          ? new Date(Math.max(...actualEnds)).toISOString()
          : new Date().toISOString();

      const persisted = await persistMissionToDb(client, completed);
      missionRowReadyRef.current = true;
      const sessionTargets = payload.targets
        .filter(
          (t) =>
            t.exposureSeconds != null &&
            t.exposureSeconds > 0 &&
            t.result !== "skipped",
        )
        .map((t) => ({
          catalog_id: t.catalogId,
          target_name: t.targetName,
          frames_captured: t.framesCaptured ?? 0,
          exposure_seconds: t.exposureSeconds!,
          iso: t.iso ?? undefined,
          gain: t.gain ?? undefined,
          notes: t.notes || undefined,
          actual_start_at: t.actualStartAt,
          actual_end_at: t.actualEndAt,
          result: t.result,
          planned_filter: t.plannedFilter ?? undefined,
          planned_sub_length_seconds: t.plannedSubLengthSeconds ?? undefined,
          planned_iso: t.plannedIso ?? undefined,
          planned_gain: t.plannedGain ?? undefined,
          planned_integration_minutes:
            t.plannedIntegrationMinutes ?? undefined,
          planned_frames: t.plannedFrames ?? undefined,
        }));

      const session = await upsertSessionFromLog(
        client,
        {
          mission_id: persisted.id,
          location_id: persisted.locationId,
          started_at: sessionStartedAt,
          ended_at: sessionEndedAt,
          outcome_score: payload.outcomeScore,
          what_i_learned: payload.whatILearned || undefined,
        },
        sessionTargets,
      );

      await attachMissionEventsToSession(client, persisted.id, session.id);
      await attachConditionLogsToSession(client, persisted.id, session.id);
      const saveEv = await appendMissionEvent(client, {
        mission_id: persisted.id,
        session_id: session.id,
        recorded_at: new Date().toISOString(),
        kind: "save_log",
        source: "user",
        summary: "Session log saved",
        payload: {
          outcome_score: payload.outcomeScore,
          session_id: session.id,
        },
        client_event_id: crypto.randomUUID(),
      });
      setMissionEvents((prev) => {
        const attached = prev.map((e) =>
          e.session_id ? e : { ...e, session_id: session.id },
        );
        return attached.some((e) => e.id === saveEv.id)
          ? attached
          : [...attached, saveEv];
      });
      setConditionLogs((prev) =>
        prev.map((row) =>
          row.session_id ? row : { ...row, session_id: session.id },
        ),
      );

      replaceMission(id, {
        ...persisted,
        status: "completed",
        phase: "completed",
        logLocked: true,
        targets: completed.targets,
      });
      setActiveMission(null);
      clearPlan();
      toast("Session log saved", "success");
      router.push(`/sessions/${session.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save session", "error");
    } finally {
      setSavingLog(false);
    }
  };

  const handleAddNoteFromView = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry = { text: trimmed, at: new Date().toISOString() };
    updateMission(id, {
      noteLog: [...noteLog, entry],
      notes: trimmed,
    });
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: entry.at,
          kind: "note",
          source: "user",
          summary: trimmed.slice(0, 120),
          payload: { text: trimmed },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
        toast("Note saved");
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Note not saved to observing log",
          "error",
        );
      }
    })();
  };

  const handleChecklistToggle = (item: ChecklistTogglePayload) => {
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const summary = item.checked
          ? `Checklist · ${item.label}`
          : `Checklist unchecked · ${item.label}`;
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: new Date().toISOString(),
          kind: "checklist_item",
          source: "user",
          summary,
          payload: {
            sectionId: item.sectionId,
            stepId: item.stepId,
            label: item.label,
            sectionLabel: item.sectionLabel,
            checked: item.checked,
          },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Checklist not saved to log",
          "error",
        );
      }
    })();
  };

  const handleQuickEventLog = (label: string) => {
    const entry = { text: `[Event] ${label}`, at: new Date().toISOString() };
    updateMission(id, {
      noteLog: [...noteLog, entry],
    });
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: entry.at,
          kind: "note",
          source: "user",
          summary: label,
          payload: { quick_event: label },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
        toast("Event logged");
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Event not saved",
          "error",
        );
      }
    })();
  };
  const handleRecalculate = () => {
    recalculate();
    toast("Plan updated");
  };

  const handleCommitReading = async (reading: ManualFieldReadingPayload) => {
    const mid = await ensureMissionRowForEvents();
    if (!mid) {
      setReadingError("Could not save mission before stamping reading.");
      return;
    }
    setCommittingReading(true);
    setReadingError(null);
    const clientEventId = crypto.randomUUID();
    const isCorrection = Boolean(reading.correctsEventId);
    try {
      const client = getSupabaseBrowserClient();
      const log = await insertManualFieldReading(client, mid, reading);
      const ev = await appendMissionEvent(client, {
        mission_id: mid,
        session_id: attachedSessionId(),
        recorded_at: log.recorded_at,
        kind: isCorrection ? "correction" : "field_reading",
        source: "manual",
        summary: isCorrection
          ? `Corrected field reading · seeing ${reading.seeing} · clouds ${reading.cloudsPct}%`
          : `Field reading · seeing ${reading.seeing} · clouds ${reading.cloudsPct}%`,
        payload: {
          seeing: reading.seeing,
          transparency: reading.transparency,
          cloudsPct: reading.cloudsPct,
          wind: reading.wind,
          moonGlare: reading.moonGlare,
          notes: reading.notes ?? "",
          condition_log_id: log.id,
        },
        corrects_event_id: reading.correctsEventId,
        client_event_id: clientEventId,
      });
      setConditionLogs((prev) =>
        prev.some((r) => r.id === log.id) ? prev : [...prev, log],
      );
      setMissionEvents((prev) =>
        prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
      );
      toast(isCorrection ? "Correction saved" : "Field reading saved", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Not saved";
      setReadingError(msg);
      toast(msg, "error");
    } finally {
      setCommittingReading(false);
    }
  };

  const handleTargetQueueClick = (t: MissionTarget) => {
    setSelectedTarget(t.targetId);
    updateMission(id, { currentTargetId: t.targetId });
  };
  const handleFocusTarget = (t: MissionTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget(t.targetId);
    updateMission(id, { currentTargetId: t.targetId });
  };
  const handleRemoveTarget = (targetId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const removed = mission.targets.find((t) => t.targetId === targetId);
    const next = mission.targets.filter((t) => t.targetId !== targetId);
    updateMission(id, { targets: next });
    if (uiState.selectedTargetId === targetId)
      setSelectedTarget(next[0]?.targetId ?? null);
    toast("Target removed");
    void (async () => {
      if (!removed) return;
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: new Date().toISOString(),
          kind: "target_removed",
          source: "user",
          catalog_id: targetId,
          summary: `Removed ${removed.targetName}`,
          payload: { catalog_id: targetId },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
      } catch {
        /* non-blocking */
      }
    })();
  };
  const handleMoveTarget = (index: number, direction: "up" | "down") => {
    const targets = [...mission.targets];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= targets.length) return;
    [targets[index], targets[newIndex]] = [targets[newIndex], targets[index]];
    // Re-sequence after reorder
    const resequenced = targets.map((t, i) => ({
      ...t,
      sequenceIndex: i + 1,
      roleLabel: t.isFallback ? "Fallback" : `SEQ ${i + 1}`,
    }));
    updateMission(id, { targets: resequenced });
    toast("Queue reordered");
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: new Date().toISOString(),
          kind: "target_reordered",
          source: "user",
          summary: "Target queue reordered",
          payload: {
            order: resequenced.map((t) => t.targetId),
          },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
      } catch {
        /* non-blocking */
      }
    })();
  };
  const handleCaptureToggle = (targetId: string) => {
    updateMission(id, {
      targets: mission.targets.map((t) =>
        t.targetId === targetId ? { ...t, captured: !t.captured } : t,
      ),
    });
  };
  const handlePatchTarget = (targetId: string, patch: Partial<MissionTarget>) => {
    if (!mission || mission.logLocked) return;
    const targets = mission.targets.map((t) =>
      t.targetId === targetId ? { ...t, ...patch } : t,
    );
    updateMission(id, { targets });
    const touchesActuals =
      "actualStartAt" in patch ||
      "actualEndAt" in patch ||
      "frames" in patch ||
      "subLength" in patch ||
      "notes" in patch;
    const touchesSchedule =
      "scheduledStartAt" in patch ||
      "scheduledEndAt" in patch ||
      "transitionMinutes" in patch;
    const touchesCapturePlan =
      "proposedFilter" in patch ||
      "proposedSubLengthSeconds" in patch ||
      "proposedIso" in patch ||
      "proposedGain" in patch ||
      "proposedIntegrationMinutes" in patch;
    if (!touchesActuals && !touchesSchedule && !touchesCapturePlan) return;
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const t = targets.find((x) => x.targetId === targetId);
        const kind = touchesSchedule
          ? "schedule_changed"
          : touchesCapturePlan
            ? "capture_plan_updated"
            : "actuals_updated";
        const summary = touchesSchedule
          ? `Schedule updated · ${t?.targetName ?? targetId}`
          : touchesCapturePlan
            ? `Capture plan updated · ${t?.targetName ?? targetId}`
            : `Actuals updated · ${t?.targetName ?? targetId}`;
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: new Date().toISOString(),
          kind,
          source: "user",
          catalog_id: targetId,
          summary,
          payload: { ...patch },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Update not saved to observing log",
          "error",
        );
      }
    })();
  };

  const handleMarkTargetComplete = () => {
    if (!currentTargetId || !mission) return;
    const idx = mission.targets.findIndex(
      (t) => t.targetId === currentTargetId,
    );
    if (idx === -1) return;
    const completedTarget = mission.targets[idx]!;
    const updatedTargets = mission.targets.map((t, i) =>
      i === idx ? { ...t, captured: true } : t,
    );
    const next =
      idx + 1 < updatedTargets.length ? updatedTargets[idx + 1] : null;
    updateMission(id, {
      targets: updatedTargets,
      currentTargetId: next?.targetId ?? currentTargetId,
    });
    // Persist actuals already entered (Setup+ SoT) — never invent frames
    const phase = mission.phase ?? "planning";
    if (phase === "setup" || phase === "capturing" || phase === "logging") {
      void (async () => {
        try {
          const client = getSupabaseBrowserClient();
          const latest = getMission(id);
          if (!latest) return;
          const persisted = await persistMissionToDb(client, {
            ...latest,
            targets: updatedTargets,
            currentTargetId: next?.targetId ?? currentTargetId,
            transitionMinutes:
              latest.transitionMinutes ?? DEFAULT_TRANSITION_MINUTES,
          });
          replaceMission(id, persisted);
          missionRowReadyRef.current = true;
          const ev = await appendMissionEvent(client, {
            mission_id: persisted.id,
            session_id: attachedSessionId(),
            recorded_at: new Date().toISOString(),
            kind: "target_completed",
            source: "user",
            catalog_id: completedTarget.targetId,
            summary: `Completed ${completedTarget.targetName}`,
            payload: { catalog_id: completedTarget.targetId },
            client_event_id: crypto.randomUUID(),
          });
          setMissionEvents((prev) =>
            prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
          );
        } catch (e) {
          toast(
            e instanceof Error ? e.message : "Complete not fully saved",
            "error",
          );
        }
      })();
    }
    if (next) {
      setSelectedTarget(next.targetId);
      toast("Target marked complete — advanced to next");
    } else {
      toast("Target marked complete — no further targets in queue");
    }
  };
  const handleAddTarget = (opt: {
    targetId: string;
    targetName: string;
    targetType: string;
    score: number;
    bestWindowStart: string;
    bestWindowEnd: string;
  }) => {
    const seq = mission.targets.length + 1;
    const newTarget: MissionTarget = {
      targetId: opt.targetId,
      targetName: opt.targetName,
      targetType: opt.targetType as MissionTarget["targetType"],
      plannedWindowStart: opt.bestWindowStart,
      plannedWindowEnd: opt.bestWindowEnd,
      score: opt.score,
      sequenceIndex: seq,
      roleLabel: `SEQ ${seq}`,
      isFallback: false,
    };
    updateMission(id, { targets: [...mission.targets, newTarget] });
    setSelectedTarget(opt.targetId);
    setAddTargetPickerOpen(false);
    toast("Target added");
    void (async () => {
      const mid = await ensureMissionRowForEvents();
      if (!mid) return;
      try {
        const client = getSupabaseBrowserClient();
        const ev = await appendMissionEvent(client, {
          mission_id: mid,
          session_id: attachedSessionId(),
          recorded_at: new Date().toISOString(),
          kind: "target_added",
          source: "user",
          catalog_id: opt.targetId,
          summary: `Added ${opt.targetName}`,
          payload: { catalog_id: opt.targetId },
          client_event_id: crypto.randomUUID(),
        });
        setMissionEvents((prev) =>
          prev.some((e) => e.id === ev.id) ? prev : [...prev, ev],
        );
      } catch {
        /* non-blocking */
      }
    })();
  };

  const isPlanningStatus = status === "PLANNING";
  const isSetupStatus = status === "SETUP";
  const isOffline = uiState.connectivity.status !== "online";

  return (
    <div
      className={cn(
        "relative min-h-full",
        fieldModeOptions.reduceMotion && "motion-reduce",
      )}
    >
      {isFieldMode && fieldModeOptions.dimLevel > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-[100] bg-black"
          style={{ opacity: (fieldModeOptions.dimLevel / 100) * 0.5 }}
          aria-hidden
        />
      )}

      <div className="relative z-10 w-full">
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* ========== HEADER ========== */}
          <header className="mission-page-header">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href="/missions"
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline"
                >
                  ← Missions
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline"
                >
                  Tonight
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      value={mission.name}
                      onChange={(e) =>
                        updateMission(id, { name: e.target.value })
                      }
                      onBlur={() => setIsEditingTitle(false)}
                      className="page-heading bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="page-heading">
                        {mission.name}
                      </h1>
                      {!isReadOnlySession && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTitle(true);
                            requestAnimationFrame(() => {
                              titleInputRef.current?.focus();
                            });
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800/60 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                          aria-label="Edit mission title"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                  <PhaseTabs
                    activePhase={activePhase}
                    loggingLocked={!!mission.logLocked}
                    navigationLocked={isReadOnlySession}
                    canOpenCapturing={
                      mission.status === "in_progress" ||
                      activePhase === "capturing" ||
                      activePhase === "logging"
                    }
                    canOpenLogging={
                      activePhase === "logging" ||
                      mission.phase === "logging"
                    }
                    onPhaseSelect={(phase) => {
                      void handlePhaseClick(phase);
                    }}
                  />
                  {isCapturing && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded border border-rose-500/50 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300"
                      title="Mission is live — capturing in progress"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
                      </span>
                      Live
                    </span>
                  )}
                  {mission.status === "in_progress" &&
                    !isCapturing &&
                    !isLoggingStatus && (
                      <span className="inline-flex items-center rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                        In progress
                      </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* PLANNING STATE */}
                  {isPlanning && (
                    <>
                      {activePhase === "planning" && (
                        <Button
                          variant="cta"
                          size="sm"
                          onClick={() =>
                            void handlePhaseClick("setup", {
                              planEvent: "plan_snapshot",
                              planReason: "Planning complete",
                            })
                          }
                          className="mission-page-cta"
                        >
                          Planning Complete
                        </Button>
                      )}
                      {activePhase === "setup" &&
                        mission.status === "ready" && (
                          <Button
                            variant="cta"
                            size="sm"
                            onClick={handleStart}
                            className="mission-page-cta"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start Mission
                          </Button>
                        )}
                      {activePhase === "setup" &&
                        mission.status === "in_progress" && (
                          <Button
                            variant="cta"
                            size="sm"
                            onClick={() => void handlePhaseClick("capturing")}
                            className="mission-page-cta"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume Capturing
                          </Button>
                        )}
                      {activePhase === "planning" &&
                        mission.status === "in_progress" && (
                          <Button
                            variant="cta"
                            size="sm"
                            onClick={() => void handlePhaseClick("capturing")}
                            className="mission-page-cta"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume Capturing
                          </Button>
                        )}
                      {mission.status !== "in_progress" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleClearPlan}
                          className="border-zinc-800/60 bg-zinc-900/40"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Reset Plan
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCancelOpen(true)}
                        className="text-amber-400 hover:text-amber-300 hover:border-amber-500/40"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel Mission
                      </Button>
                    </>
                  )}

                  {/* CAPTURING STATE */}
                  {isCapturing && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAbortOpen(true)}
                        className="text-rose-400 hover:text-rose-300 hover:border-rose-500/40"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Abort Mission
                      </Button>
                      <Button
                        variant="cta"
                        size="sm"
                        onClick={() => {
                          updateMission(id, {
                            status: "in_progress",
                            phase: "logging",
                            logLocked: false,
                          });
                          if (activeMissionId === id)
                            toast("Session ended — log results below");
                        }}
                        className="mission-page-cta"
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        End Session
                      </Button>
                    </>
                  )}

                  {/* LOGGING STATE — Save Log lives in LoggingView (needs form payload) */}
                  {isLoggingStatus && (
                    <span className="text-xs text-zinc-500">
                      Complete the log form below to save
                    </span>
                  )}

                  {/* No header actions in logging/terminal on mission page */}
                  {!isActive &&
                    !isTerminal &&
                    activePhase !== "planning" &&
                    !isLoggingStatus && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSetActive}
                        className="border-zinc-800/60 bg-zinc-900/40"
                      >
                        Set Active
                      </Button>
                    )}
                </div>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/45 tracking-wide">
                {locationLabel} · {gearLabel} · {observingNightLabel}
                <span className="text-zinc-500">· {sessionElapsedLabel}</span>
                {isCapturing && (
                  <span className="font-semibold uppercase tracking-wider text-rose-400">
                    · Live session
                  </span>
                )}
                <span className="text-emerald-400/90">
                  {uiState.connectivity.status === "online"
                    ? uiState.connectivity.isCached
                      ? "Offline ready"
                      : "Online"
                    : "Offline"}
                </span>
              </p>
            </div>
          </header>

          {scheduleNeedsReview && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-amber-200">
                Accepted schedule times fall outside the mission session window.
                Review and accept a new schedule — times are not changed
                automatically.
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  void handlePhaseClick("planning");
                  toast(
                    "Open Night Schedule from Planning to review segments",
                    "default",
                  );
                }}
              >
                Review schedule
              </Button>
            </div>
          )}

          {uiState.planStale && activePhase !== "planning" && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <span className="text-sm text-amber-200">
                Plan may be stale — adjust field conditions below and tap Update
                Mission Plan.
              </span>
            </div>
          )}

          {isPlanningStatus ? (
            <PlanningView
              mission={mission as Mission}
              isReadOnlySession={isReadOnlySession}
              isFieldMode={isFieldMode}
              currentTarget={currentTarget ?? null}
              currentTargetId={currentTargetId ?? null}
              selectedTarget={selectedTarget}
              nextTargetLabel={nextTargetLabel}
              hasGuiding={gearHasGuiding}
              selectedTargetId={uiState.selectedTargetId ?? null}
              onSimulateNight={() => setSimOpen(true)}
              onAddNote={handleAddNoteFromView}
              onQuickEvent={handleQuickEventLog}
              onTargetQueueClick={handleTargetQueueClick}
              onFocusTarget={handleFocusTarget}
              onMoveTarget={handleMoveTarget}
              onRemoveTarget={handleRemoveTarget}
              onCaptureToggle={handleCaptureToggle}
              onMakePrimary={(t) => {
                updateMission(id, { currentTargetId: t.targetId });
                setSelectedTarget(t.targetId);
                toast("Current focus set");
              }}
              canEditTargets={!isReadOnlySession}
              onOpenAddTarget={() => setAddTargetPickerOpen(true)}
              onPatchTarget={handlePatchTarget}
              cameraName={gearCameraName}
              lat={siteLat}
              lon={siteLon}
              siteTimezone={siteTimezone}
              missionEvents={missionEvents}
            />
          ) : isSetupStatus ? (
            <SetupView
              isReadOnlySession={isReadOnlySession}
              onAddNote={handleAddNoteFromView}
              onQuickEvent={handleQuickEventLog}
              onChecklistToggle={handleChecklistToggle}
              onStartMission={handleStart}
              onCancelMission={() => setCancelOpen(true)}
              lat={siteLat}
              lon={siteLon}
              dateTime={mission.dateTime}
              sessionEndAt={mission.sessionEndAt}
              siteTimezone={siteTimezone}
              siteName={locationLabel}
              conditions={uiState.conditions}
              onConditionsChange={(c) =>
                setConditions({ ...uiState.conditions, ...c })
              }
              conditionLogs={conditionLogs}
              missionEvents={missionEvents}
              latestFieldReadingEventId={latestFieldReadingEventId(
                missionEvents,
              )}
              onCommitReading={handleCommitReading}
              committingReading={committingReading}
              readingError={readingError}
            />
          ) : isCapturing ? (
            <CapturingView
              mission={mission as Mission}
              isReadOnlySession={isReadOnlySession}
              isFieldMode={isFieldMode}
              currentTarget={currentTarget ?? null}
              currentTargetId={currentTargetId ?? null}
              selectedTarget={selectedTarget}
              nextTarget={nextTarget}
              nextTargetLabel={nextTargetLabel}
              selectedTargetId={uiState.selectedTargetId ?? null}
              conditions={uiState.conditions}
              conditionLogs={conditionLogs}
              missionEvents={missionEvents}
              latestFieldReadingEventId={latestFieldReadingEventId(
                missionEvents,
              )}
              lat={siteLat}
              lon={siteLon}
              siteTimezone={siteTimezone}
              siteName={locationLabel}
              isOffline={isOffline}
              onAddNote={handleAddNoteFromView}
              onQuickEvent={handleQuickEventLog}
              onMarkTargetComplete={handleMarkTargetComplete}
              onPatchTarget={handlePatchTarget}
              onConditionsChange={(c) =>
                setConditions({ ...uiState.conditions, ...c })
              }
              onCommitReading={handleCommitReading}
              committingReading={committingReading}
              readingError={readingError}
              onUpdatePlan={handleRecalculate}
              cameraName={gearCameraName}
            />
          ) : isLoggingStatus ? (
            <LoggingView
              mission={mission as Mission}
              conditions={uiState.conditions}
              conditionLogs={conditionLogs}
              missionEvents={missionEvents}
              latestFieldReadingEventId={latestFieldReadingEventId(
                missionEvents,
              )}
              lat={siteLat}
              lon={siteLon}
              siteTimezone={siteTimezone}
              siteName={locationLabel}
              onConditionsChange={(c) =>
                setConditions({ ...uiState.conditions, ...c })
              }
              onCommitReading={handleCommitReading}
              committingReading={committingReading}
              readingError={readingError}
              logFormLocked={!!mission.logLocked}
              onSaveLog={handleSaveLog}
              saving={savingLog}
            />
          ) : isTerminal ? null : (
            <>
              {/* ========== INLINE SESSION LOGGING ========== */}
              {activePhase === "logging" && (
                <section className={cn(PANEL_STYLE, "p-4 space-y-4")}>
                  {/* existing logging content preserved */}
                </section>
              )}

              {/* ========== SECOND OPERATIONS ROW ========== */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {(activePhase === "setup" ||
                  activePhase === "capturing" ||
                  activePhase === "logging") && (
                  <div className={cn(PANEL_STYLE, "p-4")}>
                    <h3 className="mission-section-label mb-3">
                      Observing Conditions
                    </h3>
                    {/* existing observing conditions content preserved */}
                  </div>
                )}

                {activePhase === "setup" && (
                  <RigSetupCard
                    software={uiState.software}
                    onSoftwareChange={setSoftware}
                  />
                )}
              </div>

              {activePhase === "setup" && (
                <div className={cn(PANEL_STYLE, "p-4 space-y-4")}>
                  <h2 className="mission-section-label">Sky Verification</h2>
                  {/* existing sky verification content preserved */}
                </div>
              )}

              {/* ========== EXPOSURE PLAN + SESSION SIMULATOR ========== */}
              {activePhase === "planning" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ExposurePlannerCard
                    mission={mission as Mission}
                    target={selectedTarget ?? currentTarget ?? null}
                    lat={siteLat}
                    lon={siteLon}
                    cameraName={gearCameraName}
                    hasGuiding={gearHasGuiding}
                  />
                  <SessionSimulatorCard
                    mission={mission as Mission}
                    lat={siteLat}
                    lon={siteLon}
                    siteTimezone={siteTimezone}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <NightSimulationModal
        isOpen={simOpen}
        onClose={() => setSimOpen(false)}
        targets={mission.targets}
        dateTime={mission.dateTime}
        sessionEndAt={mission.sessionEndAt}
        siteTimezone={siteTimezone}
        lat={siteLat}
        lon={siteLon}
      />
      <AddTargetPicker
        isOpen={addTargetPickerOpen}
        onClose={() => setAddTargetPickerOpen(false)}
        available={availableTargetsForAdd}
        onAdd={handleAddTarget}
      />

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setCancelOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md mission-panel p-4">
            <h3 className="text-base font-semibold text-white mb-2">
              Cancel Mission
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Discard this mission and return to planning. Log a reason (saved
              to notes).
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Changed plans, wrong date..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm min-h-[80px] placeholder:text-zinc-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCancelOpen(false);
                  setCancelReason("");
                }}
                className="border-white/10 bg-white/5"
              >
                Keep Mission
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelMission}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel Mission
              </Button>
            </div>
          </div>
        </div>
      )}

      {abortOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setAbortOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md mission-panel p-4">
            <h3 className="text-base font-semibold text-white mb-2">
              Abort Mission
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Stop the in-field mission and preserve partial state. You can
              still log results.
            </p>
            <textarea
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              placeholder="e.g. Clouds rolled in, equipment issue..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm min-h-[80px] placeholder:text-zinc-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAbortOpen(false);
                  setAbortReason("");
                }}
                className="border-white/10 bg-white/5"
              >
                Keep Going
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleAbortMission}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Abort Mission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MissionDetailPage() {
  return (
    <MissionUIProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Loading mission…
          </div>
        }
      >
        <MissionDashboardContent />
      </Suspense>
    </MissionUIProvider>
  );
}
