"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, HelpCircle, PanelRightClose, PanelRightOpen, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Mission } from "@/lib/types";
import type { MissionPhase } from "@/lib/types";
import {
  setupSections,
  CRITICAL_STEP_IDS,
  PREFLIGHT_KEYS,
  SOFTWARE_PROFILES,
  HOW_TO_CONTENT,
  OPTIMIZE_RECOMMENDATIONS,
  type RigProfile,
  type PreflightStatus,
  type SoftwareProfile,
  type MissionSetupLog,
} from "@/lib/mockMissionData";

interface MissionSidebarProps {
  mission: Mission;
  rig: RigProfile;
  onUpdateMission: (updates: Partial<Mission>) => void;
  onUpdateRig: (updates: Partial<RigProfile>) => void;
}

type SetupTab = "checklist" | "howto" | "optimize";

function PreflightStatusStrip({
  statuses,
  onStatusChange,
}: {
  statuses: Record<string, PreflightStatus>;
  onStatusChange: (key: string, status: PreflightStatus) => void;
}) {
  const labels: Record<string, string> = { power: "Power", mount: "Mount", focus: "Focus", guiding: "Guiding", solve: "Solve" };
  const cycle = (s: PreflightStatus): PreflightStatus => {
    if (s === "unknown") return "ok";
    if (s === "ok") return "warn";
    if (s === "warn") return "bad";
    return "unknown";
  };
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
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            statusColors[statuses[key] ?? "unknown"]
          )}
        >
          {labels[key]}: {(statuses[key] ?? "unknown").toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SetupChecklistTab({
  setupLog,
  checkedSteps,
  preflightStatuses,
  onLogChange,
  onCheckedChange,
  onPreflightChange,
  onJumpToHowTo,
  onMarkComplete,
  onStartMission,
}: {
  setupLog: MissionSetupLog;
  checkedSteps: Record<string, boolean>;
  preflightStatuses: Record<string, PreflightStatus>;
  onLogChange: (stepId: string, field: string, value: string | number) => void;
  onCheckedChange: (stepId: string, checked: boolean) => void;
  onPreflightChange: (key: string, status: PreflightStatus) => void;
  onJumpToHowTo: (sectionId: string, stepId: string) => void;
  onMarkComplete: () => void;
  onStartMission: () => void;
}) {
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
  const criticalComplete = criticalStepKeys.every((key) => checkedSteps[key]);
  const criticalReady = criticalComplete;

  const handleStartClick = () => {
    if (criticalReady) {
      onStartMission();
    } else {
      setShowOverrideModal(true);
    }
  };

  const handleOverrideStart = () => {
    setShowOverrideModal(false);
    onStartMission();
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pre-flight status strip</div>
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
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => onCheckedChange(stepKey, !!c)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-sm", checked && "text-zinc-400 line-through")}>{step.title}</span>
                              {step.critical && (
                                <span className="text-xs text-amber-400/80">critical</span>
                              )}
                              <button
                                onClick={() => onJumpToHowTo(section.id, step.id)}
                                className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-cyan-400"
                                title="How"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
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
          <Button size="sm" variant="outline" onClick={onMarkComplete}>
            Mark Setup Complete
          </Button>
          <Button
            size="sm"
            onClick={handleStartClick}
            className={!criticalReady ? "opacity-80" : ""}
          >
            Start Mission
          </Button>
        </div>
      </div>

      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowOverrideModal(false)} />
          <div className="relative rounded-lg border border-zinc-700 bg-zinc-900 p-4 max-w-sm shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="font-medium">Override start</span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">
              Not all critical steps are complete. Starting without polar alignment, focus, plate solve, or test exposure may waste time. Continue anyway?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleOverrideStart}>
                Start Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupHowToTab({
  softwareProfileId,
  onSoftwareChange,
  activeSectionId,
  activeStepId,
  setupLog,
  onLogChange,
}: {
  softwareProfileId: SoftwareProfile;
  onSoftwareChange: (id: SoftwareProfile) => void;
  activeSectionId: string | null;
  activeStepId: string | null;
  setupLog: MissionSetupLog;
  onLogChange: (stepId: string, field: string, value: string | number) => void;
}) {
  const content = HOW_TO_CONTENT[softwareProfileId];
  if (!content) return <p className="text-zinc-500 text-sm">Select a software profile.</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Software profile</label>
        <select
          value={softwareProfileId}
          onChange={(e) => onSoftwareChange(e.target.value as SoftwareProfile)}
          className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {SOFTWARE_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {setupSections.map((section) =>
          section.steps.map((step) => {
            const howTo = content[section.id]?.[step.id];
            if (!howTo) return null;
            const isActive = activeSectionId === section.id && activeStepId === step.id;
            return (
              <div
                key={`${section.id}-${step.id}`}
                className={cn(
                  "rounded border p-3",
                  isActive ? "border-cyan-500/50 bg-cyan-500/5" : "border-zinc-700 bg-zinc-900/30"
                )}
              >
                <h4 className="text-sm font-medium text-zinc-200 mb-2">{step.title}</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-zinc-500">Goal</dt>
                    <dd className="text-zinc-300">{howTo.goal}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Do this</dt>
                    <dd className="text-zinc-300">{howTo.doThis}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Common fail</dt>
                    <dd className="text-amber-400/90">{howTo.commonFail}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Success looks like</dt>
                    <dd className="text-emerald-400/90">{howTo.successLooksLike}</dd>
                  </div>
                  {howTo.logIt && howTo.logIt.length > 0 && (
                    <div>
                      <dt className="text-zinc-500">Log it</dt>
                      <dd className="flex flex-wrap gap-2 mt-1">
                        {howTo.logIt.map((f) => {
                          const log = setupLog[step.id] ?? {};
                          return (
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
                          );
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SetupOptimizeTab({
  onApply,
}: {
  onApply: (rec: { title: string; suggestedChange?: string }) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <h4 className="text-sm font-medium">Tonight&apos;s Conditions</h4>
        </CardHeader>
        <CardContent className="py-0 pb-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-zinc-500">Bortle</span><span>8</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Moon</span><span>25%</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Clouds</span><span>10%</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Temp drop</span><span>~5°F tonight</span></div>
        </CardContent>
      </Card>

      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recommendations</div>
        <div className="space-y-2">
          {OPTIMIZE_RECOMMENDATIONS.map((rec) => (
            <div
              key={rec.id}
              className="rounded border border-zinc-700 bg-zinc-900/30 p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm font-medium text-zinc-200">{rec.title}</span>
                <span className="text-xs text-cyan-400 shrink-0">{rec.confidence}%</span>
              </div>
              <p className="text-xs text-zinc-400">{rec.why}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => onApply(rec)}
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupPhaseContent({
  mission,
  rig,
  setupLog,
  checkedSteps,
  preflightStatuses,
  onLogChange,
  onCheckedChange,
  onPreflightChange,
  onUpdateMission,
  onUpdateRig,
  onStartMission,
}: {
  mission: Mission;
  rig: RigProfile;
  setupLog: MissionSetupLog;
  checkedSteps: Record<string, boolean>;
  preflightStatuses: Record<string, PreflightStatus>;
  onLogChange: (stepId: string, field: string, value: string | number) => void;
  onCheckedChange: (stepId: string, checked: boolean) => void;
  onPreflightChange: (key: string, status: PreflightStatus) => void;
  onUpdateMission: (updates: Partial<Mission>) => void;
  onUpdateRig: (updates: Partial<RigProfile>) => void;
  onStartMission: () => void;
}) {
  const [tab, setTab] = useState<SetupTab>("checklist");
  const [howToScroll, setHowToScroll] = useState<{ sectionId: string; stepId: string } | null>(null);

  const handleJumpToHowTo = (sectionId: string, stepId: string) => {
    setTab("howto");
    setHowToScroll({ sectionId, stepId });
  };

  const handleNoteAppend = (line: string) => {
    const prev = mission.notes ?? "";
    onUpdateMission({ notes: prev ? `${prev}\n${line}` : line });
  };

  const handleApply = (rec: { title: string; suggestedChange?: string }) => {
    const suffix = rec.suggestedChange ? ` (${rec.suggestedChange})` : "";
    handleNoteAppend(`[Optimize] ${rec.title}${suffix}`);
  };

  const tabs: { id: SetupTab; label: string }[] = [
    { id: "checklist", label: "Checklist" },
    { id: "howto", label: "How-To" },
    { id: "optimize", label: "Optimize" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-700 mb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === "checklist" && (
          <SetupChecklistTab
            setupLog={setupLog}
            checkedSteps={checkedSteps}
            preflightStatuses={preflightStatuses}
            onLogChange={onLogChange}
            onCheckedChange={onCheckedChange}
            onPreflightChange={onPreflightChange}
            onJumpToHowTo={handleJumpToHowTo}
            onMarkComplete={() => onUpdateMission({ phase: "capturing" })}
            onStartMission={onStartMission}
          />
        )}
        {tab === "howto" && (
          <SetupHowToTab
            softwareProfileId={rig.softwareProfileId}
            onSoftwareChange={(id) => onUpdateRig({ softwareProfileId: id })}
            activeSectionId={howToScroll?.sectionId ?? null}
            activeStepId={howToScroll?.stepId ?? null}
            setupLog={setupLog}
            onLogChange={onLogChange}
          />
        )}
        {tab === "optimize" && (
          <SetupOptimizeTab onApply={handleApply} />
        )}
      </div>
    </div>
  );
}

function PhasePlaceholder({ phase }: { phase: MissionPhase }) {
  const labels: Record<MissionPhase, string> = {
    planning: "Planning",
    setup: "Setup",
    capturing: "Capturing",
    logging: "Logging",
    completed: "Completed",
  };
  return (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-sm">
      <p>{labels[phase]} phase</p>
      <p className="text-xs mt-1">Empty state — content coming soon</p>
    </div>
  );
}

export function MissionSidebar({ mission, rig, onUpdateMission, onUpdateRig }: MissionSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [setupLog, setSetupLog] = useState<MissionSetupLog>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [preflightStatuses, setPreflightStatuses] = useState<Record<string, PreflightStatus>>({});

  const phase: MissionPhase = mission.phase ?? "planning";

  const handleLogChange = useCallback((stepId: string, field: string, value: string | number) => {
    setSetupLog((prev) => ({
      ...prev,
      [stepId]: { ...(prev[stepId] ?? {}), [field]: value },
    }));
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900/80 border-l border-zinc-700">
      <div className="p-3 border-b border-zinc-700 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-zinc-200">Mission Sidebar</h3>
        <span className="text-xs text-zinc-500 capitalize">{phase}</span>
      </div>
      <div className="flex-1 overflow-hidden p-3">
        {phase === "setup" ? (
          <SetupPhaseContent
            mission={mission}
            rig={rig}
            setupLog={setupLog}
            checkedSteps={checkedSteps}
            preflightStatuses={preflightStatuses}
            onLogChange={handleLogChange}
            onCheckedChange={handleCheckedChange}
            onPreflightChange={handlePreflightChange}
            onUpdateMission={onUpdateMission}
            onUpdateRig={onUpdateRig}
            onStartMission={handleStartMission}
          />
        ) : (
          <PhasePlaceholder phase={phase} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-40 rounded border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200 lg:hidden"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
      </button>
      <aside
        className={cn(
          "flex flex-col shrink-0 transition-all duration-200",
          isOpen ? "flex" : "hidden",
          "lg:flex lg:relative lg:w-[360px]",
          isOpen && "fixed right-0 top-16 bottom-0 z-30 w-[min(360px,90vw)] lg:static"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
