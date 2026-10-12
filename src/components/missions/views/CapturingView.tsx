"use client";

import { MissionTimeline } from "@/components/MissionTimeline";
import { Button } from "@/components/ui/button";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { MissionConditionsPanel } from "@/components/missions/MissionConditionsPanel";
import { SessionObservingLog } from "@/components/missions/SessionObservingLog";
import { CaptureWorksheet } from "@/components/missions/CaptureWorksheet";
import type { Mission, MissionTarget } from "@/lib/types";
import type { ConditionsState } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";
import {
  hasTimedSchedule,
  targetScheduleLabel,
} from "@/lib/schedule/display";
import {
  actualLabel,
  fromDatetimeLocalValue,
  scheduleSummaryLines,
  toDatetimeLocalValue,
  transitionMinutesOf,
} from "@/lib/schedule/observing";
import { sessionWindowFromMission } from "@/lib/time/sessionWindow";
import type { ConditionLogRow, MissionEventRow } from "@/lib/schemas";
import type { ManualFieldReadingPayload } from "@/lib/supabase/queries/conditionLogs";

const PANEL_STYLE = "mission-panel";

export interface CapturingViewProps {
  mission: Mission;
  isReadOnlySession: boolean;
  isFieldMode: boolean;
  currentTarget: MissionTarget | null;
  currentTargetId: string | null;
  selectedTarget: MissionTarget | null;
  nextTarget: MissionTarget | null;
  nextTargetLabel: string | null;
  selectedTargetId: string | null;
  conditions: ConditionsState;
  conditionLogs: ConditionLogRow[];
  missionEvents: MissionEventRow[];
  latestFieldReadingEventId?: string | null;
  lat?: number | null;
  lon?: number | null;
  siteTimezone?: string | null;
  siteName?: string | null;
  isOffline: boolean;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  onMarkTargetComplete: () => void;
  onPatchTarget: (targetId: string, patch: Partial<MissionTarget>) => void;
  onConditionsChange: (c: Partial<ConditionsState>) => void;
  onCommitReading: (reading: ManualFieldReadingPayload) => Promise<void> | void;
  committingReading?: boolean;
  readingError?: string | null;
  onUpdatePlan: () => void;
  cameraName?: string | null;
}

