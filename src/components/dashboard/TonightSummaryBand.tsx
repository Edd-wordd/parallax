"use client";

import { MOCK_FORECAST_STATE } from "@/lib/mock/skyIntelligence";

/**
 * Compact informational summary band using forecast data.
 * No CTAs, no buttons — dashboard insight strip only.
 */
export function TonightSummaryBand() {
  const { forecastConfidence, forecast } = MOCK_FORECAST_STATE;
  const { imagingWindow, targetVisibilityWindow, moonInterference, cloudCover } =
    forecast;

  const summary =
    `Conditions look viable for imaging tonight with a ${imagingWindow} usable window. ` +
    `${moonInterference.toLowerCase()} moon interference and ${cloudCover}% cloud cover. ` +
    `Forecast confidence ${forecastConfidence}% — best window ${targetVisibilityWindow}.`;

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
        Tonight&apos;s Summary
      </h3>
      <p className="text-sm text-zinc-400 leading-snug">{summary}</p>
    </div>
  );
}
