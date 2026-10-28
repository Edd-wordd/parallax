"use client";

import { useMemo, useState } from "react";
import { SessionClock } from "@/components/missions/SessionClock";
import { Button } from "@/components/ui/button";
import { ObservingTimeline } from "@/components/missions/ObservingTimeline";
import { MissionConditionsPanel } from "@/components/missions/MissionConditionsPanel";
import type { Mission } from "@/lib/types";
import type { ConditionsState } from "@/lib/missionUIStore";
import { cn } from "@/lib/utils";
import { targetScheduleLabel } from "@/lib/schedule/display";
import {
  actualLabel,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/schedule/observing";
import type { ConditionLogRow, MissionEventRow } from "@/lib/schemas";
import type { ManualFieldReadingPayload } from "@/lib/supabase/queries/conditionLogs";
import { derivedFrames } from "@/lib/capture/worksheetMath";
import { sessionWindowFromMission } from "@/lib/time/sessionWindow";

const PANEL_STYLE = "mission-panel";

type TargetResultStatus = "success" | "partial" | "failed" | "skipped";

export type SessionLogPayload = {
  outcomeScore: number;
  whatILearned: string;
  targets: {
    catalogId: string;
    targetName: string;
    result: TargetResultStatus | null;
    framesCaptured: number | null;
    exposureSeconds: number | null;
    iso: number | null;
    gain: number | null;
    notes: string;
    actualStartAt: string | null;
    actualEndAt: string | null;
    plannedFilter?: string | null;
    plannedSubLengthSeconds?: number | null;
    plannedIso?: number | null;
    plannedGain?: number | null;
    plannedIntegrationMinutes?: number | null;
    plannedFrames?: number | null;
  }[];
};

interface LoggingViewProps {
  mission: Mission;
  conditions: ConditionsState;
  conditionLogs: ConditionLogRow[];
  missionEvents: MissionEventRow[];
  latestFieldReadingEventId?: string | null;
  lat?: number | null;
  lon?: number | null;
  siteTimezone?: string | null;
  siteName?: string | null;
  onConditionsChange: (c: Partial<ConditionsState>) => void;
  onCommitReading: (reading: ManualFieldReadingPayload) => Promise<void> | void;
  committingReading?: boolean;
  readingError?: string | null;
  /** Outcomes form locked after Save Log; readings/events may still append. */
  logFormLocked?: boolean;
  onSaveLog: (payload: SessionLogPayload) => void;
  saving?: boolean;
}

type TargetLogState = {
  status: TargetResultStatus | null;
  framesCaptured: number | null;
  subLengthSeconds: number | null;
  iso: number | null;
  gain: number | null;
  notes: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
};

type PerTargetState = Record<string, TargetLogState>;

function emptyTargetState(t: Mission["targets"][number]): TargetLogState {
  // Actual frames blank until recorded; seed settings from proposed worksheet.
  const hasActualFrames = t.frames != null && t.frames > 0;
  return {
    status: t.result ?? null,
    framesCaptured: hasActualFrames ? t.frames! : null,
    subLengthSeconds:
      t.subLength ?? t.proposedSubLengthSeconds ?? null,
    iso: t.proposedIso ?? null,
    gain: t.proposedGain ?? null,
    notes: t.notes ?? "",
    actualStartAt: t.actualStartAt ?? null,
    actualEndAt: t.actualEndAt ?? null,
  };
}

export function LoggingView({
  mission,
  conditions,
  conditionLogs,
  missionEvents,
  latestFieldReadingEventId = null,
  lat = null,
  lon = null,
  siteTimezone = null,
  siteName = null,
  onConditionsChange,
  onCommitReading,
  committingReading = false,
  readingError = null,
  logFormLocked = false,
  onSaveLog,
  saving = false,
}: LoggingViewProps) {
  const [overallNotes, setOverallNotes] = useState("");
  const [outcomeScore, setOutcomeScore] = useState(7);

  const initialPerTargetState: PerTargetState = useMemo(() => {
    const byId: PerTargetState = {};
    for (const t of mission?.targets ?? []) {
      byId[t.targetId] = emptyTargetState(t);
    }
    return byId;
  }, [mission]);

  const [perTargetState, setPerTargetState] =
    useState<PerTargetState>(initialPerTargetState);

  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      const targets = mission?.targets ?? [];
      for (const t of targets) initial[t.targetId] = true;
      return initial;
    },
  );

  const handleToggleExpanded = (targetId: string) => {
    setExpandedTargets((prev) => ({
      ...prev,
      [targetId]: !prev[targetId],
    }));
  };

  const updateTargetState = (
    targetId: string,
    partial: Partial<TargetLogState>,
  ) => {
    setPerTargetState((prev) => {
      const fallback: TargetLogState = {
        status: null,
        framesCaptured: null,
        subLengthSeconds: null,
        iso: null,
        gain: null,
        notes: "",
        actualStartAt: null,
        actualEndAt: null,
      };
      const current = prev[targetId] ?? fallback;
      return {
        ...prev,
        [targetId]: { ...current, ...partial },
      };
    });
  };

  const computeIntegrationMinutes = (targetId: string) => {
    const state = perTargetState[targetId];
    if (
      !state ||
      state.framesCaptured == null ||
      state.subLengthSeconds == null ||
      state.framesCaptured < 0 ||
      state.subLengthSeconds <= 0
    ) {
      return null;
    }
    const minutes =
      (state.framesCaptured * state.subLengthSeconds) / 60;
    return Math.round(minutes * 10) / 10;
  };

  return (
    <div className="space-y-4">
      <div className="theme-action-bar sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Night score (1–10)
          <select
            value={outcomeScore}
            onChange={(e) => setOutcomeScore(Number(e.target.value))}
            disabled={logFormLocked}
            className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-zinc-100 disabled:opacity-50"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="cta"
          size="sm"
          disabled={saving || logFormLocked}
          onClick={() =>
            onSaveLog({
              outcomeScore,
              whatILearned: overallNotes.trim(),
              targets: (mission.targets ?? []).map((t) => {
                const state = perTargetState[t.targetId];
                return {
                  catalogId: t.targetId,
                  targetName: t.targetName,
                  result: state?.status ?? null,
                  framesCaptured: state?.framesCaptured ?? null,
                  exposureSeconds: state?.subLengthSeconds ?? null,
                  iso: state?.iso ?? null,
                  gain: state?.gain ?? null,
                  notes: state?.notes ?? "",
                  actualStartAt: state?.actualStartAt ?? null,
                  actualEndAt: state?.actualEndAt ?? null,
                  plannedFilter: t.proposedFilter ?? null,
                  plannedSubLengthSeconds: t.proposedSubLengthSeconds ?? null,
                  plannedIso: t.proposedIso ?? null,
                  plannedGain: t.proposedGain ?? null,
                  plannedIntegrationMinutes:
                    t.proposedIntegrationMinutes ?? null,
                  plannedFrames: derivedFrames(
                    t.proposedIntegrationMinutes,
                    t.proposedSubLengthSeconds,
                  ),
                };
              }),
            })
          }
          className="mission-page-cta"
        >
          {saving ? "Saving…" : logFormLocked ? "Log saved" : "Save Log"}
        </Button>
      </div>

      {/* Top row: Notes log + Mission timeline (read-only) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <h2 className="mission-section-label mb-0">Observing log</h2>
          <p className="text-[11px] text-zinc-500">
            Full session timeline — notes, checklist, and field actions.
          </p>
          <ObservingTimeline
            events={missionEvents}
            compact
            emptyMessage="No observing events recorded."
          />
        </section>

        <section
          className={cn(
            PANEL_STYLE,
            "p-4 min-h-0 flex flex-col overflow-hidden",
          )}
        >
          <div className="flex items-center justify-between mb-3 text-sm">
            <h2 className="mission-section-label mb-0">Mission Timeline</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                Logging
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
                Frozen
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <SessionClock
              sessionStart={
                sessionWindowFromMission({
                  dateTime: mission.dateTime,
                  sessionEndAt: mission.sessionEndAt,
                }).start
              }
              sessionEnd={
                sessionWindowFromMission({
                  dateTime: mission.dateTime,
                  sessionEndAt: mission.sessionEndAt,
                }).end
              }
              targets={mission.targets}
            />
          </div>
        </section>
      </div>

      {/* Second row: Target queue + Log form & Conditions timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        {/* Left column: Target queue + log form */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-4")}>
          <h2 className="mission-section-label mb-0">Target Queue</h2>

          {mission.targets.length === 0 ? (
            <div className="py-6 text-center rounded-lg border border-dashed border-white/10">
              <p className="text-sm text-zinc-500">No targets in this mission.</p>
            </div>
          ) : (
            <div className="space-y-2 pointer-events-none select-none">
              {mission.targets.map((t, idx) => {
                const seqLabel =
                  t.roleLabel ??
                  (t.isFallback
                    ? "Fallback"
                    : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                return (
                  <div
                    key={t.targetId}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums text-zinc-500",
                        t.isFallback && "text-amber-400/80",
                      )}
                    >
                      {seqLabel}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="truncate text-sm text-zinc-200">
                          {t.targetName}
                        </span>
                        <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                          {targetScheduleLabel(t)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Log form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400">
                How did the session go overall?
              </label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="How did the session go overall?"
                className="w-full min-h-[80px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              {mission.targets.map((t, idx) => {
                const seqLabel =
                  t.roleLabel ??
                  (t.isFallback
                    ? "Fallback"
                    : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                const logState = perTargetState[t.targetId];
                const integrationMinutes = computeIntegrationMinutes(t.targetId);
                const expanded = expandedTargets[t.targetId] ?? true;

                const resultLabels: Record<TargetResultStatus, string> = {
                  success: "Success",
                  partial: "Partial",
                  failed: "Failed",
                  skipped: "Skipped",
                };

                return (
                  <div
                    key={t.targetId}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums text-zinc-500",
                            t.isFallback && "text-amber-400/80",
                          )}
                        >
                          {seqLabel}
                        </span>
                        <span className="truncate text-sm text-zinc-200">
                          {t.targetName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleExpanded(t.targetId)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200"
                      >
                        {expanded ? "Hide" : "Show"} log
                      </button>
                    </div>

                    <p className="text-[11px] tabular-nums text-zinc-500">
                      Planned: {targetScheduleLabel(t)}
                      {actualLabel({
                        ...t,
                        actualStartAt: logState?.actualStartAt,
                        actualEndAt: logState?.actualEndAt,
                      })
                        ? ` · Actual: ${actualLabel({
                            ...t,
                            actualStartAt: logState?.actualStartAt,
                            actualEndAt: logState?.actualEndAt,
                          })}`
                        : " · Actual: —"}
                    </p>

                    {expanded && (
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-zinc-400 uppercase tracking-wide">
                            Result
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(
                              [
                                "success",
                                "partial",
                                "failed",
                                "skipped",
                              ] as TargetResultStatus[]
                            ).map((status) => {
                                const isActive = logState?.status === status;
                                return (
                                  <Button
                                    key={status}
                                    type="button"
                                    size="sm"
                                    variant={isActive ? "cta" : "secondary"}
                                    className={cn(
                                      "h-7 px-2.5 text-[11px]",
                                      !isActive && "border-white/10 bg-white/5",
                                    )}
                                    onClick={() =>
                                      updateTargetState(t.targetId, { status })
                                    }
                                  >
                                    {resultLabels[status]}
                                  </Button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div className="space-y-1">
                            <label className="text-zinc-400">Actual start</label>
                            <input
                              type="datetime-local"
                              value={toDatetimeLocalValue(
                                logState?.actualStartAt,
                              )}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  actualStartAt: fromDatetimeLocalValue(
                                    e.target.value,
                                  ),
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-zinc-400">Actual end</label>
                            <input
                              type="datetime-local"
                              value={toDatetimeLocalValue(
                                logState?.actualEndAt,
                              )}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  actualEndAt: fromDatetimeLocalValue(
                                    e.target.value,
                                  ),
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Frames captured
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.framesCaptured ?? ""}
                              placeholder="—"
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  framesCaptured:
                                    e.target.value === ""
                                      ? null
                                      : Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Exposure length (s)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.subLengthSeconds ?? ""}
                              placeholder="—"
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  subLengthSeconds:
                                    e.target.value === ""
                                      ? null
                                      : Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              ISO
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.iso ?? ""}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  iso:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value) || 0,
                                })
                              }
                              placeholder={
                                t.proposedIso != null
                                  ? String(t.proposedIso)
                                  : "—"
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100 placeholder:text-zinc-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Gain
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.gain ?? ""}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  gain:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value) || 0,
                                })
                              }
                              placeholder={
                                t.proposedGain != null
                                  ? String(t.proposedGain)
                                  : "—"
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100 placeholder:text-zinc-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Integration time (min)
                            </label>
                            <div className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-100 tabular-nums">
                              {integrationMinutes == null
                                ? "—"
                                : integrationMinutes.toFixed(1)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400">
                            Notes (optional)
                          </label>
                          <textarea
                            value={logState?.notes ?? ""}
                            onChange={(e) =>
                              updateTargetState(t.targetId, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="Optional note for this target…"
                            className="w-full min-h-[60px] rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right column: conditions + observing timeline */}
        <div className="space-y-4">
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
            readOnly={false}
          />
        </div>
      </div>

    </div>
  );
}

