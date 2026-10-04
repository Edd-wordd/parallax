"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  listSessions,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";

interface SessionHistoryCardProps {
  compact?: boolean;
}

export function SessionHistoryCard({ compact }: SessionHistoryCardProps) {
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

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0">
          <h2 className="dash-section-title">Last Session</h2>
        </div>
        <div className="p-4 text-center text-sm text-zinc-500">Loading…</div>
      </div>
    );
  }

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

  const primaryTarget = lastSession.targets?.[0]?.target_name;
  const when =
    lastSession.ended_at ??
    lastSession.started_at ??
    lastSession.created_at ??
    "";

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        compact && "h-full",
      )}
    >
      <div className="px-3 py-2 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title">Last Session</h2>
      </div>
      <div className="flex-1 min-h-0 p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-zinc-200">
              {when ? formatDate(when) : "Session"}
            </span>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              {primaryTarget ?? `${lastSession.targets.length} targets`}
            </p>
          </div>
          <span className="dash-pill px-1.5 py-0.5 rounded text-[10px] shrink-0 text-indigo-400/90 bg-indigo-500/10">
            {lastSession.outcome_score}/10 ·{" "}
            {outcomeScoreLabel(lastSession.outcome_score)}
          </span>
        </div>
        <Link href={`/sessions/${lastSession.id}`} className="mt-2 block">
          <Button variant="secondary" size="sm" className="w-full text-xs h-8">
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}
