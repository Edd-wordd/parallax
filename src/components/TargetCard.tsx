"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import type { Target, TargetType } from "@/lib/types";
import type { Recommendation } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

/** Mock thumbnail for target type. TODO: Replace with real image URLs from astronomy API. */
function TargetThumbnail({ targetType, className }: { targetType: TargetType; className?: string }) {
  const isNebula = targetType === "nebula";
  const isGalaxy = targetType === "galaxy";
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        background: isNebula
          ? "linear-gradient(135deg, #0f0f14 0%, rgba(60,80,120,0.15) 40%, #0a0a0e 100%)"
          : isGalaxy
            ? "linear-gradient(135deg, #0a0a0e 0%, rgba(80,70,100,0.12) 50%, #0f0f14 100%)"
            : "linear-gradient(135deg, #0f0f14 0%, rgba(100,120,140,0.08) 50%, #0a0a0e 100%)",
      }}
      aria-hidden
    >
      <div className="w-full h-full flex items-center justify-center">
        <div
          className={cn(
            "rounded-full border border-white/5",
            isNebula ? "w-5 h-5 bg-indigo-500/15" : isGalaxy ? "w-4 h-6 bg-violet-500/10" : "w-4 h-4 bg-sky-500/10"
          )}
        />
      </div>
    </div>
  );
}
import { ScoreBadge } from "./ScoreBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { WhyRecommended } from "./WhyRecommended";
import { cn } from "@/lib/utils";
import { AltitudeCurve } from "./targets/AltitudeCurve";

type TargetStatusTag =
  | "Best Now"
  | "Up Next"
  | "Later"
  | "Moon Risk"
  | "Low Altitude";

