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
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { mockRig } from "@/lib/mockMissionData";
import { MissionUIProvider, useMissionUI } from "@/lib/missionUIStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MissionTimeline } from "@/components/MissionTimeline";
import { ContextDrawer } from "@/components/drawer/ContextDrawer";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import {
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  Moon,
  XCircle,
  Target,
  Plus,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { AddTargetPicker } from "@/components/missions/AddTargetPicker";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { PhaseTabs } from "@/components/missions/PhaseTabs";
// import { ConnectivityStatusChip } from "@/components/missions/ConnectivityPopover";
import { ConditionsCard } from "@/components/missions/ConditionsCard";
import {
  SiteVerificationBanner,
  MissionConfidenceCard,
  LiveSkyMonitorCard,
  ForecastVsLiveComparison,
  SessionConditionSummary,
  AdaptationRecommendationCard,
  SkyMetricPill,
} from "@/components/sky-intelligence";
import {
  MOCK_LIVE_STATE,
  MOCK_LIVE_EVENTS,
  MOCK_COMPARISON_BETTER,
  MOCK_ADAPTATION_BETTER,
  MOCK_SESSION_CONDITIONS,
} from "@/lib/mock/skyIntelligence";
import { getAvailableTargetsForAdd } from "@/lib/mock/availableTargetsForMission";
import { EXPOSURE_PLANS_BY_TARGET } from "@/lib/mock/exposurePlans";
import { SESSION_SIMULATIONS_BY_TARGET } from "@/lib/mock/sessionSimulations";
import {
  ExposurePlannerCard,
  SessionSimulatorCard,
} from "@/components/intelligence";
import { RigSetupCard } from "@/components/missions/RigSetupCard";
// import { SoftwareSelect } from "@/components/missions/SoftwareSelect";
import { phaseFromStatus } from "@/lib/missions/phase";
import { getMissionStatus } from "@/lib/missionStatus";
import type { MissionPhase, MissionTarget } from "@/lib/types";
import type { RigProfile } from "@/lib/mockMissionData";
import type { ActivePhase } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";

/** Status badge labels for mission header */
// Legacy status label/color maps retained for potential future use
// const STATUS_LABELS: Record<string, string> = { ... };
// const STATUS_COLORS: Record<string, string> = { ... };

const PANEL_STYLE = "mission-panel";

function MissionDashboardContent() {
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const isFieldMode = useAppStore((s) => s.isFieldMode);
  const fieldModeOptions = useAppStore((s) => s.fieldModeOptions);
  // const setFieldModeOptions = useAppStore((s) => s.setFieldModeOptions);
  const {
    state: uiState,
    setSidebarOpen,
    setSidebarMode,
    setSelectedTarget,
    setConditions,
    resetConditions,
    setSoftware,
    recalculate,
    phaseClick,
    sidebarTabClick,
  } = useMissionUI();
  const { getMission, updateMission, setActiveMission, activeMissionId } =
    useMissionStore();
  const mission = getMission(id);
  const [noteInput, setNoteInput] = useState("");
  const [simOpen, setSimOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [abortOpen, setAbortOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [abortReason, setAbortReason] = useState("");
  const [rig, setRig] = useState<RigProfile>(mockRig);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addTargetPickerOpen, setAddTargetPickerOpen] = useState(false);
  const [logNotes, setLogNotes] = useState(mission?.notes ?? "");
  const [expandedLogTargets, setExpandedLogTargets] = useState<Set<string>>(
    () => new Set(),
  );

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
      (mission as { startedAt?: string } | null)?.startedAt ?? mission?.dateTime;
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
    : currentTarget ?? null;

  const currentIndex = mission.targets.findIndex(
    (t) => t.targetId === currentTargetId,
  );
  const nextTarget =
    currentIndex >= 0 && currentIndex + 1 < mission.targets.length
      ? mission.targets[currentIndex + 1]
      : mission.targets[1] ?? null;

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
  // const handleComplete = () => {
  //   updateMission(id, { status: "completed", phase: "logging" });
  //   setSidebarMode("log");
  //   setSidebarOpen(true);
  //   toast("Switched to logging");
  // };
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
    setSidebarMode("log");
    setSidebarOpen(true);
    toast("Mission aborted — log results to save partial data");
  };

  const handleAddNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    const entry = { text, at: new Date().toISOString() };
    updateMission(id, {
      noteLog: [...noteLog, entry],
      notes: text,
    });
    setNoteInput("");
    toast("Note added");
  };
  const QUICK_EVENT_LABELS = [
    "Clouds moving in",
    "Guiding lost",
    "Meridian flip",
    "Conditions improved",
  ] as const;
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
  // const handleSaveResults = () => {
  //   updateMission(id, { status: "completed", phase: "completed" });
  //   toast("Results saved");
  // };
  // const handleReturnToDashboard = () => {
  //   router.push("/dashboard");
  // };

  const handleTargetClick = (t: MissionTarget) => {
    setSelectedTarget(t.targetId);
    setSidebarMode("target");
    setSidebarOpen(true);
  };
  const handleTargetQueueClick = (t: MissionTarget) => {
    setSelectedTarget(t.targetId);
    updateMission(id, { currentTargetId: t.targetId });
    setSidebarMode("target");
    setSidebarOpen(true);
  };
  const handleFocusTarget = (t: MissionTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTarget(t.targetId);
    updateMission(id, { currentTargetId: t.targetId });
    setSidebarMode("target");
    setSidebarOpen(true);
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
                            status: "completed",
                            phase: "logging",
                            logLocked: false,
                          });
                          if (activeMissionId === id) setActiveMission(null);
                          setLogNotes(mission.notes ?? "");
                          setExpandedLogTargets(new Set());
                          toast("Session ended — log results below");
                        }}
                        className="mission-page-cta"
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        End Session
                      </Button>
                    </>
                  )}

                  {/* No header actions in logging/terminal on mission page */}
                  {!isActive && !isTerminal && (
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

          {/* Planning tools — only in Plan phase */}
          {activePhase === "planning" && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500">Planning tools</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSimOpen(true)}
                className="border-white/10 bg-white/5"
              >
                <Moon className="h-4 w-4 mr-1" />
                Simulate Night
              </Button>
            </div>
          )}

          {uiState.planStale && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <span className="text-sm text-amber-200">
                Plan may be stale — adjust field conditions below and tap Update
                Mission Plan.
              </span>
            </div>
          )}

          {/* ========== MAIN OPERATIONS ROW ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
              <h2 className="mission-section-label mb-1">
                Notes / Session Log
              </h2>
              {noteLog.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px] font-mono tabular-nums">
                  {noteLog.map((entry) => (
                    <div
                      key={entry.at}
                      className="flex gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5"
                    >
                      <span className="text-xs text-zinc-500 shrink-0">
                        {new Date(entry.at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span className="text-zinc-200 leading-snug">
                        {entry.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!isReadOnlySession && (
                <div className="flex flex-wrap gap-2 pt-2 pb-1">
                  {QUICK_EVENT_LABELS.map((label) => (
                    <Button
                      key={label}
                      type="button"
                      size="lg"
                      variant="ghost"
                      className="min-w-[9rem] h-9 px-3 text-[11px] border border-white/10 bg-white/5 justify-start"
                      onClick={() => handleQuickEventLog(label)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              )}
              {!isReadOnlySession && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddNote();
                  }}
                  className="mt-auto flex gap-2 pt-1"
                >
                  <input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Log what just happened…"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={!noteInput.trim()}
                    className="border-white/10 bg-white/5"
                  >
                    Add
                  </Button>
                </form>
              )}
              {isReadOnlySession && (
                <p className="mt-auto pt-3 text-[11px] text-zinc-500">
                  Session ended — notes and events are locked for this mission.
                </p>
              )}
            </div>

            <section
              className={cn(
                PANEL_STYLE,
                "p-4 min-h-0 flex flex-col overflow-hidden",
              )}
            >
              <div className="flex items-center justify-between mb-3 text-sm">
                <h2 className="mission-section-label mb-0">Mission Timeline</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  {currentTarget && (
                    <>
                      <span className="font-medium text-zinc-100">
                        {currentTarget.targetName}
                      </span>
                      <span>Phase: {activePhase}</span>
                      <span>
                        Recipe: {currentTarget.subLength ?? 60}s / ISO 800 /{" "}
                        {currentTarget.frames ?? 60} subs
                      </span>
                      <span className="tabular-nums">
                        Window: {currentTarget.plannedWindowStart} –{" "}
                        {currentTarget.plannedWindowEnd}
                      </span>
                    </>
                  )}
                  {nextTargetLabel && (
                    <span className="text-cyan-300 tabular-nums">
                      {nextTargetLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className={cn("flex-1 min-h-0 flex flex-col", isReadOnlySession && "opacity-70 pointer-events-none")}>
                <MissionTimeline
                  targets={mission.targets}
                  onTargetClick={handleTargetClick}
                  missionDate={mission.dateTime}
                  hero
                  selectedTargetId={uiState.selectedTargetId ?? currentTargetId}
                  currentTargetId={currentTargetId}
                  fieldMode={isFieldMode}
                />
              </div>
            </section>
          </div>

          {/* ========== PLANNING ROW: Target Queue + Selected Target ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cn(PANEL_STYLE, "p-4")}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="mission-section-label">Target Queue</h2>
                {!isReadOnlySession && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-white/10 bg-white/5"
                    onClick={() => setAddTargetPickerOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Target
                  </Button>
                )}
              </div>
              {mission.targets.length === 0 ? (
                <div className="py-8 text-center rounded-lg border border-dashed border-white/10">
                  <p className="text-sm text-zinc-500 mb-3">
                    No targets in this mission plan yet.
                  </p>
                  {!isReadOnlySession && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border-white/10 bg-white/5"
                      onClick={() => setAddTargetPickerOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Target
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {mission.targets.map((t, idx) => {
                    const isSelected =
                      uiState.selectedTargetId === t.targetId ||
                      currentTargetId === t.targetId;
                    const isActiveTarget = currentTargetId === t.targetId;
                    const totalFrames = t.frames ?? 60;
                    const capturedFrames = Math.max(
                      0,
                      Math.min(totalFrames, Math.floor(totalFrames * 0.4) + (idx % 10)),
                    );
                    const seqLabel =
                      t.roleLabel ??
                      (t.isFallback
                        ? "Fallback"
                        : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                    return (
                      <div
                        key={t.targetId}
                        onClick={
                          isReadOnlySession ? undefined : () => handleTargetQueueClick(t)
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                          isSelected
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                          isReadOnlySession ? "cursor-default" : "cursor-pointer",
                        )}
                      >
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span
                            className={cn(
                              "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums",
                              t.isFallback
                                ? "text-amber-400/80"
                                : "text-zinc-500",
                            )}
                          >
                            {seqLabel}
                          </span>
                          {!isReadOnlySession && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-cyan-400"
                                onClick={(e) => handleFocusTarget(t, e)}
                                title="Set as Current Focus"
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                                onClick={() => handleMoveTarget(idx, "up")}
                                disabled={idx === 0}
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                                onClick={() => handleMoveTarget(idx, "down")}
                                disabled={idx === mission.targets.length - 1}
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                                onClick={(e) => handleRemoveTarget(t.targetId, e)}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <label
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={t.captured ?? false}
                            onCheckedChange={
                              isReadOnlySession
                                ? undefined
                                : () => handleCaptureToggle(t.targetId)
                            }
                            disabled={isReadOnlySession}
                          />
                          <div className="flex-1 min-w-0">
                            {!isActiveTarget && (
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "truncate text-sm",
                                    t.captured
                                      ? "text-zinc-500 line-through"
                                      : "text-zinc-200",
                                  )}
                                >
                                  {t.targetName}
                                </span>
                                <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                                  {t.plannedWindowStart}–{t.plannedWindowEnd}
                                </span>
                              </div>
                            )}
                            {isActiveTarget && (
                              <>
                                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                  <span
                                    className={cn(
                                      "truncate",
                                      t.captured
                                        ? "text-zinc-500 line-through"
                                        : "text-zinc-200",
                                    )}
                                  >
                                    {t.targetName}
                                  </span>
                                  <span className="font-mono tabular-nums text-zinc-100">
                                    {capturedFrames} / {totalFrames}
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                                  {t.plannedWindowStart}–{t.plannedWindowEnd}
                                </div>
                                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-500"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (capturedFrames / totalFrames) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </label>
                        {isSelected && (
                          <span className="text-[10px] shrink-0 font-medium uppercase text-violet-400">
                            {currentTargetId === t.targetId
                              ? "Current Focus"
                              : "Selected"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <SelectedTargetCard
              target={selectedTarget}
              onMakePrimary={(t) => {
                updateMission(id, { currentTargetId: t.targetId });
                setSelectedTarget(t.targetId);
                toast("Current focus set");
              }}
              onRemove={(t) => handleRemoveTarget(t.targetId)}
              isPrimary={currentTargetId === selectedTarget?.targetId}
            />
          </div>

          {/* ========== INLINE SESSION LOGGING ========== */}
          {activePhase === "logging" && (
            <section className={cn(PANEL_STYLE, "p-4 space-y-4")}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="mission-section-label mb-0">Log Results</h2>
                {!mission.logLocked && (
                  <span className="text-[11px] text-zinc-500">
                    Capture how the session went before you wrap for the night.
                  </span>
                )}
              </div>

              {!mission.logLocked ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-400">
                      Overall session notes
                    </label>
                    <textarea
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="What worked, what didn&apos;t, gear issues, sky surprises…"
                      className="w-full min-h-[80px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                      Per-target outcomes
                    </h3>
                    <div className="space-y-2">
                      {mission.targets.map((t) => {
                        const expanded = expandedLogTargets.has(t.targetId);
                        const handleUpdateTarget = (
                          updates: Partial<MissionTarget>,
                        ) => {
                          updateMission(id, {
                            targets: mission.targets.map((mt) =>
                              mt.targetId === t.targetId ? { ...mt, ...updates } : mt,
                            ),
                          });
                        };
                        const currentResult = t.result;
                        return (
                          <div
                            key={t.targetId}
                            className="rounded-lg border border-white/10 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedLogTargets((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(t.targetId)) next.delete(t.targetId);
                                  else next.add(t.targetId);
                                  return next;
                                })
                              }
                              className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors"
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
                              )}
                              <span className="flex-1 font-medium text-sm truncate">
                                {t.targetName}
                              </span>
                              <span className="shrink-0 text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                                {t.frames ?? "—"} fr · {t.subLength ?? "—"}s
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 text-[10px] uppercase px-1.5 py-0.5 rounded",
                                  currentResult === "success" &&
                                    "text-emerald-400/90 bg-emerald-500/10",
                                  currentResult === "partial" &&
                                    "text-amber-400/90 bg-amber-500/10",
                                  currentResult === "failed" &&
                                    "text-red-400/90 bg-red-500/10",
                                  !currentResult && "text-white/40 bg-white/5",
                                )}
                              >
                                {currentResult === "success"
                                  ? "Success"
                                  : currentResult === "partial"
                                    ? "Partial"
                                    : currentResult === "failed"
                                      ? "Failed"
                                      : "Not set"}
                              </span>
                            </button>
                            {expanded && (
                              <div className="border-t border-white/10 p-3 space-y-3 bg-white/[0.02]">
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { value: "success", label: "Success" },
                                    { value: "partial", label: "Partial" },
                                    { value: "failed", label: "Failed" },
                                  ].map((opt) => (
                                    <Button
                                      key={opt.value}
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className={cn(
                                        "h-7 px-2.5 text-[11px]",
                                        currentResult === opt.value
                                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                          : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/[0.08]",
                                      )}
                                      onClick={() =>
                                        handleUpdateTarget({
                                          result: opt.value as MissionTarget["result"],
                                          captured:
                                            opt.value === "success" ||
                                            opt.value === "partial",
                                        })
                                      }
                                    >
                                      {opt.label}
                                    </Button>
                                  ))}
                                </div>
                                <div className="flex gap-3 items-end flex-wrap">
                                  <div>
                                    <label className="text-xs text-white/50 block">
                                      Sub length (sec)
                                    </label>
                                    <input
                                      type="number"
                                      value={t.subLength ?? ""}
                                      onChange={(e) =>
                                        handleUpdateTarget({
                                          subLength: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                        })
                                      }
                                      placeholder="60"
                                      className="mt-0.5 w-20 h-8 rounded border border-white/10 bg-black/40 px-2 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white/50 block">
                                      Frames
                                    </label>
                                    <input
                                      type="number"
                                      value={t.frames ?? ""}
                                      onChange={(e) =>
                                        handleUpdateTarget({
                                          frames: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                        })
                                      }
                                      placeholder="30"
                                      className="mt-0.5 w-20 h-8 rounded border border-white/10 bg-black/40 px-2 text-sm"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[160px]">
                                    <label className="text-xs text-white/50 block">
                                      Notes
                                    </label>
                                    <input
                                      type="text"
                                      value={t.notes ?? ""}
                                      onChange={(e) =>
                                        handleUpdateTarget({ notes: e.target.value })
                                      }
                                      placeholder="Optional per-target notes"
                                      className="mt-0.5 h-8 w-full rounded border border-white/10 bg-black/40 px-2 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                    <p className="text-[11px] text-zinc-500">
                      Save once you&apos;ve logged each target&apos;s outcome.
                    </p>
                    <Button
                      variant="cta"
                      size="sm"
                      onClick={() => {
                        const updatedTargets = mission.targets.map((t) => t);
                        const completed = updatedTargets.filter(
                          (t) => t.result === "success" || t.result === "partial",
                        ).length;
                        updateMission(id, {
                          targets: updatedTargets,
                          notes: logNotes,
                          status:
                            completed === updatedTargets.length
                              ? "completed"
                              : mission.status,
                          phase:
                            completed === updatedTargets.length
                              ? "completed"
                              : "logging",
                          logLocked: true,
                        });
                        toast("Session log saved");
                      }}
                      className="mission-page-cta"
                    >
                      Save Log
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                      Session summary
                    </h3>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {mission.notes || "No overall notes recorded for this session."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                      Target outcomes
                    </h3>
                    <div className="space-y-1.5">
                      {mission.targets.map((t) => (
                        <div
                          key={t.targetId}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2"
                        >
                          <span className="flex-1 text-sm text-zinc-200 truncate">
                            {t.targetName}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] uppercase px-1.5 py-0.5 rounded",
                              t.result === "success" &&
                                "text-emerald-400/90 bg-emerald-500/10",
                              t.result === "partial" &&
                                "text-amber-400/90 bg-amber-500/10",
                              t.result === "failed" &&
                                "text-red-400/90 bg-red-500/10",
                              !t.result && "text-white/40 bg-white/5",
                            )}
                          >
                            {t.result === "success"
                              ? "Success"
                              : t.result === "partial"
                                ? "Partial"
                                : t.result === "failed"
                                  ? "Failed"
                                  : "Not logged"}
                          </span>
                          <span className="text-[11px] text-zinc-400 tabular-nums">
                            {t.frames ?? "—"} fr · {t.subLength ?? "—"}s
                          </span>
                          {t.notes && (
                            <span className="w-full text-[11px] text-zinc-400">
                              {t.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ========== SECOND OPERATIONS ROW ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(activePhase === "setup" ||
              activePhase === "capturing" ||
              activePhase === "logging") && (
              <div className={cn(PANEL_STYLE, "p-4")}>
                <h3 className="mission-section-label mb-3">Observing Conditions</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <MissionConfidenceCard
                      confidence={MOCK_LIVE_STATE.forecastConfidence ?? 89}
                      label="Forecast Confidence"
                      size="sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <SkyMetricPill
                        label="Cloud Cover"
                        value={`${MOCK_LIVE_STATE.forecast?.cloudCover ?? 12}%`}
                      />
                      <SkyMetricPill
                        label="Humidity"
                        value={`${MOCK_LIVE_STATE.forecast?.humidity ?? 45}%`}
                      />
                      <SkyMetricPill
                        label="Seeing"
                        value={`${MOCK_LIVE_STATE.forecast?.seeing ?? 3}/5`}
                      />
                      <SkyMetricPill
                        label="Wind"
                        value={`${MOCK_LIVE_STATE.forecast?.windMph ?? 5} mph`}
                      />
                      <SkyMetricPill
                        label="Moon Impact"
                        value={
                          MOCK_LIVE_STATE.forecast?.moonInterference ?? "Moderate"
                        }
                      />
                    </div>
                  </div>
                </div>

                <h3 className="mission-section-label mt-5 mb-3">
                  Field Conditions
                </h3>
                <ConditionsCard
                  conditions={uiState.conditions}
                  onChange={setConditions}
                  onReset={handleResetConditions}
                  onUpdatePlan={handleRecalculate}
                  className="!border-0 !rounded-none !bg-transparent !shadow-none"
                  readOnly={isReadOnlySession}
                />

                <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500">
                      Conditions timeline
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[11px]"
                      onClick={handleStampConditions}
                    >
                      Stamp current conditions
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] font-mono tabular-nums">
                    {conditionsLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5"
                      >
                        <span className="text-zinc-500">
                          {new Date(entry.at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-zinc-300">
                          S{entry.seeing} · T{entry.transparency} ·{" "}
                          {entry.clouds}% clouds · {entry.wind} wind ·{" "}
                          {entry.moonGlare ? "moon" : "no moon"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <SiteVerificationBanner
                    message="Conditions stable — better than forecast. Proceed with planned exposure settings."
                    variant="better"
                  />
                  <div className="flex items-center gap-4">
                    <MissionConfidenceCard
                      confidence={MOCK_LIVE_STATE.liveConfidence ?? 91}
                      label="Mission Confidence"
                      size="md"
                    />
                  </div>
                  <ForecastVsLiveComparison rows={MOCK_COMPARISON_BETTER} compact />
                </div>
                <div className="space-y-3">
                  <LiveSkyMonitorCard
                    cloudCover={MOCK_LIVE_STATE.live?.cloudCover ?? 6}
                    starsDetected={MOCK_LIVE_STATE.live?.starsDetected ?? 168}
                    skyBrightness={MOCK_LIVE_STATE.live?.skyBrightness ?? 21.5}
                    missionConfidence={MOCK_LIVE_STATE.liveConfidence ?? 91}
                    status="Conditions stable — better than forecast"
                    events={MOCK_LIVE_EVENTS}
                    compact
                    className="!border-0 !rounded-none !bg-transparent !shadow-none"
                  />
                  <SessionConditionSummary
                    metadata={
                      MOCK_SESSION_CONDITIONS["home-suburban"] ??
                      Object.values(MOCK_SESSION_CONDITIONS)[0]
                    }
                    compact
                  />
                  <AdaptationRecommendationCard
                    scenario={MOCK_ADAPTATION_BETTER}
                    compact
                  />
                </div>
              </div>
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
        </motion.div>
      </div>

      <ContextDrawer
        isOpen={uiState.isSidebarOpen}
        sidebarMode={uiState.sidebarMode}
        selectedTarget={selectedTarget}
        mission={mission}
        rig={rig}
        software={uiState.software}
        activePhase={activePhase}
        onClose={() => setSidebarOpen(false)}
        onSidebarTabClick={sidebarTabClick}
        onUpdateMission={(u) => updateMission(id, u)}
        onUpdateTarget={(targetId, u) =>
          updateMission(id, {
            targets: mission.targets.map((t) =>
              t.targetId === targetId ? { ...t, ...u } : t,
            ),
          })
        }
        onUpdateRig={(u) => setRig((p) => ({ ...p, ...u }))}
        onUpdateSoftware={setSoftware}
      />

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
