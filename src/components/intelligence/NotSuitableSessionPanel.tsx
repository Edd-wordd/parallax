"use client";

import { cn } from "@/lib/utils";
import type { RejectedRecommendation } from "@/lib/recommendations/types";

interface NotSuitableSessionPanelProps {
  rejected: RejectedRecommendation[];
  onOpen?: (target: RejectedRecommendation) => void;
  className?: string;
}

/**
 * Right-column panel: calculated unsuitable targets with scroll.
 */
export function NotSuitableSessionPanel({
  rejected,
  onOpen,
  className,
}: NotSuitableSessionPanelProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/50",
        className,
      )}
    >
      <div className="shrink-0 border-b border-zinc-800/60 px-3 py-2.5">
        <h2 className="dash-section-title text-zinc-400">
          Not suitable this session
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Excluded by altitude, Moon separation, or darkness for your site and
          session
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 max-h-[280px] md:max-h-[320px]">
        {rejected.length === 0 ? (
          <p className="px-1 py-3 text-xs text-zinc-500">
            No unsuitable targets to show — either all pass filters or the
            catalog has no rejects for this night.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rejected.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen?.(t)}
                  className="flex w-full items-center justify-between gap-2 rounded border border-zinc-800/50 bg-zinc-900/40 px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                >
                  <span className="min-w-0 truncate font-medium text-zinc-300">
                    {t.name}
                  </span>
                  <span className="max-w-[45%] shrink-0 truncate text-right text-zinc-600">
                    {t.reasonLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
