/**
 * Display helpers for scheduled vs usable-window times.
 */

import { formatWindowLabel } from "@/lib/sky/visibility";
import type { MissionTarget } from "@/lib/types";

/** Prefer scheduled times when present; else usable-window HH:MM. */
export function targetScheduleLabel(t: MissionTarget): string {
  if (t.scheduledStartAt && t.scheduledEndAt) {
    const start = new Date(t.scheduledStartAt);
    const end = new Date(t.scheduledEndAt);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return formatWindowLabel(start, end);
    }
  }
  if (t.plannedWindowStart && t.plannedWindowEnd) {
    return `${t.plannedWindowStart} – ${t.plannedWindowEnd}`;
  }
  return "No timed schedule";
}

export function hasTimedSchedule(t: MissionTarget): boolean {
  return Boolean(t.scheduledStartAt && t.scheduledEndAt);
}
