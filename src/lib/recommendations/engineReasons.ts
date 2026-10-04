/**
 * Deterministic “engine reasoning” bullets from calculated recommendation fields.
 * Not AI-generated — template text over real numbers.
 */

import type { DashboardRecommendation } from "@/lib/recommendations/types";

export function buildEngineReasons(target: DashboardRecommendation): string[] {
  const reasons: string[] = [];

  reasons.push(
    `Usable imaging window ${target.windowLabel} (${target.windowDurationMinutes} min) while above ${target.minAltitudeDeg}° during astronomical darkness in your session.`,
  );

  reasons.push(
    `Peaks near ${target.peakAltitudeDeg.toFixed(0)}°` +
      (target.peakAtLabel !== "—" ? ` at ${target.peakAtLabel}` : "") +
      ` (geometric max for this site ≈ ${target.maxPossibleAltitudeDeg.toFixed(0)}°).`,
  );

  const moonBits: string[] = [];
  if (target.moonPhaseLabel) moonBits.push(target.moonPhaseLabel);
  if (target.moonInterference) {
    moonBits.push(`${target.moonInterference} interference`);
  }
  moonBits.push(
    `stays at least ${target.minMoonSeparationDeg.toFixed(0)}° from the target (your limit ${target.moonToleranceDeg}°)`,
  );
  reasons.push(`Moon: ${moonBits.join(" · ")}.`);

  if (target.narrowWindow) {
    reasons.push(
      "Window is under 90 minutes — start near the beginning of the usable period.",
    );
  }

  reasons.push(
    `Score ${target.score} from altitude (${target.altitudeScore}/10) and Moon separation (${target.moonSeparationScore}/10) only — rig fit and exposure are not included.`,
  );

  return reasons;
}
