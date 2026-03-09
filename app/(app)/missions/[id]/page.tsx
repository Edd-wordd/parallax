/**
 * Mission Page — Field Operations Dashboard
 *
 * Atlas = Mission Intelligence Layer. This page supports:
 * - Reviewing the active mission
 * - Watching target timing
 * - Monitoring sky/condition health
 * - Adjusting the mission plan
 * - Deciding whether to continue, pause, switch targets, or abort
 * - Logging notes and results
 *
 * Atlas guides the session; actual capture runs in NINA, Ekos, ASIAIR, Voyager, etc.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { MOCK_NIGHT } from "@/lib/mock/night";
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
  ScanSearch,
  Target,
  LogOut,
  Plus,
} from "lucide-react";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { AddTargetPicker } from "@/components/missions/AddTargetPicker";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { PhaseTabs } from "@/components/missions/PhaseTabs";
import { ConnectivityStatusChip } from "@/components/missions/ConnectivityPopover";
import { ConditionsCard } from "@/components/missions/ConditionsCard";
import {
  LiveSkyMonitorCard,
  NightHealthCard,
  AdaptiveMissionAdviceCard,
} from "@/components/sky-intelligence";
import {
  MOCK_LIVE_STATE,
  MOCK_LIVE_EVENTS,
} from "@/lib/mock/skyIntelligence";
import {
  getMockNightHealth,
  getMockAdaptiveAdvice,
} from "@/lib/mock/fieldOps";
import { getAvailableTargetsForAdd } from "@/lib/mock/availableTargetsForMission";
import { SoftwareSelect } from "@/components/missions/SoftwareSelect";
import { phaseFromStatus } from "@/lib/missions/phase";
import { getMissionStatus } from "@/lib/missionStatus";
import type { MissionPhase, MissionTarget } from "@/lib/types";
import type { RigProfile } from "@/lib/mockMissionData";
import type { ActivePhase } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";

/** Status badge labels for mission header */
const STATUS_LABELS: Record<string, string> = {
  draft: "Planning",
  ready: "Ready",
  in_progress: "Capturing",
  completed: "Complete",
  cancelled: "Cancelled",
  aborted: "Aborted",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-600 text-zinc-200",
  ready: "bg-emerald-500/20 text-emerald-400",
  in_progress: "bg-violet-500/20 text-violet-400",
  completed: "bg-zinc-500/20 text-zinc-400",
  cancelled: "bg-amber-500/20 text-amber-400",
  aborted: "bg-rose-500/20 text-rose-400",
};

const PANEL_STYLE = "mission-panel";

function MissionDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const isFieldMode = useAppStore((s) => s.isFieldMode);
  const toggleFieldMode = useAppStore((s) => s.toggleFieldMode);
  const fieldModeOptions = useAppStore((s) => s.fieldModeOptions);
  const setFieldModeOptions = useAppStore((s) => s.setFieldModeOptions);
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
  const [mounted, setMounted] = useState(false);
  const [addTargetPickerOpen, setAddTargetPickerOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const availableTargetsForAdd = useMemo(
    () => getAvailableTargetsForAdd(mission?.targets ?? []),
    [mission?.targets]
  );

  const noteLog = mission?.noteLog ?? (mission?.notes ? [{ text: mission.notes, at: mission.createdAt }] : []);

  const status = getMissionStatus(mission ?? null);
  const isPlanning = status === "PLANNING" || status === "SETUP";
  const isCapturing = status === "CAPTURING";
  const isLogging = status === "LOGGING";
  const isTerminal = status === "COMPLETED" || status === "ABORTED" || status === "CANCELLED";

  const nightHealth = useMemo(
    () => getMockNightHealth({}),
    [uiState.conditions],
  );
  const adaptiveAdvice = useMemo(
    () => getMockAdaptiveAdvice({ clouds: uiState.conditions.clouds, transparency: uiState.conditions.transparency }),
    [uiState.conditions.clouds, uiState.conditions.transparency, uiState.planStale],
  );

  if (!mounted) {
    return (
      <div className="mission-space-page relative -m-4 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Loading mission…</div>
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
  const currentTarget = mission.targets.find((t) => t.targetId === currentTargetId) ?? mission.targets[0];
  const selectedTarget = uiState.selectedTargetId
    ? (mission.targets.find((t) => t.targetId === uiState.selectedTargetId) ?? null)
    : null;

  const handlePhaseClick = (phase: ActivePhase) => {
    updateMission(id, { phase });
    phaseClick(phase, firstTargetId);
  };

  const handleStart = () => {
    updateMission(id, { status: "in_progress", phase: "capturing", currentTargetId: firstTargetId });
    setActiveMission(id);
    handlePhaseClick("capturing");
    toast("Mission started");
  };
  const handleComplete = () => {
    updateMission(id, { status: "completed", phase: "logging" });
    setSidebarMode("log");
    setSidebarOpen(true);
    toast("Switched to logging");
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
    const entry = { text: `[Cancelled] ${reason}`, at: new Date().toISOString() };
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
  const handleResetConditions = () => {
    resetConditions();
    toast("Conditions reset");
  };
  const handleRecalculate = () => {
    recalculate();
    toast("Plan updated");
  };
  const handleSaveResults = () => {
    updateMission(id, { status: "completed", phase: "completed" });
    toast("Results saved");
  };
  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

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
    if (uiState.selectedTargetId === targetId) setSelectedTarget(next[0]?.targetId ?? null);
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
  const handleAddTarget = (opt: { targetId: string; targetName: string; targetType: string; score: number; bestWindowStart: string; bestWindowEnd: string }) => {
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
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl font-semibold uppercase tracking-tight text-white/95">
                    {mission.name}
                  </h1>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_COLORS[mission.status] ?? STATUS_COLORS.draft,
                    )}
                  >
                    {STATUS_LABELS[mission.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* PLANNING STATE */}
                  {isPlanning && (
                    <>
                      {mission.status === "ready" && (
                        <Button variant="cta" size="sm" onClick={handleStart} className="mission-page-cta">
                          <Play className="h-4 w-4 mr-1" />
                          Start Mission
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={handleClearPlan} className="border-white/10 bg-white/5">
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
                      <Link href="/site-check">
                        <Button variant="secondary" size="sm" className="border-white/10 bg-white/5">
                          <ScanSearch className="h-4 w-4 mr-1" />
                          Check Sky Conditions
                        </Button>
                      </Link>
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
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          updateMission(id, { phase: "logging" });
                          setSidebarMode("log");
                          setSidebarOpen(true);
                        }}
                        className="border-white/10 bg-white/5"
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Log Results
                      </Button>
                      <Link href="/site-check">
                        <Button variant="secondary" size="sm" className="border-white/10 bg-white/5">
                          <ScanSearch className="h-4 w-4 mr-1" />
                          Check Sky Conditions
                        </Button>
                      </Link>
                    </>
                  )}

                  {/* LOGGING STATE */}
                  {isLogging && (
                    <>
                      <Button variant="cta" size="sm" onClick={handleSaveResults} className="mission-page-cta">
                        Save Results
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleReturnToDashboard} className="border-white/10 bg-white/5">
                        <LogOut className="h-4 w-4 mr-1" />
                        Return to Dashboard
                      </Button>
                    </>
                  )}

                  {/* TERMINAL STATE */}
                  {isTerminal && (
                    <Button variant="secondary" size="sm" onClick={handleReturnToDashboard} className="border-white/10 bg-white/5">
                      <LogOut className="h-4 w-4 mr-1" />
                      Return to Dashboard
                    </Button>
                  )}

                  <ConnectivityStatusChip connectivity={uiState.connectivity} />
                  {!isActive && !isTerminal && (
                    <Button variant="secondary" size="sm" onClick={handleSetActive} className="border-white/10 bg-white/5">
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-white/45 tracking-wide">
                {loc?.name} · {gear?.name} · {formatDate(mission.dateTime)}
              </p>
            </div>
          </header>

          {/* Phase stepper */}
          <div>
            <PhaseTabs
              activePhase={activePhase}
              onPhaseClick={handlePhaseClick}
              firstTargetId={firstTargetId}
            />
          </div>

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
                Plan may be stale — adjust field conditions below and tap Update Mission Plan.
              </span>
            </div>
          )}

          {/* CURRENT FOCUS strip */}
          {currentTarget && (
            <div className={cn(PANEL_STYLE, "p-4 py-3")}>
              <h2 className="mission-section-label mb-2">Current Focus</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium text-zinc-100">{currentTarget.targetName}</span>
                <span className="text-zinc-500">Phase: {activePhase}</span>
                <span className="text-zinc-500">
                  Recipe: {currentTarget.subLength ?? 60}s / ISO 800 / {currentTarget.frames ?? 60} subs
                </span>
                <span className="text-zinc-500 tabular-nums">
                  Window: {currentTarget.plannedWindowStart} – {currentTarget.plannedWindowEnd}
                </span>
                {isCapturing && (
                  <span className="text-cyan-400 tabular-nums">
                    Frame 18/60 · Integration 00:18:00
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ========== MAIN OPERATIONS ROW ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
            <div className={cn(PANEL_STYLE, "p-4")}>
              <h2 className="mission-section-label">Mission Status</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="mission-meta-label">Location</dt>
                  <dd className="mission-meta-value">{loc?.name}</dd>
                </div>
                <div>
                  <dt className="mission-meta-label">Rig</dt>
                  <dd className="mission-meta-value">{gear?.name}</dd>
                </div>
                <div>
                  <dt className="mission-meta-label">Date</dt>
                  <dd className="mission-meta-value">{formatDate(mission.dateTime)}</dd>
                </div>
                <div>
                  <dt className="mission-meta-label">Moon</dt>
                  <dd className="mission-meta-value">{MOCK_NIGHT.moonPhase} · {MOCK_NIGHT.moonPhasePercent}%</dd>
                </div>
                <div>
                  <dt className="mission-meta-label">Min altitude</dt>
                  <dd className="mission-meta-value">{mission.constraints.minAltitude}°</dd>
                </div>
                <div>
                  <dt className="mission-meta-label">Field conditions</dt>
                  <dd className="mission-meta-value">
                    Seeing {uiState.conditions.seeing}/5 · {uiState.conditions.clouds}% clouds
                  </dd>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <dt className="mission-meta-label mb-2">Software</dt>
                  <SoftwareSelect software={uiState.software} onChange={setSoftware} />
                </div>
              </dl>
            </div>

            <section className={cn(PANEL_STYLE, "p-4 min-h-0 flex flex-col overflow-hidden")}>
              <div className="flex-1 min-h-0 flex flex-col">
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

            <div className={cn(PANEL_STYLE, "p-4 min-h-0 flex flex-col overflow-y-auto")}>
              <h3 className="mission-section-label mb-3 shrink-0">Live Sky Monitor</h3>
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
            </div>
          </div>

          {/* ========== SECOND OPERATIONS ROW ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={cn(PANEL_STYLE, "p-4")}>
              <h3 className="mission-section-label mb-3">Night Health</h3>
              <NightHealthCard health={nightHealth} compact className="!border-0 !rounded-none !bg-transparent !shadow-none" />
            </div>
            <div className={cn(PANEL_STYLE, "p-4")}>
              <h3 className="mission-section-label mb-3">Adaptive Mission Advice</h3>
              <AdaptiveMissionAdviceCard
                advice={adaptiveAdvice}
                compact
                className="!border-0 !rounded-none !bg-transparent !shadow-none"
              />
            </div>
            <div className={cn(PANEL_STYLE, "p-4")}>
              <h3 className="mission-section-label mb-3">Field Conditions</h3>
              <ConditionsCard
                conditions={uiState.conditions}
                onChange={setConditions}
                onReset={handleResetConditions}
                onUpdatePlan={handleRecalculate}
                className="!border-0 !rounded-none !bg-transparent !shadow-none"
              />
            </div>
          </div>

          {/* ========== PLANNING ROW: Target Queue + Selected Target ========== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cn(PANEL_STYLE, "p-4")}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="mission-section-label">Target Queue</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-white/10 bg-white/5"
                  onClick={() => setAddTargetPickerOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Target
                </Button>
              </div>
              {mission.targets.length === 0 ? (
                <div className="py-8 text-center rounded-lg border border-dashed border-white/10">
                  <p className="text-sm text-zinc-500 mb-3">No targets in this mission plan yet.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-white/10 bg-white/5"
                    onClick={() => setAddTargetPickerOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Target
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mission.targets.map((t, idx) => {
                    const isSelected = uiState.selectedTargetId === t.targetId || currentTargetId === t.targetId;
                    const seqLabel = t.roleLabel ?? (t.isFallback ? "Fallback" : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                    return (
                      <div
                        key={t.targetId}
                        onClick={() => handleTargetQueueClick(t)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                          isSelected
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                        )}
                      >
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span
                            className={cn(
                              "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums",
                              t.isFallback ? "text-amber-400/80" : "text-zinc-500",
                            )}
                          >
                            {seqLabel}
                          </span>
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
                            onClick={(e) => handleMoveTarget(idx, "up")}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                            onClick={(e) => handleMoveTarget(idx, "down")}
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
                        </div>
                        <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={t.captured ?? false}
                            onCheckedChange={() => handleCaptureToggle(t.targetId)}
                          />
                          <span
                            className={cn(
                              "truncate text-sm",
                              t.captured ? "text-zinc-500 line-through" : "text-zinc-200",
                            )}
                          >
                            {t.targetName}
                          </span>
                          <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                            {t.plannedWindowStart}–{t.plannedWindowEnd}
                          </span>
                        </label>
                        {isSelected && (
                          <span className="text-[10px] shrink-0 font-medium uppercase text-violet-400">
                            {currentTargetId === t.targetId ? "Current Focus" : "Selected"}
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

          {/* ========== NOTES / SESSION LOG ========== */}
          <div className={cn(PANEL_STYLE, "p-4")}>
            <h2 className="mission-section-label mb-3">Notes / Session Log</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddNote();
              }}
              className="flex gap-2 mb-3"
            >
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-500"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!noteInput.trim()} className="border-white/10 bg-white/5">
                Add
              </Button>
            </form>
            {noteLog.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[...noteLog].reverse().map((entry) => (
                  <div key={entry.at} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <p className="text-zinc-200">{entry.text}</p>
                    <p className="text-xs text-zinc-500 mt-1">{new Date(entry.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      <NightSimulationModal isOpen={simOpen} onClose={() => setSimOpen(false)} targets={mission.targets} />
      <AddTargetPicker
        isOpen={addTargetPickerOpen}
        onClose={() => setAddTargetPickerOpen(false)}
        available={availableTargetsForAdd}
        onAdd={handleAddTarget}
      />

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCancelOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md mission-panel p-4">
            <h3 className="text-base font-semibold text-white mb-2">Cancel Mission</h3>
            <p className="text-sm text-zinc-400 mb-4">Discard this mission and return to planning. Log a reason (saved to notes).</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Changed plans, wrong date..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm min-h-[80px] placeholder:text-zinc-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setCancelOpen(false); setCancelReason(""); }} className="border-white/10 bg-white/5">
                Keep Mission
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancelMission}>
                <XCircle className="h-4 w-4 mr-1" />
                Cancel Mission
              </Button>
            </div>
          </div>
        </div>
      )}

      {abortOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setAbortOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md mission-panel p-4">
            <h3 className="text-base font-semibold text-white mb-2">Abort Mission</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Stop the in-field mission and preserve partial state. You can still log results.
            </p>
            <textarea
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              placeholder="e.g. Clouds rolled in, equipment issue..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm min-h-[80px] placeholder:text-zinc-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setAbortOpen(false); setAbortReason(""); }} className="border-white/10 bg-white/5">
                Keep Going
              </Button>
              <Button variant="destructive" size="sm" onClick={handleAbortMission}>
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
