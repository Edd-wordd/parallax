"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MissionTarget } from "@/lib/types";
import {
  DEFAULT_SETUP_ALLOWANCE_MINUTES,
  derivedFrames,
  estimatedCaptureMinutes,
  fitWarning,
  missingExposureEvidence,
} from "@/lib/capture/worksheetMath";

export type CaptureWorksheetPatch = Partial<
  Pick<
    MissionTarget,
    | "proposedFilter"
    | "proposedSubLengthSeconds"
    | "proposedIso"
    | "proposedGain"
    | "proposedIntegrationMinutes"
  >
>;

interface CaptureWorksheetProps {
  targets: MissionTarget[];
  transitionMinutes: number;
  /** Available minutes for fit check (session window or scheduled imaging sum). */
  availableMinutes?: number | null;
  cameraName?: string | null;
  hasSkyContext?: boolean;
  hasTrackingHint?: boolean;
  readOnly?: boolean;
  onPatchTarget: (targetId: string, patch: CaptureWorksheetPatch) => void;
  className?: string;
  /** Compact for Capture phase */
  compact?: boolean;
}

function numOrEmpty(n: number | null | undefined): string {
  return n == null || Number.isNaN(n) ? "" : String(n);
}

export function CaptureWorksheet({
  targets,
  transitionMinutes,
  availableMinutes = null,
  cameraName = null,
  hasSkyContext = false,
  hasTrackingHint = false,
  readOnly = false,
  onPatchTarget,
  className,
  compact = false,
}: CaptureWorksheetProps) {
  const estimated = estimatedCaptureMinutes(
    targets,
    transitionMinutes,
    DEFAULT_SETUP_ALLOWANCE_MINUTES,
  );
  const warn = fitWarning(estimated, availableMinutes);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3
            className={cn(
              "font-semibold text-zinc-200",
              compact ? "text-xs uppercase tracking-wider text-zinc-400" : "text-sm",
            )}
          >
            Capture worksheet
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Proposed settings only — actual frames stay blank until recorded.
            Fit checks warn; they never shorten a target or rewrite the schedule.
          </p>
        </div>
        {estimated != null && (
          <p className="text-[11px] text-zinc-400 tabular-nums">
            Est. {Math.round(estimated)} min (incl. {transitionMinutes} min
            transitions + {DEFAULT_SETUP_ALLOWANCE_MINUTES} min setup)
          </p>
        )}
      </div>

      {warn && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
          {warn}
        </div>
      )}

      <div className="space-y-3">
        {targets.map((t) => {
          const frames = derivedFrames(
            t.proposedIntegrationMinutes,
            t.proposedSubLengthSeconds,
          );
          const gaps = missingExposureEvidence({
            hasCameraName: !!cameraName?.trim(),
            hasFilter: !!t.proposedFilter?.trim(),
            hasIsoOrGain:
              t.proposedIso != null || t.proposedGain != null,
            hasSkyContext,
            hasTrackingHint,
          });
          return (
            <div
              key={t.targetId}
              className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-200">
                  {t.targetName}
                </p>
                <p className="text-[11px] text-zinc-500 tabular-nums">
                  {frames != null
                    ? `${frames} frames (derived)`
                    : "Frames — enter sub + integration"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <label className="block text-[10px] text-zinc-500">
                  Filter
                  <Input
                    className="mt-0.5 h-8 text-xs"
                    value={t.proposedFilter ?? ""}
                    disabled={readOnly}
                    onChange={(e) =>
                      onPatchTarget(t.targetId, {
                        proposedFilter: e.target.value || null,
                      })
                    }
                    placeholder="e.g. L / Ha"
                  />
                </label>
                <label className="block text-[10px] text-zinc-500">
                  Sub (s)
                  <Input
                    type="number"
                    min={1}
                    className="mt-0.5 h-8 text-xs"
                    value={numOrEmpty(t.proposedSubLengthSeconds)}
                    disabled={readOnly}
                    onChange={(e) =>
                      onPatchTarget(t.targetId, {
                        proposedSubLengthSeconds:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value) || null,
                      })
                    }
                  />
                </label>
                <label className="block text-[10px] text-zinc-500">
                  ISO
                  <Input
                    type="number"
                    min={0}
                    className="mt-0.5 h-8 text-xs"
                    value={numOrEmpty(t.proposedIso)}
                    disabled={readOnly}
                    onChange={(e) =>
                      onPatchTarget(t.targetId, {
                        proposedIso:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value) || null,
                      })
                    }
                  />
                </label>
                <label className="block text-[10px] text-zinc-500">
                  Gain
                  <Input
                    type="number"
                    min={0}
                    className="mt-0.5 h-8 text-xs"
                    value={numOrEmpty(t.proposedGain)}
                    disabled={readOnly}
                    onChange={(e) =>
                      onPatchTarget(t.targetId, {
                        proposedGain:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value) || null,
                      })
                    }
                  />
                </label>
                <label className="block text-[10px] text-zinc-500">
                  Integration (min)
                  <Input
                    type="number"
                    min={1}
                    className="mt-0.5 h-8 text-xs"
                    value={numOrEmpty(t.proposedIntegrationMinutes)}
                    disabled={readOnly}
                    onChange={(e) =>
                      onPatchTarget(t.targetId, {
                        proposedIntegrationMinutes:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value) || null,
                      })
                    }
                  />
                </label>
              </div>
              {gaps.length > 0 && (
                <p className="text-[10px] text-zinc-600">
                  Starting guidance only — missing for a precise exposure
                  recommendation: {gaps.join(", ")}. Values are editable
                  assumptions, not measured camera telemetry.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
