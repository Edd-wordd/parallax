/**
 * Apply a night schedule result onto MissionTarget fields.
 */

import { formatLocalHm } from "@/lib/sky/visibility";
import type { MissionTarget } from "@/lib/types";
import type { DashboardRecommendation } from "@/lib/recommendations/types";
import { recommendationToMissionTarget } from "@/lib/recommendations/mapper";
import type {
  NightScheduleResult,
  ScheduleTargetInput,
  ScheduledSegment,
} from "@/lib/schedule/types";
import { DEFAULT_IMAGING_MINUTES } from "@/lib/schedule/types";

export function recommendationToScheduleInput(
  rec: DashboardRecommendation,
  desiredMinutes: number = DEFAULT_IMAGING_MINUTES,
): ScheduleTargetInput {
  return {
    catalogId: rec.id,
    name: rec.name,
    usableStart: rec.windowStart,
    usableEnd: rec.windowEnd,
    desiredMinutes,
    score: rec.score,
  };
}

export function applySegmentToMissionTarget(
  base: MissionTarget,
  segment: ScheduledSegment,
  sequenceIndex: number,
): MissionTarget {
  return {
    ...base,
    sequenceIndex,
    roleLabel: `SEQ ${sequenceIndex}`,
    scheduledStartAt: segment.start.toISOString(),
    scheduledEndAt: segment.end.toISOString(),
    plannedImagingMinutes: segment.imagingMinutes,
    // Keep HH:MM usable-window labels for legacy Capturing copy
    plannedWindowStart: base.plannedWindowStart || formatLocalHm(segment.start),
    plannedWindowEnd: base.plannedWindowEnd || formatLocalHm(segment.end),
  };
}

/**
 * Build mission targets from a successful (or partial) schedule + source recs.
 * Only scheduled segments are included — conflicts are omitted (user must resolve).
 */
export function missionTargetsFromSchedule(
  result: NightScheduleResult,
  recommendations: DashboardRecommendation[],
): MissionTarget[] {
  const byId = new Map(recommendations.map((r) => [r.id, r]));
  return result.segments.map((seg, i) => {
    const rec = byId.get(seg.catalogId);
    const base = rec
      ? recommendationToMissionTarget(rec, i + 1)
      : {
          targetId: seg.catalogId,
          targetName: seg.name,
          targetType: "nebula" as const,
          plannedWindowStart: formatLocalHm(seg.start),
          plannedWindowEnd: formatLocalHm(seg.end),
          score: 0,
          sequenceIndex: i + 1,
          roleLabel: `SEQ ${i + 1}`,
        };
    return applySegmentToMissionTarget(base, seg, i + 1);
  });
}

/** True when default imaging duration fits the usable window. */
export function defaultDurationFitsWindow(
  rec: DashboardRecommendation,
  desiredMinutes: number = DEFAULT_IMAGING_MINUTES,
): boolean {
  return rec.windowDurationMinutes >= desiredMinutes;
}
