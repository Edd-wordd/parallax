"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ExposurePresetRow } from "./ExposurePresetRow";
import { ExposureTradeoffSelector } from "./ExposureTradeoffSelector";
import { MissionFitSummary } from "./MissionFitSummary";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import { computeSessionAstronomy } from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import { buildRealExposurePlan } from "@/lib/capture/exposurePlan";
import type { Mission, MissionTarget } from "@/lib/types";

interface ExposurePlannerCardProps {
  mission: Mission;
  target: MissionTarget | null;
  lat?: number | null;
  lon?: number | null;
  cameraName?: string | null;
  hasGuiding?: boolean;
  className?: string;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  "High confidence": "text-emerald-400/90",
  "Moderate confidence": "text-amber-400/90",
  Experimental: "text-zinc-500",
};

export function ExposurePlannerCard({
  mission,
  target,
  lat = null,
  lon = null,
  cameraName = null,
  hasGuiding = false,
  className,
}: ExposurePlannerCardProps) {
  const interval = useMemo(
    () =>
      sessionIntervalFromDateTime(mission.dateTime, mission.sessionEndAt),
    [mission.dateTime, mission.sessionEndAt],
  );

  const astronomy = useMemo(() => {
    if (lat == null || lon == null) return null;
    return computeSessionAstronomy({
      site: { latDeg: lat, lonDeg: lon },
      sessionStart: interval.start,
      sessionEnd: interval.end,
      minAltitudeDeg: mission.constraints?.minAltitude ?? 30,
      moonToleranceDeg: mission.constraints?.moonTolerance ?? 15,
      targets: [],
    });
  }, [
    lat,
    lon,
    interval.start,
    interval.end,
    mission.constraints?.minAltitude,
    mission.constraints?.moonTolerance,
  ]);

  const forecastHook = useSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart: interval.start,
    sessionEnd: interval.end,
    includeAstroWx: true,
    moonInterference: astronomy?.moon?.interferenceLabel ?? null,
    enabled: lat != null && lon != null,
  });

  const plan = useMemo(
    () =>
      buildRealExposurePlan({
        mission,
        target,
        forecast: forecastHook.forecast,
        forecastStatus: forecastHook.status,
        forecastError: forecastHook.error,
        hasSite: lat != null && lon != null,
        cameraName,
        hasGuiding,
        moonInterference: astronomy?.moon?.interferenceLabel ?? null,
      }),
    [
      mission,
      target,
      forecastHook.forecast,
      forecastHook.status,
      forecastHook.error,
      lat,
      lon,
      cameraName,
      hasGuiding,
      astronomy?.moon?.interferenceLabel,
    ],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <h2 className="dash-section-title text-zinc-400">Exposure Plan</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {plan.status === "empty"
            ? "Select a target to summarize Capture worksheet settings"
            : plan.status === "incomplete"
              ? `${plan.targetName} — fill Capture worksheet`
              : `${plan.targetName} — from Capture worksheet`}
        </p>
      </div>

      <div className="p-3 space-y-4">
        {plan.status === "empty" && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {plan.explanation}
          </p>
        )}

        {plan.status === "incomplete" && (
          <>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {plan.explanation}
            </p>
            {plan.missingEvidence.length > 0 && (
              <p className="text-[11px] text-amber-200/80 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
                Missing: {plan.missingEvidence.join(", ")}.
              </p>
            )}
          </>
        )}

        {plan.status === "ready" && (
          <>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Worksheet snapshot — edit Capture worksheet to change settings.
              Options below are suggestions only.
            </p>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Proposed settings
              </p>
              <ExposurePresetRow plan={plan} />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Why this summary
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.explanation}
              </p>
            </div>

            {plan.skyBackgroundSummary && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Sky context
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {plan.skyBackgroundSummary}
                </p>
              </div>
            )}

            {plan.options.length > 0 && (
              <ExposureTradeoffSelector options={plan.options} />
            )}

            <div>
              <p
                className={cn(
                  "text-[11px] font-medium",
                  CONFIDENCE_STYLES[plan.confidence] ??
                    CONFIDENCE_STYLES.Experimental,
                )}
              >
                {plan.confidence}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {plan.confidenceReason}
              </p>
            </div>

            {plan.missingEvidence.length > 0 && (
              <p className="text-[11px] text-amber-200/80 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
                Still missing: {plan.missingEvidence.join(", ")}.
              </p>
            )}
          </>
        )}

        {(plan.status === "ready" || plan.status === "incomplete") && (
          <MissionFitSummary missionFit={plan.missionFit} />
        )}

        <p className="text-[10px] text-zinc-600 leading-snug">
          Sources: {plan.sources.join(" · ")}
        </p>
      </div>
    </div>
  );
}
