"use client";

import { cn } from "@/lib/utils";
import type { SetupImpactItem } from "@/lib/mock/intelligenceLayer";

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "text-amber-400/90 bg-amber-500/10 border-amber-500/20",
  Recommended: "text-indigo-400/90 bg-indigo-500/10 border-indigo-500/20",
  Optional: "text-zinc-500 bg-zinc-700/50 border-zinc-600/40",
};

interface SetupImpactCardProps {
  targetName: string | null;
  items: SetupImpactItem[];
  className?: string;
  /** When true, show empty placeholder instead of items. */
  empty?: boolean;
}

export function SetupImpactCard({
  targetName,
  items,
  className,
  empty = false,
}: SetupImpactCardProps) {
  const isEmpty = empty || (items.length === 0 && !targetName);
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">
          Setup Impact for This Mission
        </h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {targetName
            ? `Because you chose ${targetName} and this gear`
            : "Select a recommended target to review setup impact"}
        </p>
      </div>
      <div className="p-3 space-y-2">
        {isEmpty ? (
          <p className="text-sm text-zinc-500 italic py-4">
            Start a mission or build a plan to see gear-specific setup guidance
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="rounded border border-zinc-800/60 bg-zinc-900/30 p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-zinc-200">
                  {item.task}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border",
                    PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.Optional
                  )}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{item.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
