"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatLocalHm } from "@/lib/sky/visibility";
import { rigFitLabel } from "@/lib/gear/framing";
import type { DashboardRecommendation } from "@/lib/recommendations/types";

interface RecommendedTargetCardProps {
  target: DashboardRecommendation;
  selected?: boolean;
  isActive?: boolean;
  inPlan?: boolean;
  onSelect?: () => void;
  onCreateMissionPlan?: () => void;
  onAddToPlan?: () => void;
  onOpenEvidence?: () => void;
}

/** Session baseline with labeled usable window + peak marker (calculated times). */
function WindowStrip({
  sessionStart,
  sessionEnd,
  windowStart,
  windowEnd,
  peakAt,
}: {
  sessionStart: Date;
  sessionEnd: Date;
  windowStart: Date;
  windowEnd: Date;
  peakAt: Date | null;
}) {
  const span = Math.max(1, sessionEnd.getTime() - sessionStart.getTime());
  const clampPct = (t: Date) =>
    Math.min(
      100,
      Math.max(0, ((t.getTime() - sessionStart.getTime()) / span) * 100),
    );
  const left = clampPct(windowStart);
  const right = clampPct(windowEnd);
  const width = Math.max(2, right - left);
  const peakPct = peakAt ? clampPct(peakAt) : null;

  return (
    <div className="mt-1.5 space-y-1">
      <div
        className="relative h-1.5 rounded-sm bg-zinc-800/80 overflow-hidden"
        role="img"
        aria-label={`Usable imaging window from ${formatLocalHm(windowStart)} to ${formatLocalHm(windowEnd)}${
          peakAt ? `, peak altitude at ${formatLocalHm(peakAt)}` : ""
        }`}
      >
        <div
          className="absolute inset-y-0 bg-indigo-500/55"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {peakPct != null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-300/90"
            style={{ left: `${peakPct}%` }}
          />
        )}
      </div>
      <div className="space-y-0.5 text-[9px] leading-tight tabular-nums text-zinc-500">
        <div>
          Session {formatLocalHm(sessionStart)}–{formatLocalHm(sessionEnd)}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-2.5 shrink-0 rounded-sm bg-indigo-500/70"
              aria-hidden
            />
            Usable imaging window
          </span>
          {peakAt && (
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-0.5 shrink-0 bg-amber-300/90"
                aria-hidden
              />
              Peak alt {formatLocalHm(peakAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact peak altitude vs geometric maximum (calculated). */
function PeakAltMark({
  peakDeg,
  maxDeg,
}: {
  peakDeg: number;
  maxDeg: number;
}) {
  const pct = Math.min(100, Math.max(0, (peakDeg / Math.max(1, maxDeg)) * 100));
  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      title={`Peak ${peakDeg.toFixed(0)}° (max ~${maxDeg.toFixed(0)}°)`}
    >
      <div className="relative h-7 w-7">
        <svg viewBox="0 0 32 32" className="h-7 w-7 text-zinc-700">
          <path
            d="M4 26 A14 14 0 0 1 28 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M4 26 A14 14 0 0 1 28 26"
            fill="none"
            stroke="rgb(129 140 248)"
            strokeWidth="2"
            strokeDasharray={`${(pct / 100) * 44} 44`}
            className="opacity-90"
          />
        </svg>
        <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-[9px] font-mono tabular-nums text-zinc-300">
          {peakDeg.toFixed(0)}°
        </span>
      </div>
    </div>
  );
}

export function RecommendedTargetCard({
  target,
  selected,
  isActive,
  inPlan,
  onSelect,
  onCreateMissionPlan,
  onAddToPlan,
  onOpenEvidence,
}: RecommendedTargetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "observing-ticket flex w-full min-h-0 cursor-pointer overflow-hidden transition-colors",
        "bg-[color-mix(in_oklab,var(--dash-card,#18181b)_92%,#faf7f0_8%)] border border-zinc-700/50",
        "rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        selected
          ? "border-indigo-500/45 ring-1 ring-indigo-500/20"
          : "hover:border-indigo-500/25",
        isActive && "border-indigo-500/50",
      )}
    >
      {/* Ticket stub */}
      <div className="relative flex w-9 shrink-0 flex-col items-center justify-between border-r border-dashed border-zinc-600/50 bg-zinc-900/40 py-2">
        <span className="writing-vertical text-[8px] font-mono uppercase tracking-widest text-zinc-500 [writing-mode:vertical-rl] rotate-180">
          {target.id}
        </span>
        <span className="text-[10px] font-mono tabular-nums text-indigo-300/90">
          {target.score}
        </span>
        <div className="pointer-events-none absolute -right-1 top-0 bottom-0 flex flex-col justify-around py-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-zinc-950 ring-1 ring-zinc-700/60"
            />
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display truncate text-sm font-semibold text-zinc-100">
                {target.name}
              </h3>
              {isActive && (
                <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/25">
                  Active
                </span>
              )}
              {inPlan && !isActive && (
                <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-zinc-700/60 text-zinc-400 border border-zinc-600/50">
                  In Plan
                </span>
              )}
              {target.narrowWindow && (
                <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
                  Narrow
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
              {target.type.replace(/_/g, " ")}
              {target.constellation ? ` · ${target.constellation}` : ""}
            </p>
            <p className="mt-1 text-xs text-zinc-300 tabular-nums">
              Image{" "}
              <span className="font-medium text-zinc-100">
                {target.windowLabel}
              </span>
              <span className="text-zinc-500">
                {" "}
                · {target.windowDurationMinutes} min
              </span>
            </p>
          </div>
          <PeakAltMark
            peakDeg={target.peakAltitudeDeg}
            maxDeg={target.maxPossibleAltitudeDeg}
          />
        </div>

        <WindowStrip
          sessionStart={target.sessionStart}
          sessionEnd={target.sessionEnd}
          windowStart={target.windowStart}
          windowEnd={target.windowEnd}
          peakAt={target.peakAt}
        />

        <p className="mt-1 text-[10px] text-zinc-500">
          Rig fit:{" "}
          <span className="text-zinc-300">{rigFitLabel(target.rigFit)}</span>
          {target.fovWidthArcmin != null && target.fovHeightArcmin != null && (
            <span className="text-zinc-600">
              {" "}
              · FOV {target.fovWidthArcmin.toFixed(0)}′×
              {target.fovHeightArcmin.toFixed(0)}′
            </span>
          )}
          {target.rigFit === "unknown" &&
            target.rigFitDetail.includes("sensor") && (
              <>
                {" "}
                ·{" "}
                <Link
                  href="/settings?tab=gear"
                  className="text-indigo-400/90 underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit rig
                </Link>
              </>
            )}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="cta"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onCreateMissionPlan?.();
            }}
          >
            Create Mission Plan
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            disabled={inPlan}
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlan?.();
            }}
          >
            {inPlan ? "Added" : "Add to Plan"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-zinc-400"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEvidence?.();
            }}
          >
            Why this fits
          </Button>
        </div>
      </div>
    </div>
  );
}
