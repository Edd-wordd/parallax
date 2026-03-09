"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MissionConfidenceCard } from "./MissionConfidenceCard";
import { ModeBadge } from "./ModeBadge";
import { SkyMetricPill } from "./SkyMetricPill";
import { cn } from "@/lib/utils";
import {
  MOCK_FORECAST_STATE,
  MOCK_LIVE_STATE,
  type SkyIntelligenceState,
  type ConditionMode,
} from "@/lib/mock/skyIntelligence";

interface SkyIntelligenceCardProps {
  missionName?: string;
  locationName?: string;
  compact?: boolean;
  className?: string;
}

export function SkyIntelligenceCard({
  missionName,
  locationName,
  compact,
  className,
}: SkyIntelligenceCardProps) {
  const [mode, setMode] = useState<ConditionMode>("forecast");
  const state: SkyIntelligenceState =
    mode === "forecast" ? MOCK_FORECAST_STATE : MOCK_LIVE_STATE;

  const displayMission = missionName ?? state.missionName;
  const displayLocation = locationName ?? state.locationName;
  const confidence =
    mode === "forecast"
      ? state.forecastConfidence
      : (state.liveConfidence ?? state.forecastConfidence);

  return (
    <Card className={cn("border-zinc-800/60 bg-zinc-900/50 overflow-hidden rounded-lg", className)}>
      <CardHeader className={compact ? "px-2.5 py-1.5" : ""}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="dash-section-title">Sky Intelligence</h2>
            <ModeBadge mode={mode} />
          </div>
          <div className="inline-flex rounded border border-zinc-700/60 bg-zinc-800/30 p-0.5" role="group">
            <button
              type="button"
              onClick={() => setMode("forecast")}
              className={cn(
                "rounded px-2 py-0.5 dash-pill text-[9px] transition-colors",
                mode === "forecast"
                  ? "bg-indigo-500/15 text-indigo-400/90"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Forecast
            </button>
            <button
              type="button"
              onClick={() => setMode("live")}
              className={cn(
                "rounded px-2 py-0.5 dash-pill text-[9px] transition-colors",
                mode === "live"
                  ? "bg-indigo-500/15 text-indigo-400/90"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Live Site
            </button>
          </div>
        </div>
        <p className="text-[9px] text-zinc-500 mt-0.5">Plan → Verify → Adapt</p>
      </CardHeader>

      <CardContent className={cn(compact ? "px-2.5 pt-0 pb-2" : "")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-[10px]">
              <span className="text-zinc-500">Mission</span>
              <span className="truncate text-zinc-400">{displayMission}</span>
              <span className="text-zinc-500">Site</span>
              <span className="truncate text-zinc-400">{displayLocation}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <MissionConfidenceCard confidence={confidence} size={compact ? "sm" : "md"} />
              {mode === "forecast" && (
                <>
                  <SkyMetricPill label="Cloud" value={`${state.forecast.cloudCover}%`} />
                  <SkyMetricPill label="Humidity" value={`${state.forecast.humidity}%`} />
                  <SkyMetricPill label="Moon" value={state.forecast.moonInterference} />
                </>
              )}
              {mode === "live" && state.live && (
                <>
                  <SkyMetricPill label="Stars" value={state.live.starsDetected ?? "—"} variant="success" />
                  <SkyMetricPill label="Cloud" value={`${state.live.cloudCover}%`} variant="success" />
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 leading-snug">{state.status}</p>
          </div>
          <div className="space-y-0.5 md:border-l md:border-zinc-800/60 md:pl-2.5">
            <span className="dash-pill text-zinc-500">Imaging window</span>
            <div className="dash-metric text-zinc-300 text-[11px]">{state.forecast.targetVisibilityWindow}</div>
            <div className="text-[10px] text-zinc-500">{state.forecast.imagingWindow}</div>
            <div className="flex gap-3 pt-1">
              <Link href="/site-check" className="text-[10px] text-indigo-400/80 hover:text-indigo-400/90">
                Site Check
              </Link>
              <Link href="/skymap" className="text-[10px] text-indigo-400/80 hover:text-indigo-400/90">
                Tonight&apos;s Sky
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