function parseHHMM(s: string): number {
  const parts = s.trim().split(/[:\s]+/).map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function getTargetStatusTag(
  windowStart: string,
  windowEnd: string,
  peakAltitude: number,
  moonSeparation: number,
  now: Date
): TargetStatusTag {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseHHMM(windowStart);
  const endMin = parseHHMM(windowEnd);

  const inWindow =
    startMin <= endMin
      ? nowMin >= startMin && nowMin <= endMin
      : nowMin >= startMin || nowMin <= endMin;

  const minsUntilStart =
    nowMin < startMin ? startMin - nowMin : 24 * 60 - nowMin + startMin;

  if (moonSeparation < 25) return "Moon Risk";
  if (peakAltitude < 45) return "Low Altitude";
  if (inWindow) return "Best Now";
  if (minsUntilStart > 0 && minsUntilStart <= 60) return "Up Next";
  return "Later";
}

interface MissionPlanTargetCardProps {
  target: Target;
  recommendation: Recommendation;
  windowStart: string;
  windowEnd: string;
  targetTypeLabel: string;
  missionGrid?: boolean;
  onHover?: (targetId: string | null) => void;
}

/** Isolated clock — only this card's status tag rerenders on tick */
const LiveStatusTag = memo(function LiveStatusTag({
  windowStart,
  windowEnd,
  peakAltitude,
  moonSeparation,
  targetId,
}: {
  windowStart: string;
  windowEnd: string;
  peakAltitude: number;
  moonSeparation: number;
  targetId: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const statusTag = getTargetStatusTag(windowStart, windowEnd, peakAltitude, moonSeparation, now);
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-800/60 shrink-0"
      aria-label={`Status: ${statusTag}`}
    >
      {statusTag}
    </span>
  );
});

function MissionPlanTargetCard({
  target,
  recommendation,
  windowStart,
  windowEnd,
  targetTypeLabel,
  missionGrid,
  onHover,
}: MissionPlanTargetCardProps) {
  return (
    <Link href={`/targets/${target.id}`}>
      <div
        className="h-full transition-colors hover:border-indigo-500/20"
        onMouseEnter={() => onHover?.(target.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div
          className={cn(
            "h-full rounded-lg border border-zinc-800/60 bg-zinc-900/50 flex flex-col p-2.5"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate text-sm text-zinc-100">{target.name}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                {targetTypeLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <LiveStatusTag
                windowStart={windowStart}
                windowEnd={windowEnd}
                peakAltitude={recommendation.peak_altitude ?? 60}
                moonSeparation={recommendation.moon_separation ?? 30}
                targetId={target.id}
              />
              <ScoreBadge score={recommendation.shootability_score} size="md" className="text-base" />
            </div>
          </div>
          <div className={cn("grid grid-cols-3 gap-x-3 gap-y-0.5 mt-1.5", missionGrid && "gap-x-2")}>
            <div className="text-[10px]">
              <span className="text-zinc-500 block">Peak</span>
              <span className="font-mono tabular-nums text-zinc-300">{recommendation.peak_altitude}°</span>
            </div>
            <div className="text-[10px]">
              <span className="text-zinc-500 block">Moon</span>
              <span className="font-mono tabular-nums text-zinc-300">{recommendation.moon_separation}°</span>
            </div>
            <div className="text-[10px]">
              <span className="text-zinc-500 block">Window</span>
              <span className="font-mono tabular-nums text-indigo-400/90 font-medium">
                {windowStart}–{windowEnd}
              </span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 flex-shrink-0">
            <AltitudeCurve startTime={windowStart} endTime={windowEnd} height={16} />
          </div>
        </div>
      </div>
    </Link>
  );
}

interface TargetCardProps {
  target: Target;
  recommendation?: Recommendation;
  score?: number;
  compact?: boolean;
  missionPlan?: boolean;
  /** Compact mission grid variant for 2x2 dashboard layout */
  missionGrid?: boolean;
  /** Called when card is hovered (for parent to show selected target panel) */
  onHover?: (targetId: string | null) => void;
}

export function TargetCard({ target, recommendation, score, compact, missionPlan, missionGrid, onHover }: TargetCardProps) {
  const s = recommendation?.shootability_score ?? score;

  if ((missionPlan || missionGrid) && recommendation) {
    const windowStart = recommendation.best_window_start || "21:00";
    const windowEnd = recommendation.best_window_end || "02:00";
    const targetTypeLabel = target.type.replace(/_/g, " ");
    return (
      <MissionPlanTargetCard
        target={target}
        recommendation={recommendation}
        windowStart={windowStart}
        windowEnd={windowEnd}
        targetTypeLabel={targetTypeLabel}
        missionGrid={missionGrid}
        onHover={onHover}
      />
    );
  }

  if (compact) {
    return (
      <Link href={`/targets/${target.id}`}>
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden transition-colors hover:border-indigo-500/20 flex p-3">
            <TargetThumbnail targetType={target.type} className="w-16 h-16 shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0 pl-3 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-medium truncate text-zinc-200">{target.name}</h3>
                {s != null && <ScoreBadge score={s} size="md" className="shrink-0" />}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0 text-xs dash-pill text-zinc-500">
                <span>{target.type.replace("_", " ")}</span>
                <span>Mag {target.magnitude}</span>
                <span>{target.constellation}</span>
              </div>
            </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/targets/${target.id}`}>
      <div className="h-full">
        <Card className="h-full overflow-hidden transition-colors hover:border-white/15">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-4">
              <TargetThumbnail targetType={target.type} className="h-16 w-16 shrink-0 rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium truncate">{target.name}</h3>
                  {s != null && <ScoreBadge score={s} size="lg" />}
                </div>
                {recommendation && (
                  <div className="mt-1 text-xs text-zinc-400">
                    Peak {recommendation.peak_altitude}° · Moon {recommendation.moon_separation}° away
                    <br />
                    Best window: {recommendation.best_window_start}–{recommendation.best_window_end}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs capitalize">
                    {recommendation?.difficulty ?? "—"}
                  </span>
                  <span className="text-xs text-zinc-500 capitalize">
                    {target.type.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {target.angular_size} × {target.angular_size} arcmin · Mag {Number(target.magnitude).toFixed(1)}
                </p>
              </div>
            </div>
            {recommendation?.score_breakdown && (
              <ScoreBreakdown
                items={recommendation.score_breakdown.map((c) => ({
                  label: c.label,
                  value: c.value,
                }))}
                total={recommendation.shootability_score}
              />
            )}
            {recommendation?.why && recommendation.why.length > 0 && (
              <WhyRecommended bullets={recommendation.why} />
            )}
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
