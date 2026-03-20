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

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { MissionUIProvider, useMissionUI } from "@/lib/missionUIStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { Play, Trash2, ClipboardList, XCircle, Pencil } from "lucide-react";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { AddTargetPicker } from "@/components/missions/AddTargetPicker";
import { PlanningView } from "@/components/missions/views/PlanningView";
import { SetupView } from "@/components/missions/views/SetupView";
import { CapturingView } from "@/components/missions/views/CapturingView";
import { LoggingView } from "@/components/missions/views/LoggingView";
import { PhaseTabs } from "@/components/missions/PhaseTabs";
import { getAvailableTargetsForAdd } from "@/lib/mock/availableTargetsForMission";
import { EXPOSURE_PLANS_BY_TARGET } from "@/lib/mock/exposurePlans";
import { SESSION_SIMULATIONS_BY_TARGET } from "@/lib/mock/sessionSimulations";
import {
  ExposurePlannerCard,
  SessionSimulatorCard,
} from "@/components/intelligence";
import { RigSetupCard } from "@/components/missions/RigSetupCard";
import { phaseFromStatus } from "@/lib/missions/phase";
import { getMissionStatus } from "@/lib/missionStatus";
import type { MissionPhase, MissionTarget, Mission } from "@/lib/types";
import type { ActivePhase } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";

const PANEL_STYLE = "mission-panel";

function MissionDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const isFieldMode = useAppStore((s) => s.isFieldMode);
  const fieldModeOptions = useAppStore((s) => s.fieldModeOptions);
  const {
    state: uiState,
    setSelectedTarget,
    setConditions,
    resetConditions,
    setSoftware,
    recalculate,
    phaseClick,
  } = useMissionUI();
  const { getMission, updateMission, setActiveMission, activeMissionId } =
    useMissionStore();
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

  useEffect(() => {
    let frame: number;
    if (!mounted) {
      frame = requestAnimationFrame(() => setMounted(true));
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mounted]);

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
    mission?.status === "aborted" ||
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

  const [conditionsLog, setConditionsLog] = useState<
    {
      id: string;
      at: string;
      seeing: number;
      transparency: number;
      clouds: number;
      wind: string;
      moonGlare: boolean;
    }[]
  >([]);

  if (!mounted) {
    return (
      <div className="mission-space-page relative -m-4 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">
          Loading mission…
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="mission-space-page relative -m-4 min-h-screen flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Mission not found</p>
        <Link href="/missions">
          <Button variant="link" className="mt-2 text-violet-400">
            Back to missions
          </Button>
        </Link>
      </div>
    );
  }
  if (isTerminal) {
    return null;
  }

  const loc = MOCK_LOCATIONS.find((l) => l.id === mission.locationId);
  const gear = MOCK_GEAR.find((g) => g.id === mission.gearId);
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
  const primaryTargetName = mission.targets[0]?.targetName ?? null;
  const exposurePlan = firstTargetId
    ? (EXPOSURE_PLANS_BY_TARGET[firstTargetId] ?? null)
    : null;
  const sessionSimulation = firstTargetId
    ? (SESSION_SIMULATIONS_BY_TARGET[firstTargetId] ?? null)
    : null;
  const selectedTarget = uiState.selectedTargetId
    ? (mission.targets.find((t) => t.targetId === uiState.selectedTargetId) ??
      null)
    : (currentTarget ?? null);

  const currentIndex = mission.targets.findIndex(
    (t) => t.targetId === currentTargetId,
  );
  const nextTarget =
    currentIndex >= 0 && currentIndex + 1 < mission.targets.length
      ? mission.targets[currentIndex + 1]
      : (mission.targets[1] ?? null);

  let nextTargetLabel: string | null = null;
  if (nextTarget) {
    // Mocked countdown for demo: fixed label per product copy
    nextTargetLabel = "M42 opens in 47 min";
  }

  const handlePhaseClick = (phase: ActivePhase) => {
    updateMission(id, { phase });
    phaseClick(phase, firstTargetId);
  };

  const handleStart = () => {
    updateMission(id, {
      status: "in_progress",
      phase: "capturing",
      currentTargetId: firstTargetId,
    });
    setActiveMission(id);
    handlePhaseClick("capturing");
    toast("Mission started");
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
  const handleCancelMission = () => {
    const reason = cancelReason.trim() || "No reason given";
    const entry = {
      text: `[Cancelled] ${reason}`,
      at: new Date().toISOString(),
    };
    updateMission(id, {
      status: "cancelled",
      phase: "completed",
      cancelledReason: reason,
      noteLog: [...noteLog, entry],
    });
    if (activeMissionId === id) setActiveMission(null);
    setCancelOpen(false);
    setCancelReason("");
    toast("Mission cancelled");
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
    toast("Mission aborted — log results to save partial data");
  };

  const handleSaveLog = () => {
    updateMission(id, {
      status: "completed",
      phase: "completed",
      logLocked: true,
    });
    setActiveMission(null);
    toast("Session log saved");
    router.push("/dashboard");
  };

  const handleAddNoteFromView = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry = { text: trimmed, at: new Date().toISOString() };
    updateMission(id, {
      noteLog: [...noteLog, entry],
      notes: trimmed,
    });
    toast("Note added");
  };

  const handleQuickEventLog = (label: string) => {
    const entry = { text: `[Event] ${label}`, at: new Date().toISOString() };
    updateMission(id, {
      noteLog: [...noteLog, entry],
    });
    toast("Event logged");
  };
  const handleResetConditions = () => {
    resetConditions();
    toast("Conditions reset");
  };
  const handleRecalculate = () => {
    recalculate();
    toast("Plan updated");
  };
  const handleStampConditions = () => {
    const nowIso = new Date().toISOString();
    setConditionsLog((prev) => [
      ...prev,
      {
        id: `stamp-${prev.length + 1}`,
        at: nowIso,
        seeing: uiState.conditions.seeing,
        transparency: uiState.conditions.transparency,
        clouds: uiState.conditions.clouds,
        wind: uiState.conditions.wind,
        moonGlare: uiState.conditions.moonGlare,
      },
    ]);
    toast("Conditions stamped");
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
    const next = mission.targets.filter((t) => t.targetId !== targetId);
    updateMission(id, { targets: next });
    if (uiState.selectedTargetId === targetId)
      setSelectedTarget(next[0]?.targetId ?? null);
    toast("Target removed");
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
  };
  const handleCaptureToggle = (targetId: string) => {
    updateMission(id, {
      targets: mission.targets.map((t) =>
        t.targetId === targetId ? { ...t, captured: !t.captured } : t,
      ),
    });
  };
  const handleMarkTargetComplete = () => {
    if (!currentTargetId) return;
    const idx = mission.targets.findIndex(
      (t) => t.targetId === currentTargetId,
    );
    if (idx === -1) return;
    const updatedTargets = mission.targets.map((t, i) =>
      i === idx ? { ...t, captured: true } : t,
    );
    const next =
      idx + 1 < updatedTargets.length ? updatedTargets[idx + 1] : null;
    updateMission(id, {
      targets: updatedTargets,
      currentTargetId: next?.targetId ?? currentTargetId,
    });
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
  };

  const isPlanningStatus = status === "PLANNING";
  const isSetupStatus = status === "SETUP";
  const isOffline = uiState.connectivity.status !== "online";

  return (
    <div
      className={cn(
        "mission-space-page relative -m-4 min-h-screen",
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

      <div className="relative z-10 w-full p-4">
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* ========== HEADER ========== */}
          <header className="mission-page-header">
            <div className="flex flex-col gap-3">
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
                      className="font-display text-2xl font-semibold uppercase tracking-tight text-white/95 bg-transparent border-b border-transparent focus:border-violet-500 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl font-semibold uppercase tracking-tight text-white/95">
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
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
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* PLANNING STATE */}
                  {isPlanning && (
                    <>
                      {activePhase === "planning" && (
                        <Button
                          variant="cta"
                          size="sm"
                          onClick={() => handlePhaseClick("setup")}
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearPlan}
                        className="border-white/10 bg-white/5"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Reset Plan
                      </Button>
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

                  {/* LOGGING STATE */}
                  {isLoggingStatus && (
                    <Button
                      variant="cta"
                      size="sm"
                      onClick={handleSaveLog}
                      className="mission-page-cta"
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Save Log
                    </Button>
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
                        className="border-white/10 bg-white/5"
                      >
                        Set Active
                      </Button>
                    )}
                </div>
              </div>
              <p className="mt-1 flex items-center gap-2 text-xs text-white/45 tracking-wide">
                {loc?.name} · {gear?.name} · {formatDate(mission.dateTime)}
                <span className="text-zinc-500">· {sessionElapsedLabel}</span>
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
              noteLog={noteLog}
              isReadOnlySession={isReadOnlySession}
              isFieldMode={isFieldMode}
              currentTarget={currentTarget ?? null}
              currentTargetId={currentTargetId ?? null}
              selectedTarget={selectedTarget}
              primaryTargetName={primaryTargetName}
              exposurePlan={exposurePlan ?? null}
              sessionSimulation={sessionSimulation ?? null}
              nextTargetLabel={nextTargetLabel}
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
            />
          ) : isSetupStatus ? (
            <SetupView
              noteLog={noteLog}
              isReadOnlySession={isReadOnlySession}
              onAddNote={handleAddNoteFromView}
              onQuickEvent={handleQuickEventLog}
              onStartMission={handleStart}
              onCancelMission={() => setCancelOpen(true)}
            />
          ) : isCapturing ? (
            <CapturingView
              mission={mission as Mission}
              noteLog={noteLog}
              isReadOnlySession={isReadOnlySession}
              isFieldMode={isFieldMode}
              currentTarget={currentTarget ?? null}
              currentTargetId={currentTargetId ?? null}
              selectedTarget={selectedTarget}
              nextTarget={nextTarget}
              nextTargetLabel={nextTargetLabel}
              selectedTargetId={uiState.selectedTargetId ?? null}
              conditions={uiState.conditions}
              conditionsLog={conditionsLog}
              isOffline={isOffline}
              onAddNote={handleAddNoteFromView}
              onQuickEvent={handleQuickEventLog}
              onMarkTargetComplete={handleMarkTargetComplete}
              onStampConditions={handleStampConditions}
              onConditionsChange={(c) =>
                setConditions({ ...uiState.conditions, ...c })
              }
              onResetConditions={handleResetConditions}
              onUpdatePlan={handleRecalculate}
            />
          ) : isLoggingStatus ? (
            <LoggingView
              mission={mission as Mission}
              noteLog={noteLog}
              conditions={uiState.conditions}
              conditionsLog={conditionsLog}
              onSaveLog={handleSaveLog}
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
                    targetName={primaryTargetName}
                    plan={exposurePlan}
                  />
                  <SessionSimulatorCard
                    targetName={primaryTargetName}
                    simulation={sessionSimulation}
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
      <MissionDashboardContent />
    </MissionUIProvider>
  );
}
