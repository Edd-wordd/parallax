"use client";

import { cn } from "@/lib/utils";

interface LearnedFromSessionsCardProps {
  insights: string[];
  effects: string[];
  className?: string;
}

export function LearnedFromSessionsCard({
  insights,
  effects,
  className,
}: LearnedFromSessionsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">
          Learned From Your Sessions
        </h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Historical pattern detected from past imaging sessions
        </p>
      </div>
      <div className="p-3 space-y-4">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Patterns
          </h3>
          <ul className="space-y-1.5">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="text-xs text-zinc-400 leading-relaxed flex gap-2"
              >
                <span className="text-violet-500/60 shrink-0">·</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-2 border-t border-zinc-800/80">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            How this affected tonight&apos;s plan
          </h3>
          <ul className="space-y-1">
            {effects.map((effect, i) => (
              <li
                key={i}
                className="text-xs text-indigo-300/90 leading-relaxed flex gap-2"
              >
                <span className="text-indigo-500/50 shrink-0">→</span>
                {effect}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
