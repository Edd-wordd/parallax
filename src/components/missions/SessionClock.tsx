"use client";

import { useEffect, useState } from "react";
import type { MissionTarget } from "@/lib/types";
import { formatLocalHm } from "@/lib/sky/visibility";
import {
  nowPercent,
  sessionClockBars,
} from "@/lib/schedule/sessionClock";
import { cn } from "@/lib/utils";

interface SessionClockProps {
  sessionStart: Date;
  sessionEnd: Date;
  targets: MissionTarget[];
  selectedTargetId?: string | null;
  className?: string;
}

export function SessionClock({
  sessionStart,
  sessionEnd,
  targets,
  selectedTargetId = null,
  className,
}: SessionClockProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const bars = sessionClockBars({ sessionStart, sessionEnd, targets });
  const nowPct = nowPercent(sessionStart, sessionEnd, now);
  const startLabel = formatLocalHm(sessionStart);
  const endLabel = formatLocalHm(sessionEnd);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-[10px] tabular-nums text-zinc-500">
        <span>{startLabel}</span>
        <span>Session</span>
        <span>{endLabel}</span>
      </div>
      {bars.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No target windows fall inside this session.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {bars.map((bar) => {
            const selected = bar.targetId === selectedTargetId;
            return (
              <li key={bar.targetId} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-2">
                <span
                  className={cn(
                    "truncate text-xs",
                    selected ? "text-zinc-100" : "text-zinc-400",
                  )}
                >
                  {bar.name}
                </span>
                <div className="relative h-3 rounded-full bg-zinc-800/80">
                  <div
                    className={cn(
                      "absolute inset-y-0 rounded-full",
                      selected ? "bg-indigo-400" : "bg-indigo-500/70",
                    )}
                    style={{
                      left: `${bar.startPct}%`,
                      width: `${Math.max(bar.widthPct, 1.5)}%`,
                    }}
                  />
                  {nowPct != null && (
                    <div
                      className="absolute inset-y-0 w-px bg-cyan-300"
                      style={{ left: `${nowPct}%` }}
                      title="Now"
                    />
                  )}
                </div>
                <span className="text-right text-[10px] tabular-nums text-zinc-500">
                  {bar.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {nowPct != null && (
        <p className="text-[10px] text-cyan-300/80">Now is inside this session.</p>
      )}
    </div>
  );
}
