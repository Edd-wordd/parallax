"use client";

import { useState } from "react";
import { MissionTimeline } from "@/components/MissionTimeline";
import { Button } from "@/components/ui/button";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { ConditionsCard } from "@/components/missions/ConditionsCard";
import type { Mission, MissionTarget } from "@/lib/types";
import type { ConditionsState } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";

const PANEL_STYLE = "mission-panel";

const QUICK_EVENT_LABELS = [
  "Clouds moving in",
  "Guiding lost",
  "Meridian flip",
  "Conditions improved",
] as const;

export interface CapturingViewProps {
  mission: Mission;
  noteLog: { text: string; at: string }[];
  isReadOnlySession: boolean;
  isFieldMode: boolean;
  currentTarget: MissionTarget | null;
  currentTargetId: string | null;
  selectedTarget: MissionTarget | null;
  nextTarget: MissionTarget | null;
  nextTargetLabel: string | null;
  selectedTargetId: string | null;
  conditions: ConditionsState;
  conditionsLog: {
    id: string;
    at: string;
    seeing: number;
    transparency: number;
    clouds: number;
    wind: string;
    moonGlare: boolean;
  }[];
  isOffline: boolean;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  onMarkTargetComplete: () => void;
  onStampConditions: () => void;
  onConditionsChange: (c: Partial<ConditionsState>) => void;
  onResetConditions: () => void;
  onUpdatePlan: () => void;
}

export function CapturingView({
  mission,
  noteLog,
  isReadOnlySession,
  isFieldMode,
  currentTarget,
  currentTargetId,
  selectedTarget,
  nextTarget,
  nextTargetLabel,
  selectedTargetId,
  conditions,
  conditionsLog,
  isOffline,
  onAddNote,
  onQuickEvent,
  onMarkTargetComplete,
  onStampConditions,
  onConditionsChange,
  onResetConditions,
  onUpdatePlan,
}: CapturingViewProps) {
  const [noteInput, setNoteInput] = useState("");

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteInput.trim();
    if (!text) return;
    onAddNote(text);
    setNoteInput("");
  };

  const activeTargetSeqLabel =
    currentTarget &&
    (currentTarget.roleLabel ??
      (currentTarget.isFallback
        ? "Fallback"
        : `SEQ ${currentTarget.sequenceIndex ?? 1}`));

  const showTransitionBanner =
    currentTarget?.targetName.toLowerCase().includes("pleiades") &&
    nextTarget?.targetName.toLowerCase().includes("m42");

  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Offline mode active — data will sync when reconnected
        </div>
      )}

      {showTransitionBanner && (
        <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          Pleiades window closes in 15 min — prepare to advance to M42
        </div>
      )}

      {/* Top row: Notes / Quick events + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Notes / Session log */}
        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
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
        </section>

        {/* Timeline + next target countdown */}
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
                  {activeTargetSeqLabel && (
                    <span className="uppercase text-[10px] text-zinc-500">
                      {activeTargetSeqLabel}
                    </span>
                  )}
                  <span className="tabular-nums">
                    Window: {currentTarget.plannedWindowStart} –{" "}
                    {currentTarget.plannedWindowEnd}
                  </span>
                </>
              )}
              {nextTargetLabel && (
                <span className="text-cyan-300 tabular-nums">
                  Next: {nextTargetLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-3">
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

      {/* Target queue + Selected target */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cn(PANEL_STYLE, "p-4")}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mission-section-label">Target Queue</h2>
            <span className="text-[11px] text-zinc-500">
              Read-only while capturing
            </span>
          </div>
          {mission.targets.length === 0 ? (
            <div className="py-8 text-center rounded-lg border border-dashed border-white/10">
              <p className="text-sm text-zinc-500">
                No targets in this mission.
              </p>
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
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                      isSelected
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums",
                          t.isFallback ? "text-amber-400/80" : "text-zinc-500",
                        )}
                      >
                        {seqLabel}
                      </span>
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
                      {isSelected && (
                        <span className="text-[10px] shrink-0 font-medium uppercase text-violet-400">
                          {isActiveTarget ? "Active" : "Selected"}
                        </span>
                      )}
                    </div>

                    {isActiveTarget && (
                      <div className="flex items-center gap-3 text-xs text-zinc-300">
                        <div className="flex flex-col flex-1 gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">
                              Frame 24 / 60
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Live capture
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                            <div className="h-full w-[40%] rounded-full bg-cyan-400" />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="cta"
                          onClick={onMarkTargetComplete}
                          className="shrink-0 h-8 px-3 text-xs"
                          disabled={isReadOnlySession}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <SelectedTargetCard
          target={selectedTarget}
          onMakePrimary={undefined}
          onRemove={undefined}
          isPrimary={currentTargetId === selectedTarget?.targetId}
        />
      </div>

      {/* Observing conditions + Field conditions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Observing conditions — simple snapshot card */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <h2 className="mission-section-label">Observing Conditions</h2>
          <p className="text-xs text-zinc-500">
            Forecast snapshot for tonight&apos;s session. Read-only.
          </p>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Forecast confidence</span>
              <span className="text-zinc-200 font-medium">78%</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Cloud cover</span>
              <span className="text-zinc-200 font-medium">18%</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Humidity</span>
              <span className="text-zinc-200 font-medium">67%</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Seeing</span>
              <span className="text-zinc-200 font-medium">3 / 5</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Wind</span>
              <span className="text-zinc-200 font-medium">8 mph</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Moon impact</span>
              <span className="text-zinc-200 font-medium">Low</span>
            </div>
          </div>
        </section>

        {/* Field conditions — override only */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <h2 className="mission-section-label">Field Conditions</h2>
          <p className="text-xs text-zinc-500">
            Override forecast with live field readings.
          </p>
          <ConditionsCard
            conditions={conditions}
            onChange={onConditionsChange}
            onReset={onResetConditions}
            readOnly={false}
            className="mt-1"
          />
          <p className="text-[11px] text-zinc-500">
            Adjustments affect mission guidance only.
          </p>
        </section>
      </div>

      {/* Conditions timeline stamp */}
      <section className={cn(PANEL_STYLE, "p-4 mt-4 flex items-center justify-between gap-2 text-xs text-zinc-400")}>
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-[10px] text-zinc-500">
            Conditions timeline
          </span>
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={onStampConditions}
            className="h-6 px-2 text-[10px] border-white/10 bg-white/5"
          >
            Stamp now
          </Button>
        </div>
        {conditionsLog.length > 0 && (
          <span className="text-[10px] text-zinc-500">
            {conditionsLog.length} stamps
          </span>
        )}
      </section>
    </div>
  );
}

