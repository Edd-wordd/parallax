/**
 * Helpers for planned vs actual schedule display during observing.
 */

import { formatWindowLabel } from "@/lib/sky/visibility";
import {
  DEFAULT_TRANSITION_MINUTES,
} from "@/lib/schedule/types";
import { hasTimedSchedule, targetScheduleLabel } from "@/lib/schedule/display";
import type { Mission, MissionTarget } from "@/lib/types";

export function plannedLabel(t: MissionTarget): string {
  return targetScheduleLabel(t);
}

export function actualLabel(t: MissionTarget): string | null {
  if (!t.actualStartAt || !t.actualEndAt) return null;
  const start = new Date(t.actualStartAt);
  const end = new Date(t.actualEndAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return formatWindowLabel(start, end);
}

export function transitionMinutesOf(mission: Mission): number {
  return mission.transitionMinutes ?? DEFAULT_TRANSITION_MINUTES;
}

export function scheduleSummaryLines(input: {
  mission: Mission;
  current: MissionTarget | null;
  next: MissionTarget | null;
}): string[] {
  const { mission, current, next } = input;
  const lines: string[] = [];
  if (current) {
    lines.push(
      `Current: ${current.targetName} · Planned ${plannedLabel(current)}`,
    );
    if (hasTimedSchedule(current) && current.plannedImagingMinutes) {
      lines.push(`Planned imaging: ${current.plannedImagingMinutes} min`);
    }
  }
  if (next) {
    lines.push(`Next: ${next.targetName} · Planned ${plannedLabel(next)}`);
    lines.push(
      `Transition allowance: ${transitionMinutesOf(mission)} min`,
    );
  }
  if (!current?.scheduledStartAt) {
    lines.push(
      "No timed schedule for current target — showing usable window when available.",
    );
  }
  return lines;
}

/** Format ISO → value for datetime-local input (local wall clock). */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
