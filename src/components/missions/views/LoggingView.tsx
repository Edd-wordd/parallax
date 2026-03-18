"use client";

import { useMemo, useState } from "react";
import { MissionTimeline } from "@/components/MissionTimeline";
import { Button } from "@/components/ui/button";
import type { Mission } from "@/lib/types";
import { cn } from "@/lib/utils";

const PANEL_STYLE = "mission-panel";

type ConditionsStamp = {
  id: string;
  at: string;
  seeing: number;
  transparency: number;
  clouds: number;
  wind: string;
  moonGlare: boolean;
};

interface LoggingViewProps {
  mission: Mission;
  noteLog: { text: string; at: string }[];
  conditions: {
    seeing: number;
    transparency: number;
    clouds: number;
    wind: string;
    moonGlare: boolean;
  };
  conditionsLog: ConditionsStamp[];
  onSaveLog: () => void;
}

type TargetResultStatus = "success" | "partial" | "failed";

type TargetLogState = {
  status: TargetResultStatus | null;
  framesCaptured: number;
  subLengthSeconds: number;
  notes: string;
};

type PerTargetState = Record<string, TargetLogState>;

export function LoggingView({
  mission,
  noteLog,
  conditions,
  conditionsLog,
  onSaveLog,
}: LoggingViewProps) {
  const [overallNotes, setOverallNotes] = useState("");

  // Mocked values for the logging form.
  const MOCK_FRAME_COUNTER = 24;

  const initialPerTargetState: PerTargetState = useMemo(() => {
    const byId: PerTargetState = {};
    const targets = mission?.targets ?? [];
    for (const t of targets) {
      const frames = t.frames ?? MOCK_FRAME_COUNTER;
      const subLengthSeconds = t.subLength ?? 120;
      byId[t.targetId] = {
        status: null,
        framesCaptured: frames,
        subLengthSeconds,
        notes: "",
      };
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
      const current = prev[targetId] ?? {
        status: null,
        framesCaptured: MOCK_FRAME_COUNTER,
        subLengthSeconds: 120,
        notes: "",
      };
      return {
        ...prev,
        [targetId]: { ...current, ...partial },
      };
    });
  };

  const computeIntegrationMinutes = (targetId: string) => {
    const state = perTargetState[targetId];
    if (!state) return 0;
    const minutes = (state.framesCaptured * state.subLengthSeconds) / 60;
    return Math.round(minutes * 10) / 10;
  };

  return (
    <div className="space-y-4">
      {/* Top row: Notes log + Mission timeline (read-only) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <h2 className="mission-section-label mb-0">Notes / Session Log</h2>
          {noteLog.length > 0 ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto text-[11px] font-mono tabular-nums">
              {noteLog.map((entry) => (
                <div
                  key={entry.at}
                  className="flex gap-2 rounded border border-white/5 bg-black/30 px-2 py-1.5"
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
          ) : (
            <div className="text-xs text-zinc-500">No notes recorded.</div>
          )}
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

          <div className="flex-1 min-h-0 flex flex-col opacity-50 pointer-events-none select-none">
            <MissionTimeline
              targets={mission.targets}
              missionDate={mission.dateTime}
              hero
              selectedTargetId={null}
              currentTargetId={undefined}
              fieldMode={false}
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
                          {t.plannedWindowStart}–{t.plannedWindowEnd}
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

                    {expanded && (
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-zinc-400 uppercase tracking-wide">
                            Result
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(["success", "partial", "failed"] as TargetResultStatus[]).map(
                              (status) => {
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
                              },
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Frames captured
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.framesCaptured ?? 0}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  framesCaptured: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Sub length (s)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={logState?.subLengthSeconds ?? t.subLength ?? 0}
                              onChange={(e) =>
                                updateTargetState(t.targetId, {
                                  subLengthSeconds: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="flex items-center justify-between text-zinc-400">
                              Integration time (min)
                            </label>
                            <div className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-100 tabular-nums">
                              {integrationMinutes.toFixed(1)}
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

        {/* Right column: Conditions timeline (read-only) */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between">
            <h2 className="mission-section-label mb-0">
              Conditions Timeline Stamps
            </h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300 border border-zinc-600/60">
              Read-only
            </span>
          </div>

          {/* Historical snapshot record (read-only) */}
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 space-y-1 text-xs text-zinc-300">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Seeing</span>
              <span className="font-mono tabular-nums">{conditions.seeing}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Transparency</span>
              <span className="font-mono tabular-nums">
                {conditions.transparency}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Cloud Cover</span>
              <span className="font-mono tabular-nums">{conditions.clouds}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Wind</span>
              <span className="font-mono tabular-nums">{conditions.wind}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Moon Glare</span>
              <span className="font-mono tabular-nums">
                {conditions.moonGlare ? "Present" : "Low"}
              </span>
            </div>
          </div>

          {conditionsLog.length === 0 ? (
            <p className="mt-1 text-xs text-zinc-500">
              No condition stamps were recorded during capturing.
            </p>
          ) : (
            <div className="mt-1 space-y-2 max-h-80 overflow-y-auto pr-1">
              {conditionsLog.map((stamp) => (
                <div
                  key={stamp.id}
                  className="rounded-md border border-white/10 bg-black/40 px-3 py-2 space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-300">
                      {new Date(stamp.at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                      Stamp
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-zinc-300">
                    <span>
                      Seeing:{" "}
                      <span className="text-zinc-100">{stamp.seeing} / 5</span>
                    </span>
                    <span>
                      Transparency:{" "}
                      <span className="text-zinc-100">
                        {stamp.transparency} / 5
                      </span>
                    </span>
                    <span>
                      Clouds:{" "}
                      <span className="text-zinc-100">{stamp.clouds} / 5</span>
                    </span>
                    <span>
                      Wind:{" "}
                      <span className="text-zinc-100">{stamp.wind}</span>
                    </span>
                    <span>
                      Moon glare:{" "}
                      <span className="text-zinc-100">
                        {stamp.moonGlare ? "Present" : "Low"}
                      </span>
                    </span>
                  </div>
                  <div className="pt-1">
                    <label className="text-[10px] text-zinc-500">
                      Notes (optional, read-only)
                    </label>
                    <textarea
                      disabled
                      placeholder="Captured during session (not editable in logging)…"
                      className="mt-0.5 w-full min-h-[44px] rounded-md border border-white/5 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-400 placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="pt-3 flex justify-end">
        <Button
          type="button"
          variant="cta"
          size="sm"
          onClick={onSaveLog}
          className="mission-page-cta"
        >
          Save Log
        </Button>
      </div>
    </div>
  );
}

