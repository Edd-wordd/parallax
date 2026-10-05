/**
 * Map generateDeepSkyPlan / SessionAstronomyResult → dashboard recommendation VMs.
 */

import { curatedTargetById } from "@/lib/sky/curatedTargets";
import { generateDeepSkyPlan } from "@/lib/sky/generateDeepSkyPlan";
import {
  formatLocalHm,
  formatWindowLabel,
  type UnavailableReason,
} from "@/lib/sky/visibility";
import { computeRigFraming } from "@/lib/gear/framing";
import type { Mission, MissionTarget } from "@/lib/types";
import type {
  DashboardRecommendation,
  DashboardRecommendationsResult,
  FramingGearForRecs,
  RejectedRecommendation,
} from "@/lib/recommendations/types";

const NARROW_WINDOW_MINUTES = 90;
const SESSION_HOURS = 6;

/** Geometric culmination upper bound (degrees). */
export function geometricMaxAltitudeDeg(
  latDeg: number,
  decDeg: number,
): number {
  return 90 - Math.abs(latDeg - decDeg);
}

export function isPeakAltitudeSane(
  peakAltitudeDeg: number,
  latDeg: number,
  decDeg: number,
  epsilonDeg = 1.5,
): boolean {
  const max = geometricMaxAltitudeDeg(latDeg, decDeg);
  return peakAltitudeDeg <= max + epsilonDeg;
}

