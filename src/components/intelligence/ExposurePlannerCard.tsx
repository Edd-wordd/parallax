"use client";

import { cn } from "@/lib/utils";
import { ExposurePresetRow } from "./ExposurePresetRow";
import { ExposureTradeoffSelector } from "./ExposureTradeoffSelector";
import { MissionFitSummary } from "./MissionFitSummary";
import type { ExposurePlan } from "@/lib/mock/exposurePlans";

interface ExposurePlannerCardProps {
  targetName?: string | null;
  plan: ExposurePlan | null;
  className?: string;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  "High confidence": "text-emerald-400/90",
  "Moderate confidence": "text-amber-400/90",
  Experimental: "text-zinc-500",
};

function ExposureEmptyState() {
  return (
    <div className="p-3 space-y-2">
      <p className="text-xs text-zinc-400 leading-relaxed">
        Create a mission or select a planned target to generate capture settings.
      </p>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Exposure strategy will adapt to target brightness, sky conditions, and
        available capture window.
      </p>
    </div>
  );
}

export function ExposurePlannerCard({
  targetName,
  plan,
  className,
}: ExposurePlannerCardProps) {
  const isEmpty = !plan;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="dash-section-title text-zinc-400">Exposure Plan</h2>
          {!isEmpty && (
            <span className="text-[9px] uppercase tracking-wider text-amber-400/90">
              Demo
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {isEmpty
            ? "Select a target for capture recommendations"
            : `For ${targetName ?? "Target"} — ${plan.preset} preset (mock — not optimal exposure)`}
        </p>
      </div>
      {isEmpty ? (
        <ExposureEmptyState />
      ) : (
        <div className="p-3 space-y-4">
          <p className="text-[11px] text-amber-200/80 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
            Demo placeholder — not a calculated optimal exposure. Use the Capture
            worksheet for editable proposed settings. Missing evidence typically
            includes camera gain/ISO mode, filter, sky context, and tracking.
          </p>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Demo exposure preset
            </p>
            <ExposurePresetRow plan={plan} />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              Why this exposure was chosen
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {plan.explanation}
            </p>
          </div>

          {plan.skyBackgroundSummary && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Sky background
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.skyBackgroundSummary}
              </p>
            </div>
          )}

          {plan.brightnessProfile && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Target brightness profile
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.brightnessProfile}
              </p>
            </div>
          )}

          {plan.dynamicRangeRisk && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Dynamic range
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.dynamicRangeRisk}
              </p>
            </div>
          )}

          <ExposureTradeoffSelector options={plan.options} />

          {plan.expectedKeepers && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Expected keepers
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {plan.expectedKeepers}
              </p>
            </div>
          )}

          <div>
            <p
              className={cn(
                "text-[11px] font-medium",
                CONFIDENCE_STYLES[plan.confidence] ??
                  CONFIDENCE_STYLES["High confidence"]
              )}
            >
              {plan.confidence}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {plan.confidenceReason}
            </p>
          </div>

          <MissionFitSummary missionFit={plan.missionFit} />

          {plan.calibrationAssumption && (
            <p className="text-[11px] text-zinc-500 italic leading-relaxed">
              {plan.calibrationAssumption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
