"use client";

import { cn } from "@/lib/utils";

interface LearnedFromSessionsCardProps {
  /** Factual bullets derived from saved sessions */
  facts: string[];
  /** Demo-only adaptation claims — must stay labeled */
  demoInsights?: string[];
  demoEffects?: string[];
  className?: string;
}

export function LearnedFromSessionsCard({
  facts,
  demoInsights = [],
  demoEffects = [],
  className,
}: LearnedFromSessionsCardProps) {
  const showDemo = demoInsights.length > 0 || demoEffects.length > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">From your sessions</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Counts and averages from Save Log — not AI or invented weather.
        </p>
      </div>
      <div className="p-3 space-y-4">
        {facts.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No saved sessions yet. Complete a mission and Save Log to see
            patterns here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {facts.map((fact, i) => (
              <li
                key={i}
                className="text-xs text-zinc-300 leading-relaxed flex gap-2"
              >
                <span className="text-indigo-500/60 shrink-0">·</span>
                {fact}
              </li>
            ))}
          </ul>
        )}

        {showDemo && (
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Adaptation preview
              </h3>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
                Demo
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              Placeholder patterns — not computed from your sessions.
            </p>
            {demoInsights.length > 0 && (
              <ul className="space-y-1.5">
                {demoInsights.map((insight, i) => (
                  <li
                    key={i}
                    className="text-xs text-zinc-500 leading-relaxed flex gap-2"
                  >
                    <span className="text-zinc-600 shrink-0">·</span>
                    {insight}
                  </li>
                ))}
              </ul>
            )}
            {demoEffects.length > 0 && (
              <ul className="space-y-1">
                {demoEffects.map((effect, i) => (
                  <li
                    key={i}
                    className="text-xs text-zinc-500 leading-relaxed flex gap-2"
                  >
                    <span className="text-zinc-600 shrink-0">→</span>
                    {effect}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
