"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Paperclip,
  Pause,
  SkipForward,
  Crosshair,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTargetById } from "@/lib/mock/recommendations";
import {
  setupSections,
  CRITICAL_STEP_IDS,
  PREFLIGHT_KEYS,
  HOW_TO_CONTENT,
  OPTIMIZE_RECOMMENDATIONS,
  getMockAIExplanation,
  getMockMissionGuidance,
  type RigProfile,
  type PreflightStatus,
  type SoftwareProfile,
  type MissionSetupLog,
} from "@/lib/mockMissionData";
import type { Mission, MissionTarget } from "@/lib/types";
import type { SidebarMode, ActivePhase, SoftwareState } from "@/lib/missionUIStore";

const SOFTWARE_NAME_TO_PROFILE: Record<string, SoftwareProfile> = {
  "Ekos (Astroberry)": "ekos",
  NINA: "nina",
  ASIAIR: "asiair",
  APT: "other",
  "Siril only": "other",
  Other: "other",
};

interface ContextDrawerProps {
  isOpen: boolean;
  sidebarMode: SidebarMode;
  selectedTarget: MissionTarget | null;
  mission: Mission;
  rig: RigProfile;
  software: SoftwareState;
  activePhase: ActivePhase;
  onClose: () => void;
  onSidebarTabClick: (mode: SidebarMode) => void;
  onUpdateMission: (updates: Partial<Mission>) => void;
  onUpdateTarget: (targetId: string, updates: Partial<MissionTarget>) => void;
  onUpdateRig?: (updates: Partial<RigProfile>) => void;
  onUpdateSoftware?: (s: Partial<SoftwareState>) => void;
}

type SetupTab = "checklist" | "howto" | "optimize";

