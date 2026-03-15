"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MOCK_SESSIONS } from "@/lib/mock/sessionHistory";
import { MOCK_SESSION_CONDITIONS } from "@/lib/mock/skyIntelligence";
import { cn, formatDate } from "@/lib/utils";

interface SessionHistoryCardProps {
  compact?: boolean;
}

export function SessionHistoryCard({ compact }: SessionHistoryCardProps) {
  const lastSession = MOCK_SESSIONS[0];
  const meta = lastSession && MOCK_SESSION_CONDITIONS[lastSession.id];
  const primaryTarget = lastSession?.targets?.[0]?.targetName;
  const logHref = lastSession?.missionId
    ? `/missions/${lastSession.missionId}/log`
    : `/sessions/${lastSession?.id ?? ""}`;

  if (!lastSession) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0">
          <h2 className="dash-section-title">Last Session</h2>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-zinc-500">No sessions yet</p>
          <Link href="/sessions">
            <Button variant="secondary" size="sm" className="mt-3 text-sm">
              View Sessions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        compact && "h-full"
      )}
    >
      <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title">Last Session</h2>
      </div>
      <div className="flex-1 min-h-0 p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-zinc-200">{formatDate(lastSession.date)}</span>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              {primaryTarget ?? `${lastSession.targetsCount} targets`}
            </p>
            {meta && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] dash-pill text-zinc-500">
                <span>Fcst {meta.forecastConfidence}%</span>
                <span>Live {meta.liveConfidence}%</span>
                <span>{meta.outcome}</span>
              </div>
            )}
          </div>
          <span
            className={cn(
              "dash-pill px-1.5 py-0.5 rounded text-[10px] shrink-0",
              lastSession.outcomeRating === "A"
                ? "text-emerald-400/90 bg-emerald-500/10"
                : lastSession.outcomeRating === "B"
                  ? "text-indigo-400/90 bg-indigo-500/10"
                  : "text-zinc-500 bg-zinc-800/50"
            )}
          >
            {lastSession.outcomeRating}
          </span>
        </div>
        <Link href={logHref} className="mt-2 block">
          <Button variant="secondary" size="sm" className="w-full text-xs h-8">
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}
