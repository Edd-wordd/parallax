"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buildNightSchedule } from "@/lib/schedule/buildNightSchedule";
import {
  DEFAULT_IMAGING_MINUTES,
  DEFAULT_TRANSITION_MINUTES,
  MAX_TRANSITION_MINUTES,
  MIN_TRANSITION_MINUTES,
  type NightScheduleResult,
  type ScheduleTargetInput,
} from "@/lib/schedule/types";
import type { DashboardRecommendation } from "@/lib/recommendations/types";
import { recommendationToScheduleInput } from "@/lib/schedule/applySchedule";

export type ScheduleReviewRow = {
  catalogId: string;
  name: string;
  desiredMinutes: number;
  recommendation: DashboardRecommendation;
};

interface NightScheduleReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  sessionStart: Date;
  sessionEnd: Date;
  rows: ScheduleReviewRow[];
  initialTransitionMinutes?: number;
  proposalNote?: string | null;
  onAccept: (result: NightScheduleResult, orderedRows: ScheduleReviewRow[]) => void;
}

const SEGMENT_COLORS = [
  "bg-sky-500/80",
  "bg-emerald-500/80",
  "bg-amber-500/80",
  "bg-violet-500/80",
  "bg-rose-500/80",
];

function pctInSession(t: Date, sessionStart: Date, sessionEnd: Date): number {
  const span = sessionEnd.getTime() - sessionStart.getTime();
  if (span <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, ((t.getTime() - sessionStart.getTime()) / span) * 100),
  );
}