function SoftwareSelectInline({
  software,
  onChange,
}: {
  software: SoftwareState;
  onChange: (s: Partial<SoftwareState>) => void;
}) {
  const opts: (SoftwareState["name"])[] = ["Ekos (Astroberry)", "NINA", "ASIAIR", "APT", "Siril only", "Other"];
  return (
    <select
      value={software.name}
      onChange={(e) => onChange({ name: e.target.value as SoftwareState["name"] })}
      className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
    >
      {opts.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

// --- Setup subcomponents (from MissionSidebar) ---
function PreflightStatusStrip({
  statuses,
  onStatusChange,
}: {
  statuses: Record<string, PreflightStatus>;
  onStatusChange: (key: string, status: PreflightStatus) => void;
}) {
  const labels: Record<string, string> = { power: "Power", mount: "Mount", focus: "Focus", guiding: "Guiding", solve: "Solve" };
  const cycle = (s: PreflightStatus): PreflightStatus => (s === "unknown" ? "ok" : s === "ok" ? "warn" : s === "warn" ? "bad" : "unknown");
  const statusColors: Record<PreflightStatus, string> = {
    unknown: "bg-zinc-700 text-zinc-400",
    ok: "bg-emerald-500/20 text-emerald-400",
    warn: "bg-amber-500/20 text-amber-400",
    bad: "bg-red-500/20 text-red-400",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {PREFLIGHT_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onStatusChange(key, cycle(statuses[key] ?? "unknown"))}
          className={cn("rounded px-2 py-1 text-xs font-medium transition-colors", statusColors[statuses[key] ?? "unknown"])}
        >
          {labels[key]}: {(statuses[key] ?? "unknown").toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SetupContent({
  mission,
  rig,
  software,
  setupLog,
  checkedSteps,
  preflightStatuses,
  onLogChange,
  onCheckedChange,
  onPreflightChange,
  onUpdateMission,
  onUpdateRig,
  onUpdateSoftware,
  onStartMission,
}: {
  mission: Mission;
  rig: RigProfile;
  software: SoftwareState;
  setupLog: MissionSetupLog;
  checkedSteps: Record<string, boolean>;
  preflightStatuses: Record<string, PreflightStatus>;
  onLogChange: (stepId: string, field: string, value: string | number) => void;
  onCheckedChange: (stepKey: string, checked: boolean) => void;
  onPreflightChange: (key: string, status: PreflightStatus) => void;
  onUpdateMission: (updates: Partial<Mission>) => void;
  onUpdateRig: (updates: Partial<RigProfile>) => void;
  onUpdateSoftware?: (s: Partial<SoftwareState>) => void;
  onStartMission: () => void;
}) {
  const [tab, setTab] = useState<SetupTab>("checklist");
  const [showSoftwareSelect, setShowSoftwareSelect] = useState(false);
  const softwareProfile = SOFTWARE_NAME_TO_PROFILE[software.name] ?? "nina";
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(setupSections.map((s) => [s.id, true]))
  );
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const totalSteps = setupSections.reduce((acc, s) => acc + s.steps.length, 0);
  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const criticalStepKeys = CRITICAL_STEP_IDS.flatMap((stepId) => {
    const section = setupSections.find((s) => s.steps.some((st) => st.id === stepId));
    return section ? [`${section.id}-${stepId}`] : [];
  });
  const criticalReady = criticalStepKeys.every((key) => checkedSteps[key]);

  const handleStartClick = () => (criticalReady ? onStartMission() : setShowOverrideModal(true));

  const handleNoteAppend = (line: string) => {
    const prev = mission.notes ?? "";
    onUpdateMission({ notes: prev ? `${prev}\n${line}` : line });
  };
  const handleApply = (rec: { title: string; suggestedChange?: string }) => {
    const suffix = rec.suggestedChange ? ` (${rec.suggestedChange})` : "";
    handleNoteAppend(`[Optimize] ${rec.title}${suffix}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Software:</span>
        <button
          type="button"
          onClick={() => setShowSoftwareSelect(!showSoftwareSelect)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600 bg-zinc-800/50 px-3 py-1 text-sm hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          <span>{software.name}</span>
          <Pencil className="h-3 w-3" />
        </button>
      </div>
      {showSoftwareSelect && onUpdateSoftware && (
        <div className="rounded border border-zinc-700 p-3">
          <SoftwareSelectInline software={software} onChange={(s) => { onUpdateSoftware(s); setShowSoftwareSelect(false); }} />
        </div>
      )}
      <div className="flex border-b border-zinc-700">
        {(["checklist", "howto", "optimize"] as SetupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
              tab === t ? "border-cyan-500 text-cyan-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            {t === "checklist" ? "Checklist" : t === "howto" ? "How-To" : "Optimize"}
          </button>
        ))}
      </div>

      {tab === "checklist" && (
        <>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pre-flight status</div>
            <PreflightStatusStrip statuses={preflightStatuses} onStatusChange={onPreflightChange} />
          </div>
          <div className="space-y-1">
            {setupSections.map((section) => {
              const isExpanded = expandedSections[section.id] ?? true;
              return (
                <div key={section.id} className="rounded border border-zinc-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections((p) => ({ ...p, [section.id]: !isExpanded }))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium bg-zinc-800/50 hover:bg-zinc-800"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    {section.title}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-zinc-700 divide-y divide-zinc-700/50">
                      {section.steps.map((step) => {
                        const stepKey = `${section.id}-${step.id}`;
                        const checked = checkedSteps[stepKey] ?? false;
                        const log = setupLog[step.id] ?? {};
                        return (
                          <div key={step.id} className="px-3 py-2 bg-zinc-900/30">
                            <div className="flex items-start gap-2">
                              <Checkbox checked={checked} onCheckedChange={(c) => onCheckedChange(stepKey, !!c)} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("text-sm", checked && "text-zinc-400 line-through")}>{step.title}</span>
                                  {step.critical && <span className="text-xs text-amber-400/80">critical</span>}
                                </div>
                                {step.logFields && step.logFields.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {step.logFields.map((f) => (
                                      <div key={f.key} className="flex items-center gap-1">
                                        <span className="text-xs text-zinc-500">{f.label}</span>
                                        <Input
                                          type={f.type === "number" ? "number" : "text"}
                                          placeholder={f.placeholder ?? "Log value"}
                                          value={String(log[f.key] ?? "")}
                                          onChange={(e) =>
                                            onLogChange(step.id, f.key, f.type === "number" ? Number(e.target.value) || 0 : e.target.value)
                                          }
                                          className="h-7 w-20 text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-900/50 p-3 space-y-3">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Setup Gate</div>
            <div className="text-sm">
              <span className="text-zinc-300">{completedCount}/{totalSteps} complete</span>
              {criticalReady && (
                <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  <Check className="h-3 w-3" /> Critical-ready
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onUpdateMission({ phase: "capturing" })}>
                Mark Setup Complete
              </Button>
              <Button size="sm" onClick={handleStartClick} className={!criticalReady ? "opacity-80" : ""}>
                Start Mission
              </Button>
            </div>
          </div>
        </>
      )}

      {tab === "howto" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Software profile</label>
            <select
              value={softwareProfile}
              onChange={(e) => onUpdateRig?.({ softwareProfileId: e.target.value as SoftwareProfile })}
              className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="nina">NINA</option>
              <option value="asiair">ASIAIR</option>
              <option value="ekos">Ekos</option>
              <option value="sharpcap">SharpCap</option>
              <option value="other">Other</option>
            </select>
          </div>
          {setupSections.slice(0, 2).map((section) =>
            section.steps.slice(0, 2).map((step) => {
              const howTo = HOW_TO_CONTENT[softwareProfile]?.[section.id]?.[step.id];
              if (!howTo) return null;
              return (
                <div key={`${section.id}-${step.id}`} className="rounded border border-zinc-700 p-3">
                  <h4 className="text-sm font-medium text-zinc-200 mb-2">{step.title}</h4>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-zinc-500">Goal</dt><dd className="text-zinc-300">{howTo.goal}</dd></div>
                    <div><dt className="text-zinc-500">Do this</dt><dd className="text-zinc-300">{howTo.doThis}</dd></div>
                  </dl>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "optimize" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3"><h4 className="text-sm font-medium">Tonight&apos;s Conditions</h4></CardHeader>
            <CardContent className="py-0 pb-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-zinc-500">Bortle</span><span>8</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Moon</span><span>25%</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Clouds</span><span>10%</span></div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {OPTIMIZE_RECOMMENDATIONS.slice(0, 3).map((rec) => (
              <div key={rec.id} className="rounded border border-zinc-700 p-3 flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-200">{rec.title}</span>
                <p className="text-xs text-zinc-400">{rec.why}</p>
                <Button size="sm" variant="outline" className="w-fit" onClick={() => handleApply(rec)}>Apply</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowOverrideModal(false)} />
          <div className="relative rounded-lg border border-zinc-700 bg-zinc-900 p-4 max-w-sm shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /><span className="font-medium">Override start</span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">Not all critical steps are complete. Continue anyway?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={() => { setShowOverrideModal(false); onStartMission(); }}>Start Anyway</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContextDrawer({
  isOpen,
  sidebarMode,
  selectedTarget,
  mission,
  rig,
  software,
  activePhase,
  onClose,
  onSidebarTabClick,
  onUpdateMission,
  onUpdateTarget,
  onUpdateRig,
  onUpdateSoftware,
}: ContextDrawerProps) {
  const [setupLog, setSetupLog] = useState<MissionSetupLog>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [preflightStatuses, setPreflightStatuses] = useState<Record<string, PreflightStatus>>({});
  const [targetNotes, setTargetNotes] = useState<Record<string, string>>({});
  const [targetCapturePlans, setTargetCapturePlans] = useState<Record<string, { exposure: number; iso: number; subs: number; dither: string }>>({});
  const [logNotes, setLogNotes] = useState("");
  const [targetResults, setTargetResults] = useState<Record<string, "Great" | "OK" | "Bad">>({});

  const handleSetupLogChange = useCallback((stepId: string, field: string, value: string | number) => {
    setSetupLog((prev) => ({ ...prev, [stepId]: { ...(prev[stepId] ?? {}), [field]: value } }));
  }, []);
  const handleCheckedChange = useCallback((stepKey: string, checked: boolean) => {
    setCheckedSteps((prev) => ({ ...prev, [stepKey]: checked }));
  }, []);
  const handlePreflightChange = useCallback((key: string, status: PreflightStatus) => {
    setPreflightStatuses((prev) => ({ ...prev, [key]: status }));
  }, []);
  const handleStartMission = useCallback(() => {
    onUpdateMission({ status: "in_progress", phase: "capturing" });
  }, [onUpdateMission]);

  const fullTarget = selectedTarget ? getTargetById(selectedTarget.targetId) : null;
  const mockWindowStart = selectedTarget?.plannedWindowStart ?? "21:00";
  const mockWindowEnd = selectedTarget?.plannedWindowEnd ?? "02:00";
  const mockRecipe = { exposure: 60, iso: 800, subs: 60, dither: "3px / 3 frames" };
  const currentRecipe = selectedTarget
    ? (targetCapturePlans[selectedTarget.targetId] ?? mockRecipe)
    : mockRecipe;

  const renderTargetInfo = () => {
    if (!selectedTarget) return null;
    const notes = targetNotes[selectedTarget.targetId] ?? "";
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{selectedTarget.targetName}</h3>
          <div className="text-sm text-zinc-400 mt-1">
            {fullTarget && (
              <span className="capitalize">{fullTarget.type.replace("_", " ")} · Mag {fullTarget.magnitude} · {fullTarget.constellation}</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Tonight&apos;s Window</h4>
          <div className="text-sm text-zinc-300">{mockWindowStart} → {mockWindowEnd}</div>
          <div className="mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-500/60" style={{ width: "66%" }} />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Target Notes</h4>
          <textarea
            value={notes}
            onChange={(e) => setTargetNotes((p) => ({ ...p, [selectedTarget.targetId]: e.target.value }))}
            placeholder="Notes for this target"
            className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm min-h-[60px]"
          />
        </div>
        <Link href={`/targets/${selectedTarget.targetId}`}>
          <Button variant="outline" className="w-full">View full detail</Button>
        </Link>
      </div>
    );
  };

  const renderRecipe = () => {
    if (!selectedTarget) return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-zinc-500 text-sm">Select a target first</p>
      </div>
    );
    return (
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recommended Recipe</h4>
        <div className="rounded border border-zinc-700 p-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-zinc-500">Exposure</span><span>{currentRecipe.exposure}s</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">ISO / Gain</span><span>{currentRecipe.iso}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Subs</span><span>{currentRecipe.subs}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Dither</span><span>{currentRecipe.dither}</span></div>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            setTargetCapturePlans((p) => ({ ...p, [selectedTarget.targetId]: currentRecipe }));
            onUpdateTarget(selectedTarget.targetId, { subLength: currentRecipe.exposure, frames: currentRecipe.subs });
          }}
        >
          Use this recipe
        </Button>
      </div>
    );
  };

  const renderMissionGuidance = () => {
    if (!selectedTarget) return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-zinc-500 text-sm">Select a target first</p>
      </div>
    );
    const guidance = getMockMissionGuidance(selectedTarget.targetId);
    return (
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mission Guidance</h4>
        <p className="text-sm text-zinc-300">{guidance.whyNow}</p>
        <p className="text-sm text-zinc-300">{guidance.whyRecipe}</p>
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Watch for</span>
          <ul className="mt-1 space-y-1 text-sm text-zinc-300">
            {guidance.watchouts.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400/80 shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        {guidance.recheckNote && (
          <p className="text-xs text-zinc-500">{guidance.recheckNote}</p>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (sidebarMode === "target") {
      if (!selectedTarget) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-zinc-500 text-sm">No target selected</p>
            <p className="text-zinc-600 text-xs mt-1">Click a target in the queue to open</p>
          </div>
        );
      }
      return renderTargetInfo();
    }

    if (sidebarMode === "recipe") return renderRecipe();
    if (sidebarMode === "guidance") return renderMissionGuidance();

    if (sidebarMode === "setup") {
      return (
        <SetupContent
          mission={mission}
          rig={rig}
          software={software}
          setupLog={setupLog}
          checkedSteps={checkedSteps}
          preflightStatuses={preflightStatuses}
          onLogChange={handleSetupLogChange}
          onCheckedChange={handleCheckedChange}
          onPreflightChange={handlePreflightChange}
          onUpdateMission={onUpdateMission}
          onUpdateRig={onUpdateRig ?? (() => undefined)}
          onUpdateSoftware={onUpdateSoftware}
          onStartMission={handleStartMission}
        />
      );
    }

    if (activePhase === "capturing" && !selectedTarget) {
      const currentTarget = mission.targets[0];
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Focus</h3>
          <div className="rounded border border-zinc-700 p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Target</div>
            <div className="font-medium">{currentTarget?.targetName ?? "—"}</div>
            <p className="text-xs text-zinc-500 mt-1">Integration info from your capture software (NINA, Ekos, etc.)</p>
          </div>
          <div className="rounded border border-zinc-700 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Frame progress</span><span className="text-cyan-400">18/60</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Integration so far</span><span>00:18:00</span></div>
          </div>
          <p className="text-xs text-zinc-500">Use NINA, ASIAIR, or your capture tool to pause, skip, or recenter. Parallax provides guidance only.</p>
        </div>
      );
    }

    if (sidebarMode === "log") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Log Results</h3>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Overall notes</label>
            <textarea
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Session summary, conditions..."
              className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm min-h-[80px]"
            />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Per-target result</div>
            <div className="space-y-2">
              {mission.targets.map((t) => (
                <div key={t.targetId} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{t.targetName}</span>
                  <select
                    value={targetResults[t.targetId] ?? ""}
                    onChange={(e) => setTargetResults((p) => ({ ...p, [t.targetId]: e.target.value as "Great" | "OK" | "Bad" }))}
                    className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
                  >
                    <option value="">—</option>
                    <option value="Great">Great</option>
                    <option value="OK">OK</option>
                    <option value="Bad">Bad</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline"><Paperclip className="h-4 w-4 mr-1" />Attach images</Button>
            <Button size="sm" variant="outline">Attach logs</Button>
          </div>
          <Button className="w-full" onClick={() => onUpdateMission({ phase: "completed" })}>Save log</Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-zinc-500 text-sm">Select Target, Setup, or Log</p>
      </div>
    );
  };

  const SIDEBAR_TABS: { id: SidebarMode; label: string }[] = [
    { id: "target", label: "Target" },
    { id: "recipe", label: "Recipe" },
    { id: "guidance", label: "Guidance" },
    { id: "setup", label: "Setup" },
    { id: "log", label: "Log" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[min(400px,90vw)] max-w-full bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 z-10">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex gap-1" role="tablist">
                  {SIDEBAR_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={sidebarMode === tab.id}
                      onClick={() => onSidebarTabClick(tab.id)}
                      className={cn(
                        "rounded px-3 py-1.5 text-sm font-medium transition-colors min-h-[2.25rem]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                        sidebarMode === tab.id ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="shrink-0" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">{renderContent()}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
