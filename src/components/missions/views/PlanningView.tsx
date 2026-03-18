"use client";

import { useState } from "react";
import { MissionTimeline } from "@/components/MissionTimeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { ExposurePlannerCard, SessionSimulatorCard } from "@/components/intelligence";
import type { Mission, MissionTarget } from "@/lib/types";
import type { ExposurePlan } from "@/lib/mock/exposurePlans";
import type { SessionSimulation } from "@/lib/mock/sessionSimulations";
import { cn } from "@/lib/utils";
import { Moon, Plus, Target, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

const PANEL_STYLE = "mission-panel";

const QUICK_EVENT_LABELS = [
  "Clouds moving in",
  "Guiding lost",
  "Meridian flip",
  "Conditions improved",
] as const;

export interface PlanningViewProps {
  mission: Mission;
  noteLog: { text: string; at: string }[];
  isReadOnlySession: boolean;
  isFieldMode: boolean;
  currentTarget: MissionTarget | null;
  currentTargetId: string | null;
  selectedTarget: MissionTarget | null;
  primaryTargetName: string | null;
  exposurePlan: ExposurePlan | null;
  sessionSimulation: SessionSimulation | null;
  nextTargetLabel: string | null;
  /** ID of the target currently selected in UI (for highlighting in queue) */
  selectedTargetId: string | null;
  onSimulateNight: () => void;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  onTargetQueueClick: (t: MissionTarget) => void;
  onFocusTarget: (t: MissionTarget, e: React.MouseEvent) => void;
  onMoveTarget: (index: number, dir: "up" | "down") => void;
  onRemoveTarget: (targetId: string, e?: React.MouseEvent) => void;
  onCaptureToggle: (targetId: string) => void;
  onMakePrimary: (t: MissionTarget) => void;
  canEditTargets: boolean;
  onOpenAddTarget: () => void;
}

export function PlanningView({
  mission,
  noteLog,
  isReadOnlySession,
  isFieldMode,
  currentTarget,
  currentTargetId,
  selectedTarget,
  primaryTargetName,
  exposurePlan,
  sessionSimulation,
  nextTargetLabel,
  selectedTargetId,
  onSimulateNight,
  onAddNote,
  onQuickEvent,
  onTargetQueueClick,
  onFocusTarget,
  onMoveTarget,
  onRemoveTarget,
  onCaptureToggle,
  onMakePrimary,
  canEditTargets,
  onOpenAddTarget,
}: PlanningViewProps) {
  const [noteInput, setNoteInput] = useState("");

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteInput.trim();
    if (!text) return;
    onAddNote(text);
    setNoteInput("");
  };

  return (
    <>
      {/* Simulate Night */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSimulateNight}
          className="border-white/10 bg-white/5"
        >
          <Moon className="h-4 w-4 mr-1" />
          Simulate Night
        </Button>
      </div>

      {/* Main row: Notes + Timeline with Go/No-Go */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <h2 className="mission-section-label mb-1">Notes / Session Log</h2>
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
                  <span className="text-zinc-200 leading-snug">{entry.text}</span>
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
                  onClick={() => onQuickEvent(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
          {!isReadOnlySession && (
            <form onSubmit={handleSubmitNote} className="mt-auto flex gap-2 pt-1">
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
          {/* Go/No-Go banner (mocked as Go) */}
          <div
            className={cn(
              "mb-3 flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm",
              "border-emerald-500/40 bg-emerald-500/10",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Go / No-Go
              </span>
              <span className="text-[11px] text-emerald-200/80">
                Based on forecast confidence, clouds, seeing &amp; moon
              </span>
            </div>
            <p className="text-sm font-medium text-emerald-100">
              Tonight looks good — conditions are favorable for your plan.
            </p>
          </div>

          <div className="flex items-center justify-between mb-3 text-sm">
            <h2 className="mission-section-label mb-0">Mission Timeline</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              {currentTarget && (
                <>
                  <span className="font-medium text-zinc-100">
                    {currentTarget.targetName}
                  </span>
                  <span>Phase: planning</span>
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

          <div className="flex-1 min-h-0 flex flex-col">
            <MissionTimeline
              targets={mission.targets}
              missionDate={mission.dateTime}
              hero
              selectedTargetId={selectedTargetId ?? currentTargetId ?? null}
              currentTargetId={currentTargetId ?? undefined}
              fieldMode={isFieldMode}
            />
          </div>
        </section>
      </div>

      {/* Target Queue + Selected Target */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cn(PANEL_STYLE, "p-4")}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mission-section-label">Target Queue</h2>
            {canEditTargets && (
              <Button
                variant="secondary"
                size="sm"
                className="border-white/10 bg-white/5"
                onClick={onOpenAddTarget}
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
              {canEditTargets && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-white/10 bg-white/5"
                  onClick={onOpenAddTarget}
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
                  selectedTargetId === t.targetId || currentTargetId === t.targetId;
                const isActiveTarget = currentTargetId === t.targetId;
                const seqLabel =
                  t.roleLabel ??
                  (t.isFallback ? "Fallback" : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                return (
                  <div
                    key={t.targetId}
                    onClick={() => (canEditTargets ? onTargetQueueClick(t) : undefined)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                      isSelected
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                      canEditTargets ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={cn(
                          "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums",
                          t.isFallback ? "text-amber-400/80" : "text-zinc-500",
                        )}
                      >
                        {seqLabel}
                      </span>
                      {canEditTargets && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-cyan-400"
                            onClick={(e) => onFocusTarget(t, e)}
                            title="Set as Current Focus"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                            onClick={() => onMoveTarget(idx, "up")}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                            onClick={() => onMoveTarget(idx, "down")}
                            disabled={idx === mission.targets.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                            onClick={(e) => onRemoveTarget(t.targetId, e)}
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
                          canEditTargets ? () => onCaptureToggle(t.targetId) : undefined
                        }
                        disabled={!canEditTargets}
                      />
                      <div className="flex-1 min-w-0">
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
                      </div>
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
          onMakePrimary={onMakePrimary}
          onRemove={(t) => onRemoveTarget(t.targetId)}
          isPrimary={currentTargetId === selectedTarget?.targetId}
        />
      </div>

      {/* Exposure Plan + Session Simulator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExposurePlannerCard targetName={primaryTargetName} plan={exposurePlan} />
        <SessionSimulatorCard
          targetName={primaryTargetName}
          simulation={sessionSimulation}
        />
      </div>
    </>
  );
}

