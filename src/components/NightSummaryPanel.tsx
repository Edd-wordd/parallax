"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { MockNight } from "@/lib/mock/night";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface NightSummaryPanelProps {
  night: MockNight;
  className?: string;
}

export function NightSummaryPanel({ night, className }: NightSummaryPanelProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h2 className="text-base font-semibold mb-3 tracking-tight">TONIGHT</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Darkness</div>
            <div className="font-mono text-sm">
              {night.astronomicalDarknessStart} → {night.astronomicalDarknessEnd}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Moon</div>
            <div className="font-mono text-sm">
              {night.moonPhasePercent}% | Moonset: {night.moonset}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Sky Quality</div>
            <div className="font-mono text-sm">Bortle {night.bortle}</div>
          </div>
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Clouds</div>
            <div className="font-mono text-sm">{night.cloudCover}%</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-white/50 uppercase tracking-wide mb-2">
            Recommended Target Types
          </div>
          <div className="flex flex-wrap gap-3">
            {night.recommendedTypes.map((r) => (
              <span
                key={r.type}
                className={`flex items-center gap-1.5 text-sm ${
                  r.status === "good"
                    ? "text-emerald-400"
                    : r.status === "moderate"
                      ? "text-amber-400"
                      : "text-zinc-500"
                }`}
              >
                {r.status === "good" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {r.type}
                {r.status === "moderate" && " (moderate tonight)"}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
