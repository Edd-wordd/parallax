"use client";

import { cn } from "@/lib/utils";
import type { SessionTimelineEvent } from "@/lib/mock/sessionSimulations";

interface SessionTimelineProps {
  events: SessionTimelineEvent[];
  className?: string;
}

export function SessionTimeline({
  events,
  className,
}: SessionTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
        Simulated timeline
      </p>
      <div className="space-y-1">
        {events.map((evt, i) => (
          <div
            key={i}
            className="flex gap-3 py-1.5 px-2.5 rounded border border-zinc-800/40 bg-zinc-900/30"
          >
            <span className="shrink-0 w-14 font-mono text-[11px] tabular-nums text-zinc-500">
              {evt.time}
            </span>
            <span className="text-xs text-zinc-300 leading-relaxed">
              {evt.event}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