export function NightScheduleReview({
  open,
  onOpenChange,
  title = "Review night schedule",
  sessionStart,
  sessionEnd,
  rows: initialRows,
  initialTransitionMinutes = DEFAULT_TRANSITION_MINUTES,
  proposalNote: initialProposalNote = null,
  onAccept,
}: NightScheduleReviewProps) {
  const [rows, setRows] = useState<ScheduleReviewRow[]>(initialRows);
  const [transitionMinutes, setTransitionMinutes] = useState(
    initialTransitionMinutes,
  );
  const [proposalNote, setProposalNote] = useState(initialProposalNote);

  useEffect(() => {
    if (!open) return;
    setRows(initialRows);
    setTransitionMinutes(initialTransitionMinutes);
    setProposalNote(initialProposalNote);
  }, [open, initialRows, initialTransitionMinutes, initialProposalNote]);

  const scheduleInputs: ScheduleTargetInput[] = useMemo(
    () =>
      rows.map((r) =>
        recommendationToScheduleInput(r.recommendation, r.desiredMinutes),
      ),
    [rows],
  );

  const result = useMemo(
    () =>
      buildNightSchedule({
        sessionStart,
        sessionEnd,
        targets: scheduleInputs,
        transitionMinutes,
      }),
    [sessionStart, sessionEnd, scheduleInputs, transitionMinutes],
  );

  const conflictById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of result.conflicts) {
      m.set(c.catalogId, c.reason);
    }
    return m;
  }, [result.conflicts]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setRows(next);
    setProposalNote(null);
  };

  const setMinutes = (catalogId: string, minutes: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.catalogId === catalogId
          ? { ...r, desiredMinutes: Math.max(1, Math.round(minutes)) }
          : r,
      ),
    );
    setProposalNote(null);
  };

  const applySuggested = (catalogId: string, minutes: number) => {
    setMinutes(catalogId, minutes);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <DialogContent className="relative max-h-[90vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Close
          </button>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-[11px] text-zinc-500">
            Times are in your device timezone. Overnight segments show calendar
            dates.
          </p>

          {(proposalNote || result.proposalNote) && (
            <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-300">
              {proposalNote ?? result.proposalNote}
            </div>
          )}

          {result.conflicts.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              <p className="font-medium text-amber-200">
                {result.conflicts.length} target
                {result.conflicts.length !== 1 ? "s" : ""} could not be
                scheduled
              </p>
              <p className="mt-1 text-amber-100/80">
                Reorder, reduce a duration, or remove a target — nothing is
                shortened automatically.
              </p>
            </div>
          )}

          {/* Desktop horizontal timeline */}
          <div className="hidden sm:block">
            <div className="mb-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
              <span>Session start</span>
              <span>{result.unusedMinutes} min unused</span>
              <span>Session end</span>
            </div>
            <div className="relative h-10 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/80">
              <div className="absolute inset-0 bg-zinc-800/40" />
              {result.segments.map((seg, i) => {
                const left = pctInSession(seg.start, sessionStart, sessionEnd);
                const right = pctInSession(seg.end, sessionStart, sessionEnd);
                const width = Math.max(1, right - left);
                return (
                  <div
                    key={seg.catalogId}
                    className={cn(
                      "absolute top-1 bottom-1 rounded-sm px-1 text-[9px] font-medium text-white/90 truncate",
                      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${seg.name}: ${seg.label}`}
                  >
                    {seg.name}
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500">
              {result.segments.map((seg, i) => (
                <span key={seg.catalogId} className="tabular-nums">
                  <span
                    className={cn(
                      "mr-1 inline-block h-2 w-2 rounded-sm",
                      SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    )}
                  />
                  {seg.name}: {seg.label} ({seg.imagingMinutes}m)
                </span>
              ))}
              {result.segments.length > 1 && (
                <span className="text-zinc-600">
                  · {transitionMinutes} min transitions
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-zinc-400">
              Transition (min)
              <input
                type="number"
                min={MIN_TRANSITION_MINUTES}
                max={MAX_TRANSITION_MINUTES}
                value={transitionMinutes}
                onChange={(e) =>
                  setTransitionMinutes(
                    Math.min(
                      MAX_TRANSITION_MINUTES,
                      Math.max(
                        MIN_TRANSITION_MINUTES,
                        Number(e.target.value) || DEFAULT_TRANSITION_MINUTES,
                      ),
                    ),
                  )
                }
                className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm tabular-nums text-zinc-100"
              />
            </label>
            <p className="pb-1.5 text-[10px] text-zinc-600">
              Default imaging {DEFAULT_IMAGING_MINUTES} min · gaps{" "}
              {MIN_TRANSITION_MINUTES}–{MAX_TRANSITION_MINUTES} min
            </p>
          </div>

          {/* Ordered list (mobile + desktop edits) */}
          <ol className="space-y-2">
            {rows.map((row, index) => {
              const conflict = conflictById.get(row.catalogId);
              const segment = result.segments.find(
                (s) => s.catalogId === row.catalogId,
              );
              const suggestion = result.conflicts.find(
                (c) => c.catalogId === row.catalogId,
              )?.suggestedMaxMinutes;
              return (
                <li
                  key={row.catalogId}
                  className={cn(
                    "rounded-md border px-3 py-2",
                    conflict
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-zinc-800/60 bg-zinc-900/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={index === rows.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-100">
                          {index + 1}. {row.name}
                        </p>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          Duration
                          <input
                            type="number"
                            min={1}
                            max={360}
                            value={row.desiredMinutes}
                            onChange={(e) =>
                              setMinutes(
                                row.catalogId,
                                Number(e.target.value) || 1,
                              )
                            }
                            className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs tabular-nums text-zinc-100"
                          />
                          min
                        </label>
                      </div>
                      <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
                        Usable: {row.recommendation.windowLabel} (
                        {row.recommendation.windowDurationMinutes} min)
                      </p>
                      {segment && (
                        <p className="mt-0.5 text-[11px] tabular-nums text-emerald-400/90">
                          Scheduled: {segment.label}
                        </p>
                      )}
                      {conflict && (
                        <div className="mt-1.5 space-y-1">
                          <p className="text-[11px] text-amber-200/90">
                            {conflict}
                          </p>
                          {suggestion != null && suggestion > 0 && (
                            <button
                              type="button"
                              className="text-[11px] text-sky-400 hover:text-sky-300"
                              onClick={() =>
                                applySuggested(row.catalogId, suggestion)
                              }
                            >
                              Use {suggestion} min instead
                            </button>
                          )}
                        </div>
                      )}
                      {row.recommendation.rigFit === "small_in_frame" && (
                        <p className="mt-1 text-[10px] text-zinc-500">
                          Rig: small in frame (warning only)
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="cta"
            size="sm"
            disabled={result.segments.length === 0}
            onClick={() => {
              const accepted: NightScheduleResult = {
                ...result,
                proposalNote: proposalNote ?? result.proposalNote,
              };
              onAccept(accepted, rows);
            }}
          >
            {result.ok
              ? "Accept schedule"
              : `Accept ${result.segments.length} scheduled`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
