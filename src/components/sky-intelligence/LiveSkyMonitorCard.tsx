"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkyMetricPill } from "./SkyMetricPill";
import { cn } from "@/lib/utils";
import type { LiveEvent } from "@/lib/mock/skyIntelligence";

interface LiveSkyMonitorCardProps {
  cloudCover: number;
  starsDetected: number | null;
  skyBrightness: number;
  missionConfidence: number;
  status: string;
  events: LiveEvent[];
  compact?: boolean;
  className?: string;
}

export function LiveSkyMonitorCard({
  cloudCover,
  starsDetected,
  skyBrightness,
  missionConfidence,
  status,
  events,
  compact,
  className,
}: LiveSkyMonitorCardProps) {
  return (
    <Card className={cn("border-neutral-800/60 bg-black/20", className)}>
      <CardHeader className={compact ? "px-3 py-2" : ""}>
        <h2 className="text-sm font-medium uppercase tracking-wider">Live Sky Monitor</h2>
        <p className="text-[10px] text-zinc-500 mt-0.5 dash-pill">
          Mock observational telemetry — sky preview, cloud estimate, brightness. Atlas monitors
          conditions and advises; it does not control your rig.
        </p>
      </CardHeader>
      <CardContent className={cn(compact ? "px-3 pt-0 pb-2 space-y-3" : "space-y-4")}>
        {/* Mock all-sky preview */}
        <div className="aspect-video rounded-lg bg-black/40 border border-neutral-800 overflow-hidden flex items-center justify-center">
          <div className="text-center text-zinc-500 text-xs">
            <div className="mb-1 dash-pill">All-Sky Preview</div>
            <div className="text-[10px] opacity-60">Live feed placeholder</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SkyMetricPill label="Cloud cover" value={`${cloudCover}%`} />
          <SkyMetricPill
            label="Stars"
            value={starsDetected ?? "—"}
            variant={starsDetected != null ? "success" : "muted"}
          />
          <SkyMetricPill label="Sky brightness" value={`${skyBrightness} mag/arcsec²`} />
          <SkyMetricPill
            label="Confidence"
            value={`${missionConfidence}%`}
            variant={missionConfidence >= 80 ? "success" : missionConfidence >= 60 ? "default" : "warning"}
          />
        </div>

        <div className="rounded-lg border border-neutral-800 bg-black/20 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 dash-pill">
            Status
          </span>
          <p className="text-sm font-medium text-zinc-200 mt-0.5">{status}</p>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5 dash-pill">
            Event feed
          </span>
          <ul className={cn("space-y-1 max-h-28 overflow-y-auto pr-0.5", compact && "space-y-0.5")}>
            {events.map((e, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-zinc-400"
              >
                <span className="tabular-nums text-zinc-500 shrink-0">
                  {e.time}
                </span>
                <span>{e.event}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
