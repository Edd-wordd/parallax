"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MOCK_SESSIONS } from "@/lib/mock/sessionHistory";
import { MOCK_SESSION_CONDITIONS } from "@/lib/mock/skyIntelligence";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { cn, formatDate } from "@/lib/utils";

interface SessionHistoryCardProps {
  compact?: boolean;
}

export function SessionHistoryCard({ compact }: SessionHistoryCardProps) {
  const [mostRecent, ...previous] = MOCK_SESSIONS;
  const meta = mostRecent && MOCK_SESSION_CONDITIONS[mostRecent.id];
  const primaryTarget = mostRecent?.targets?.[0]?.targetName;
  const logHref = mostRecent?.missionId
    ? `/missions/${mostRecent.missionId}/log`
    : `/sessions/${mostRecent?.id ?? ""}`;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        compact && "h-full"
      )}
    >
      <div className="px-3 py-2 border-b border-zinc-800/60">
        <h2 className="dash-section-title">Session History</h2>
      </div>
      <div className={cn("flex-1 min-h-0", compact ? "p-3" : "p-3")}>
        {mostRecent ? (
          <>
            {/* Most Recent Session - compact entry */}
            <div className="rounded-md border border-zinc-700/50 bg-zinc-800/30 px-3 py-2 mb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-zinc-200">{formatDate(mostRecent.date)}</span>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {primaryTarget ?? `${mostRecent.targetsCount} targets`}
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
                    mostRecent.outcomeRating === "A"
                      ? "text-emerald-400/90 bg-emerald-500/10"
                      : mostRecent.outcomeRating === "B"
                        ? "text-indigo-400/90 bg-indigo-500/10"
                        : "text-zinc-500 bg-zinc-800/50"
                  )}
                >
                  {mostRecent.outcomeRating}
                </span>
              </div>
              <Link href={logHref} className="mt-2 block">
                <Button variant="secondary" size="sm" className="w-full text-xs h-8">
                  View
                </Button>
              </Link>
            </div>

            {/* Previous Sessions */}
            <div className="space-y-1">
              {previous.slice(0, 3).map((s) => {
                const sLoc = MOCK_LOCATIONS.find((l) => l.id === s.locationId);
                const sMeta = MOCK_SESSION_CONDITIONS[s.id];
                const primaryTarget = s.targets?.[0]?.targetName;
                return (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="block rounded py-2 px-2 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-zinc-400">{formatDate(s.date)}</span>
                        <span className="text-xs text-zinc-500 ml-2">
                          {sLoc?.name ?? ""} · {primaryTarget ?? `${s.targetsCount} tgt`} · {s.totalIntegrationMinutes}m
                        </span>
                        {sMeta && (
                          <div className="flex flex-wrap gap-x-2 mt-0.5 text-[10px] dash-pill text-zinc-500">
                            <span>Fcst {sMeta.forecastConfidence}%</span>
                            <span>Live {sMeta.liveConfidence}%</span>
                            <span>{sMeta.cloudInterruptionMinutes}m clouds</span>
                            <span>{sMeta.outcome}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "dash-pill px-1.5 py-0.5 rounded text-[10px]",
                            s.outcomeRating === "A"
                              ? "text-emerald-400/80 bg-emerald-500/5"
                              : s.outcomeRating === "B"
                                ? "text-indigo-400/80 bg-indigo-500/5"
                                : "text-zinc-500 bg-zinc-800/40"
                          )}
                        >
                          {s.outcomeRating}
                        </span>
                        <span className="text-xs text-indigo-400/70">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link href="/sessions" className="mt-2 inline-block">
              <span className="text-xs text-indigo-400/80 hover:text-indigo-400/90">
                View all sessions →
              </span>
            </Link>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-500">No sessions yet</p>
            <Link href="/sessions">
              <Button variant="secondary" size="sm" className="mt-3 text-sm">
                View Sessions
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
