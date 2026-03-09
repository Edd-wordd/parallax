"use client";

import { cn } from "@/lib/utils";

interface MissionWhyTonightCardProps {
  /** Whether an active mission exists — controls title and copy tone */
  hasActiveMission?: boolean;
  /** Narrative points: general night summary (no mission) or mission-specific reasoning (active mission). Do not duplicate raw metrics from Observing Conditions. */
  points: string[];
  className?: string;
}

export function MissionWhyTonightCard({
  hasActiveMission = false,
  points,
  className,
}: MissionWhyTonightCardProps) {
  const title = hasActiveMission
    ? "Why This Mission Works Tonight"
    : "Tonight's Conditions";

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">{title}</h2>
      </div>
      <div className="p-3">
        <ul className="space-y-2">
          {points.map((point, i) => (
            <li
              key={i}
              className="text-sm text-zinc-300 leading-relaxed flex gap-2"
            >
              <span className="text-indigo-500/70 shrink-0">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
