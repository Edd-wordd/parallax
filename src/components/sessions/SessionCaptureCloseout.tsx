"use client";

import { cn } from "@/lib/utils";
import {
  integrationMinutes,
  type SessionTargetRow,
} from "@/lib/schemas";

interface SessionCaptureCloseoutProps {
  targets: SessionTargetRow[];
  className?: string;
}

function plannedBits(t: SessionTargetRow): string | null {
  const parts = [
    t.planned_frames != null ? `${t.planned_frames} frames` : null,
    t.planned_sub_length_seconds != null
      ? `${t.planned_sub_length_seconds}s`
      : null,
    t.planned_integration_minutes != null
      ? `${t.planned_integration_minutes} min`
      : null,
    t.planned_filter ? `filter ${t.planned_filter}` : null,
    t.planned_iso != null ? `ISO ${t.planned_iso}` : null,
    t.planned_gain != null ? `gain ${t.planned_gain}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function varianceNotes(t: SessionTargetRow, actualMin: number): string[] {
  const notes: string[] = [];
  if (t.planned_frames != null) {
    const delta = t.frames_captured - t.planned_frames;
    if (delta !== 0) {
      notes.push(
        delta > 0
          ? `${delta} more frames than planned`
          : `${Math.abs(delta)} fewer frames than planned`,
      );
    }
  }
  if (
    t.planned_sub_length_seconds != null &&
    t.exposure_seconds !== t.planned_sub_length_seconds
  ) {
    notes.push(
      `Sub length ${t.exposure_seconds}s vs planned ${t.planned_sub_length_seconds}s`,
    );
  }
  if (t.planned_integration_minutes != null && t.planned_integration_minutes > 0) {
    const pct = Math.round(
      (actualMin / t.planned_integration_minutes) * 100,
    );
    notes.push(`${pct}% of planned integration`);
  }
  if (
    t.planned_iso != null &&
    t.iso != null &&
    t.iso !== t.planned_iso
  ) {
    notes.push(`ISO ${t.iso} vs planned ${t.planned_iso}`);
  }
  if (
    t.planned_gain != null &&
    t.gain != null &&
    t.gain !== t.planned_gain
  ) {
    notes.push(`Gain ${t.gain} vs planned ${t.planned_gain}`);
  }
  return notes;
}

/**
 * Capture worksheet closeout: Save Log planned snapshot vs recorded actuals.
 */
export function SessionCaptureCloseout({
  targets,
  className,
}: SessionCaptureCloseoutProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden",
        className,
      )}
    >
      <div className="border-b border-zinc-800/60 px-3 py-2.5">
        <h2 className="dash-section-title">Capture — planned vs actual</h2>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Planned values are the capture worksheet snapshot from Save Log.
          Actuals are what you recorded — no optimal-exposure invention.
        </p>
      </div>
      <div className="space-y-2.5 p-3">
        {targets.length === 0 ? (
          <p className="text-xs text-zinc-500">No targets on this session.</p>
        ) : (
          targets.map((t) => {
            const planned = plannedBits(t);
            const actualMin =
              Math.round(
                integrationMinutes(t.frames_captured, t.exposure_seconds) * 10,
              ) / 10;
            const variance = planned ? varianceNotes(t, actualMin) : [];
            return (
              <div
                key={t.id}
                className="rounded-md border border-zinc-800/50 bg-zinc-950/40 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">
                    {t.target_name}
                  </p>
                  {t.result && (
                    <span className="rounded border border-zinc-700/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                      {t.result}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-1 text-xs">
                  <p className="text-zinc-500">
                    <span className="font-medium text-zinc-400">Planned</span>
                    {" · "}
                    {planned ?? "No worksheet snapshot saved"}
                  </p>
                  <p className="text-zinc-300">
                    <span className="font-medium text-zinc-400">Actual</span>
                    {" · "}
                    {t.frames_captured} × {t.exposure_seconds}s · {actualMin}{" "}
                    min
                    {t.iso != null ? ` · ISO ${t.iso}` : ""}
                    {t.gain != null ? ` · gain ${t.gain}` : ""}
                  </p>
                  {(t.actual_start_at || t.actual_end_at) && (
                    <p className="tabular-nums text-zinc-600">
                      Window:{" "}
                      {t.actual_start_at
                        ? new Date(t.actual_start_at).toLocaleString()
                        : "—"}{" "}
                      –{" "}
                      {t.actual_end_at
                        ? new Date(t.actual_end_at).toLocaleString()
                        : "—"}
                    </p>
                  )}
                  {variance.length > 0 && (
                    <p className="text-amber-200/70">
                      {variance.join(" · ")}
                    </p>
                  )}
                  {t.notes && (
                    <p className="text-zinc-500">{t.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