export function CapturingView({
  mission,
  isReadOnlySession,
  isFieldMode,
  currentTarget,
  currentTargetId,
  selectedTarget,
  nextTarget,
  nextTargetLabel,
  selectedTargetId,
  conditions,
  conditionLogs,
  missionEvents,
  latestFieldReadingEventId = null,
  lat = null,
  lon = null,
  siteTimezone = null,
  siteName = null,
  isOffline,
  onAddNote,
  onQuickEvent,
  onMarkTargetComplete,
  onPatchTarget,
  onConditionsChange,
  onCommitReading,
  committingReading = false,
  readingError = null,
  onUpdatePlan,
  cameraName = null,
}: CapturingViewProps) {
  const sessionWindow = sessionWindowFromMission({
    dateTime: mission.dateTime,
    sessionEndAt: mission.sessionEndAt,
  });
  const availableMinutes = Math.max(
    0,
    Math.round(
      (sessionWindow.end.getTime() - sessionWindow.start.getTime()) / 60_000,
    ),
  );

  const summaryLines = scheduleSummaryLines({
    mission,
    current: currentTarget,
    next: nextTarget,
  });

  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          You appear offline. Changes are only saved when the write succeeds —
          there is no automatic sync queue.
        </div>
      )}

      <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400">
        Record what you captured — Parallax does not control the camera or
        receive live telemetry.
      </div>

      {/* Top row: Observing log + Schedule */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <SessionObservingLog
            events={missionEvents}
            isReadOnly={isReadOnlySession}
            onAddNote={onAddNote}
            onQuickEvent={onQuickEvent}
          />
        </section>

        {/* Schedule summary (authoritative for this slice; mock timeline demoted) */}
        <section
          className={cn(
            PANEL_STYLE,
            "p-4 min-h-0 flex flex-col overflow-hidden",
          )}
        >
          <div className="flex items-center justify-between mb-3 text-sm">
            <h2 className="mission-section-label mb-0">Night schedule</h2>
            <span className="text-[10px] text-zinc-500">
              Transition {transitionMinutesOf(mission)} min
            </span>
          </div>

          <div className="space-y-2 text-xs text-zinc-300">
            {summaryLines.map((line) => (
              <p key={line} className="tabular-nums">
                {line}
              </p>
            ))}
            {nextTargetLabel && (
              <p className="text-cyan-300/90">{nextTargetLabel}</p>
            )}
          </div>

          {currentTarget && !isReadOnlySession && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Actual (manual)
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-[11px] text-zinc-500">
                  Actual start
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(currentTarget.actualStartAt)}
                    onChange={(e) =>
                      onPatchTarget(currentTarget.targetId, {
                        actualStartAt: fromDatetimeLocalValue(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
                  />
                </label>
                <label className="text-[11px] text-zinc-500">
                  Actual end
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(currentTarget.actualEndAt)}
                    onChange={(e) =>
                      onPatchTarget(currentTarget.targetId, {
                        actualEndAt: fromDatetimeLocalValue(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
                  />
                </label>
                <label className="text-[11px] text-zinc-500">
                  Frames captured
                  <input
                    type="number"
                    min={0}
                    value={currentTarget.frames ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      onPatchTarget(currentTarget.targetId, {
                        frames:
                          e.target.value === ""
                            ? undefined
                            : Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
                  />
                </label>
                <label className="text-[11px] text-zinc-500">
                  Exposure length (s)
                  <input
                    type="number"
                    min={0}
                    value={currentTarget.subLength ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      onPatchTarget(currentTarget.targetId, {
                        subLength:
                          e.target.value === ""
                            ? undefined
                            : Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
                  />
                </label>
              </div>
              <label className="block text-[11px] text-zinc-500">
                Notes
                <input
                  type="text"
                  value={currentTarget.notes ?? ""}
                  onChange={(e) =>
                    onPatchTarget(currentTarget.targetId, {
                      notes: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
                  placeholder="Optional"
                />
              </label>
              {actualLabel(currentTarget) && (
                <p className="text-[11px] text-emerald-400/90 tabular-nums">
                  Actual: {actualLabel(currentTarget)}
                </p>
              )}
            </div>
          )}

          {/* Demoted mock timeline — not schedule SoT */}
          <details className="mt-3">
            <summary className="cursor-pointer text-[10px] text-zinc-600">
              Legacy timeline preview (Demo geometry)
            </summary>
            <div className="mt-2 opacity-60">
              <MissionTimeline
                targets={mission.targets}
                missionDate={mission.dateTime}
                hero
                selectedTargetId={selectedTargetId ?? currentTargetId ?? null}
                currentTargetId={currentTargetId ?? undefined}
                fieldMode={isFieldMode}
              />
            </div>
          </details>
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
                            {targetScheduleLabel(t)}
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
                      <div className="flex items-center justify-between gap-3 text-xs text-zinc-300">
                        <span className="text-[11px] text-zinc-500">
                          Planned {targetScheduleLabel(t)}
                          {hasTimedSchedule(t) ? "" : " (usable window)"}
                        </span>
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

      {mission.targets.length > 0 && (
        <section className={cn(PANEL_STYLE, "p-4 mt-4")}>
          <CaptureWorksheet
            targets={mission.targets}
            transitionMinutes={transitionMinutesOf(mission)}
            availableMinutes={availableMinutes}
            cameraName={cameraName}
            hasSkyContext
            hasTrackingHint={!!cameraName}
            readOnly={isReadOnlySession}
            onPatchTarget={onPatchTarget}
            compact
          />
        </section>
      )}

      <MissionConditionsPanel
        lat={lat}
        lon={lon}
        dateTime={mission.dateTime}
        sessionEndAt={mission.sessionEndAt}
        siteTimezone={siteTimezone}
        siteName={siteName}
        conditions={conditions}
        onConditionsChange={onConditionsChange}
        conditionLogs={conditionLogs}
        latestFieldReadingEventId={latestFieldReadingEventId}
        onCommitReading={onCommitReading}
        committing={committingReading}
        commitError={readingError}
        className="mt-4"
      />
    </div>
  );
}

