"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SessionRisk } from "@/lib/mock/sessionSimulations";

interface SessionRiskListProps {
  risks: SessionRisk[];
  className?: string;
}

const LEVEL_STYLES: Record<string, string> = {
  Low: "text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20",
  Moderate: "text-amber-400/90 bg-amber-500/10 border-amber-500/20",
  High: "text-zinc-400 bg-zinc-600/50 border-zinc-500/40",
};

function RiskRow({ risk }: { risk: SessionRisk }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn(
        "rounded border border-zinc-800/60 bg-zinc-900/20 overflow-hidden"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          )}
          <span className="text-xs font-medium text-zinc-300 truncate">
            {risk.label}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border",
            LEVEL_STYLES[risk.level] ?? LEVEL_STYLES.Moderate
          )}
        >
          {risk.level}
        </span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 pl-8">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {risk.reason}
          </p>
        </div>
      )}
    </div>
  );
}

export function SessionRiskList({
  risks,
  className,
}: SessionRiskListProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
        Expected risks
      </p>
      <div className="space-y-1.5">
        {risks.map((risk, i) => (
          <RiskRow key={i} risk={risk} />
        ))}
      </div>
    </div>
  );
}
