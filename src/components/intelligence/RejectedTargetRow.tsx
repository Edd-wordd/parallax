"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RejectedTarget } from "@/lib/mock/intelligenceLayer";

const LABEL_STYLES: Record<string, string> = {
  "Too Low": "text-amber-400/90 bg-amber-500/10 border-amber-500/20",
  "Poor Framing": "text-zinc-400 bg-zinc-700/50 border-zinc-600/40",
  "Moon Conflict": "text-violet-400/90 bg-violet-500/10 border-violet-500/20",
  "Narrow Window": "text-zinc-400 bg-zinc-700/50 border-zinc-600/40",
};

interface RejectedTargetRowProps {
  target: RejectedTarget;
  onOpenDecisionDrawer?: () => void;
}

export function RejectedTargetRow({
  target,
  onOpenDecisionDrawer,
}: RejectedTargetRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/50 bg-zinc-900/40 overflow-hidden",
        "transition-colors hover:border-zinc-700/60"
      )}
    >
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-zinc-300 truncate">
              {target.name}
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">{target.explanation}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium border",
                LABEL_STYLES[target.label] ?? LABEL_STYLES["Poor Framing"]
              )}
            >
              {target.label}
            </span>
            <span className="text-xs font-mono tabular-nums text-zinc-500">
              {target.score}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded);
            if (!expanded) onOpenDecisionDrawer?.();
          }}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-400"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          Why rejected
        </button>

        {expanded && (
          <ul className="mt-2 space-y-1 pl-4 border-l border-zinc-800/80 ml-1">
            {target.rejectedReasons.map((r, i) => (
              <li key={i} className="text-xs text-zinc-500">
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