export function sessionIntervalFromDateTime(dateTime: string | Date): {
  start: Date;
  end: Date;
} {
  const start =
    dateTime instanceof Date ? new Date(dateTime) : new Date(dateTime);
  if (Number.isNaN(start.getTime())) {
    const now = new Date();
    return {
      start: now,
      end: new Date(now.getTime() + SESSION_HOURS * 3_600_000),
    };
  }
  return {
    start,
    end: new Date(start.getTime() + SESSION_HOURS * 3_600_000),
  };
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function reasonLabel(reason: UnavailableReason): string {
  switch (reason) {
    case "never_above_min_altitude":
      return "Stays below your minimum altitude";
    case "moon_too_close":
      return "Moon too close during the usable window";
    case "no_astronomical_darkness":
      return "No astronomical darkness in this session";
    case "invalid_session":
      return "Invalid session times";
    default:
      return "Not suitable for this session";
  }
}

function catalogById(id: string) {
  return curatedTargetById(id);
}

export function recommendationToMissionTarget(
  rec: DashboardRecommendation,
  sequenceIndex = 1,
): MissionTarget {
  return {
    targetId: rec.id,
    targetName: rec.name,
    targetType: rec.type,
    plannedWindowStart: rec.plannedWindowStart,
    plannedWindowEnd: rec.plannedWindowEnd,
    score: rec.score,
    sequenceIndex,
    roleLabel: `SEQ ${sequenceIndex}`,
    isFallback: false,
    altitudeScore: rec.altitudeScore,
    moonSeparationScore: rec.moonSeparationScore,
    whyIncluded: rec.whyIncluded ?? undefined,
  };
}

export type BuildRecommendationsInput = {
  latDeg: number | null | undefined;
  lonDeg: number | null | undefined;
  dateTime: string;
  constraints: Mission["constraints"];
  maxRecommendations?: number;
  now?: Date;
  /** Active rig for FOV evidence only — does not affect ranking */
  gear?: FramingGearForRecs;
  /** Override catalog (e.g. single visible-unranked target for Add to Plan) */
  targetsOverride?: import("@/lib/sky/curatedTargets").CuratedTarget[];
};

function mapPlanTargetToRecommendation(
  mt: MissionTarget,
  astronomy: import("@/lib/sky/visibility").SessionAstronomyResult,
  input: BuildRecommendationsInput,
  sessionStart: Date,
  sessionEnd: Date,
): DashboardRecommendation | null {
  const byId = new Map(astronomy.targets.map((t) => [t.targetId, t]));
  const vis = byId.get(mt.targetId);
  if (!vis?.recommendedWindow) return null;
  const cat = catalogById(mt.targetId);
  const dec = cat?.decDeg ?? 0;
  const maxAlt = geometricMaxAltitudeDeg(input.latDeg!, dec);
  const win = vis.recommendedWindow;
  const durationMin = Math.round(
    (win.end.getTime() - win.start.getTime()) / 60_000,
  );
  const major = cat?.sizeMajorArcmin ?? cat?.angularSizeArcmin ?? null;
  const framing = computeRigFraming(
    {
      focalLengthMm: input.gear?.focalLengthMm ?? NaN,
      sensorWidthMm: input.gear?.sensorWidthMm,
      sensorHeightMm: input.gear?.sensorHeightMm,
      opticsFactor: input.gear?.opticsFactor,
    },
    {
      sizeMajorArcmin: major,
      sizeMinorArcmin: cat?.sizeMinorArcmin,
      sizeVerified: cat?.sizeVerified === true,
    },
  );
  const moon = astronomy.moon;
  return {
    id: mt.targetId,
    name: mt.targetName,
    type: mt.targetType,
    score: mt.score,
    altitudeScore: mt.altitudeScore ?? vis.altitudeScore ?? 0,
    moonSeparationScore:
      mt.moonSeparationScore ?? vis.moonSeparationScore ?? 0,
    windowStart: win.start,
    windowEnd: win.end,
    windowLabel: formatWindowLabel(win.start, win.end),
    windowDurationMinutes: durationMin,
    narrowWindow: durationMin < NARROW_WINDOW_MINUTES,
    peakAltitudeDeg: vis.peakAltitudeDeg ?? 0,
    peakAt: vis.peakAt,
    peakAtLabel: vis.peakAt ? formatLocalHm(vis.peakAt) : "—",
    minMoonSeparationDeg: vis.minMoonSeparationDeg ?? 0,
    maxPossibleAltitudeDeg: maxAlt,
    whyIncluded: vis.whyIncluded,
    constellation: cat?.constellation,
    magnitude: cat?.magnitude,
    moonPhaseLabel: moon?.phaseLabel ?? null,
    moonInterference: moon?.interferenceLabel ?? null,
    moonToleranceDeg: input.constraints.moonTolerance,
    minAltitudeDeg: input.constraints.minAltitude,
    sessionStart,
    sessionEnd,
    rigFit: framing.state,
    rigFitDetail: framing.detail,
    fovWidthArcmin: framing.fovWidthArcmin,
    fovHeightArcmin: framing.fovHeightArcmin,
    targetSizeMajorArcmin: framing.targetMajorArcmin,
    targetSizeMinorArcmin: framing.targetMinorArcmin,
    targetSizeKind: cat?.sizeKind ?? null,
    targetSizeSource: cat?.sizeSource ?? null,
    plannedWindowStart: mt.plannedWindowStart,
    plannedWindowEnd: mt.plannedWindowEnd,
  };
}

export function buildDashboardRecommendations(
  input: BuildRecommendationsInput,
): DashboardRecommendationsResult {
  const { start: sessionStart, end: sessionEnd } = sessionIntervalFromDateTime(
    input.dateTime,
  );
  const now = input.now ?? new Date();
  const isTonight = isSameLocalDay(sessionStart, now);
  const dateLabel = formatShortDate(sessionStart);
  const sectionTitle = isTonight
    ? `Recommendations for Tonight · ${dateLabel}`
    : `Recommendations for ${dateLabel}`;

  if (
    input.latDeg == null ||
    input.lonDeg == null ||
    !Number.isFinite(input.latDeg) ||
    !Number.isFinite(input.lonDeg)
  ) {
    return {
      status: "no_site",
      sectionTitle,
      dateLabel,
      isTonight,
      recommendations: [],
      rejected: [],
      emptyMessage: "Add a location with coordinates to see recommendations.",
      sessionStart,
      sessionEnd,
    };
  }

  if (sessionEnd.getTime() <= sessionStart.getTime()) {
    return {
      status: "invalid_session",
      sectionTitle,
      dateLabel,
      isTonight,
      recommendations: [],
      rejected: [],
      emptyMessage: "Session end must be after session start.",
      sessionStart,
      sessionEnd,
    };
  }

  const { astronomy, targets } = generateDeepSkyPlan({
    latDeg: input.latDeg,
    lonDeg: input.lonDeg,
    sessionStart,
    sessionEnd,
    constraints: input.constraints,
    maxTargets: input.maxRecommendations ?? 8,
    targets: input.targetsOverride,
  });

  if (!astronomy.valid) {
    return {
      status: "invalid_session",
      sectionTitle,
      dateLabel,
      isTonight,
      recommendations: [],
      rejected: [],
      emptyMessage: "Invalid session times.",
      sessionStart,
      sessionEnd,
    };
  }

  if (!astronomy.effectiveDark) {
    return {
      status: "no_darkness",
      sectionTitle,
      dateLabel,
      isTonight,
      recommendations: [],
      rejected: [],
      emptyMessage:
        "No astronomical darkness during this session. Try a later start or a longer night.",
      sessionStart,
      sessionEnd,
    };
  }

  const recommendations: DashboardRecommendation[] = targets
    .map((mt) =>
      mapPlanTargetToRecommendation(
        mt,
        astronomy,
        input,
        sessionStart,
        sessionEnd,
      ),
    )
    .filter((r): r is DashboardRecommendation => r != null);

  const rejected: RejectedRecommendation[] = astronomy.targets
    .filter((t) => t.unavailableReason != null && t.unavailableReason !== "no_astronomical_darkness")
    .slice(0, 6)
    .map((t) => ({
      id: t.targetId,
      name: t.targetName,
      type: t.targetType,
      unavailableReason: t.unavailableReason!,
      reasonLabel: reasonLabel(t.unavailableReason!),
    }));

  if (recommendations.length === 0) {
    return {
      status: "empty",
      sectionTitle,
      dateLabel,
      isTonight,
      recommendations: [],
      rejected,
      emptyMessage:
        "No deep-sky targets meet your altitude and Moon constraints for this session.",
      sessionStart,
      sessionEnd,
    };
  }

  return {
    status: "ready",
    sectionTitle,
    dateLabel,
    isTonight,
    recommendations,
    rejected,
    emptyMessage: null,
    sessionStart,
    sessionEnd,
  };
}

/** Context key for invalidating the plan store when inputs change. */
export function recommendationsContextKey(input: {
  locationId: string;
  dateTime: string;
  minAltitude: number;
  moonTolerance: number;
  targetTypes: string[];
  /** Gear id only for plan-clear on site/time/constraints — framing uses gear separately */
  gearId?: string;
}): string {
  return [
    input.locationId,
    input.dateTime,
    String(input.minAltitude),
    String(input.moonTolerance),
    [...input.targetTypes].sort().join(","),
  ].join("|");
}

/**
 * Resolve a single catalog id to a recommendation VM (including visible-unranked).
 * Returns null if unsuitable for the session.
 */
export function buildRecommendationForCatalogId(
  input: BuildRecommendationsInput & { targetId: string },
): DashboardRecommendation | null {
  const cat = catalogById(input.targetId);
  if (!cat || input.latDeg == null || input.lonDeg == null) return null;
  const result = buildDashboardRecommendations({
    ...input,
    targetsOverride: [cat],
    maxRecommendations: 1,
  });
  return result.recommendations[0] ?? null;
}
