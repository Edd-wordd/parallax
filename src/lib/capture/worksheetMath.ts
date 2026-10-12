/**
 * Capture worksheet derived math — frames, estimated time, fit warnings.
 * Never mutates schedules or shortens targets.
 */

export const DEFAULT_SETUP_ALLOWANCE_MINUTES = 10;

export function derivedFrames(
  integrationMinutes: number | null | undefined,
  subSeconds: number | null | undefined,
): number | null {
  if (
    integrationMinutes == null ||
    subSeconds == null ||
    !Number.isFinite(integrationMinutes) ||
    !Number.isFinite(subSeconds) ||
    integrationMinutes <= 0 ||
    subSeconds <= 0
  ) {
    return null;
  }
  return Math.ceil((integrationMinutes * 60) / subSeconds);
}

export type WorksheetTargetInput = {
  proposedIntegrationMinutes?: number | null;
};

/**
 * Estimated capture time for the night:
 * sum(integration) + transitionMinutes * max(0, targetCount - 1) + setupAllowance.
 */
export function estimatedCaptureMinutes(
  targets: WorksheetTargetInput[],
  transitionMinutes: number,
  setupAllowanceMin: number = DEFAULT_SETUP_ALLOWANCE_MINUTES,
): number | null {
  const integrations = targets
    .map((t) => t.proposedIntegrationMinutes)
    .filter((n): n is number => n != null && Number.isFinite(n) && n > 0);
  if (integrations.length === 0) return null;
  const imaging = integrations.reduce((a, b) => a + b, 0);
  const transitions =
    Math.max(0, integrations.length - 1) *
    Math.max(0, transitionMinutes);
  return imaging + transitions + Math.max(0, setupAllowanceMin);
}

/**
 * Warn when estimated capture exceeds available budget (scheduled imaging or window).
 * Returns a message or null — never mutates plan values.
 */
export function fitWarning(
  estimatedMinutes: number | null | undefined,
  availableMinutes: number | null | undefined,
): string | null {
  if (
    estimatedMinutes == null ||
    availableMinutes == null ||
    !Number.isFinite(estimatedMinutes) ||
    !Number.isFinite(availableMinutes)
  ) {
    return null;
  }
  if (estimatedMinutes <= availableMinutes) return null;
  const over = Math.ceil(estimatedMinutes - availableMinutes);
  return `Plan needs about ${Math.round(estimatedMinutes)} min (incl. transitions and setup) but only ${Math.round(availableMinutes)} min are available — ${over} min over. Adjust integration or schedule; targets are not shortened automatically.`;
}

/** Evidence gaps before any exposure “recommendation”. */
export function missingExposureEvidence(input: {
  hasCameraName?: boolean;
  hasFilter?: boolean;
  hasIsoOrGain?: boolean;
  hasSkyContext?: boolean;
  hasTrackingHint?: boolean;
}): string[] {
  const gaps: string[] = [];
  if (!input.hasCameraName) gaps.push("camera / sensor profile");
  if (!input.hasFilter) gaps.push("filter choice");
  if (!input.hasIsoOrGain) gaps.push("camera gain/ISO mode");
  if (!input.hasSkyContext) gaps.push("sky / darkness context for the session");
  if (!input.hasTrackingHint) gaps.push("tracking / guiding capability");
  return gaps;
}
