/**
 * Build MissionTarget[] from deterministic session astronomy (deep-sky only).
 */

import type { Mission, MissionTarget } from "@/lib/types";
import {
  recommendEligibleTargets,
  type CuratedTarget,
} from "@/lib/sky/curatedTargets";
import {
  computeSessionAstronomy,
  formatLocalHm,
  type SessionAstronomyResult,
} from "@/lib/sky/visibility";

export type GenerateDeepSkyPlanInput = {
  latDeg: number;
  lonDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  constraints: Mission["constraints"];
  targets?: CuratedTarget[];
  maxTargets?: number;
};

export type GenerateDeepSkyPlanResult = {
  astronomy: SessionAstronomyResult;
  targets: MissionTarget[];
};

export function generateDeepSkyPlan(
  input: GenerateDeepSkyPlanInput,
): GenerateDeepSkyPlanResult {
  const catalog =
    input.targets ??
    recommendEligibleTargets(input.constraints.targetTypes ?? []);

  const astronomy = computeSessionAstronomy({
    site: { latDeg: input.latDeg, lonDeg: input.lonDeg },
    sessionStart: input.sessionStart,
    sessionEnd: input.sessionEnd,
    minAltitudeDeg: input.constraints.minAltitude,
    moonToleranceDeg: input.constraints.moonTolerance,
    targets: catalog,
  });

  const maxTargets = input.maxTargets ?? 8;
  const ranked = astronomy.targets
    .filter(
      (t) =>
        t.recommendedWindow != null &&
        t.score != null &&
        t.unavailableReason == null,
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, maxTargets);

  const targets: MissionTarget[] = ranked.map((t, i) => ({
    targetId: t.targetId,
    targetName: t.targetName,
    targetType: t.targetType,
    plannedWindowStart: formatLocalHm(t.recommendedWindow!.start),
    plannedWindowEnd: formatLocalHm(t.recommendedWindow!.end),
    score: t.score ?? 0,
    sequenceIndex: i + 1,
    roleLabel: `SEQ ${i + 1}`,
    isFallback: false,
    altitudeScore: t.altitudeScore ?? undefined,
    moonSeparationScore: t.moonSeparationScore ?? undefined,
    // rigFramingScore intentionally withheld — not calculated this milestone
    whyIncluded: t.whyIncluded ?? undefined,
  }));

  return { astronomy, targets };
}
