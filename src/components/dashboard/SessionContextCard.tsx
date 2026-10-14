"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  listSessions,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";
import type { RejectedRecommendation } from "@/lib/recommendations/types";

interface SessionContextCardProps {
  rejected: RejectedRecommendation[];
  onOpenRejected?: (target: RejectedRecommendation) => void;
  /** Hide rejected list while a mission is in the field loop */
  showRejected?: boolean;
  className?: string;
}

/**
 * Slim secondary card: last session glance + unsuitable targets.
 */
export function SessionContextCard({
  rejected,
  onOpenRejected,
  showRejected = true,
  className,
}: SessionContextCardProps) {
  const [lastSession, setLastSession] = useState<SessionWithTargets | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const rows = await listSessions(client);
        if (!cancelled) setLastSession(rows[0] ?? null);
      } catch {
        if (!cancelled) setLastSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryTarget = lastSession?.targets?.[0]?.target_name;
  const when =
    lastSession?.ended_at ??
    lastSession?.started_at ??
    lastSession?.created_at ??
    "";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/50",
        className,
      )}
    >
      <div className="shrink-0 border-b border-zinc-800/60 px-3 py-2">
        <h2 className="dash-section-title">Session context</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-zinc-800/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Last session
          </p>
          {loading ? (
            <p className="mt-1 text-xs text-zinc-500">Loading…</p>
          ) : !lastSession ? (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs text-zinc-500">No sessions yet</p>
              <Link
                href="/sessions"
                className="text-[11px] text-zinc-400 underline-offset-2 hover:text-zinc-300 hover:underline"
              >
                Sessions
              </Link>
            </div>
          ) : (
            <div className="mt-1 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/sessions/${lastSession.id}`}
                  className="text-xs font-medium text-zinc-200 hover:text-zinc-100"
                >
                  {when ? formatDate(when) : "Session"}
                </Link>
                <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                  {primaryTarget ?? `${lastSession.targets.length} targets`}
                </p>
              </div>
              <span className="shrink-0 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-400/90">
                {lastSession.outcome_score}/10 ·{" "}
                {outcomeScoreLabel(lastSession.outcome_score)}
              </span>
            </div>
          )}
        </div>

        {showRejected && (
          <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Not suitable
              {rejected.length > 0 ? (
                <span className="ml-1 font-normal tabular-nums text-zinc-600">
                  ({rejected.length})
                </span>
              ) : null}
            </p>
            <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
              {rejected.length === 0 ? (
                <p className="text-[11px] leading-snug text-zinc-600">
                  None excluded for this session window.
                </p>
              ) : (
                <ul className="space-y-1">
                  {rejected.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onOpenRejected?.(t)}
                        className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-300"
                      >
                        <span className="min-w-0 truncate font-medium text-zinc-300">
                          {t.name}
                        </span>
                        <span className="max-w-[42%] shrink-0 truncate text-right text-zinc-600">
                          {t.reasonLabel}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
