/**
 * Night simulation axis from the mission session window + schedule SoT.
 */

import type { MissionTarget } from "@/lib/types";
import { sessionWindowFromMission } from "@/lib/time/sessionWindow";

export type NightSimSegment = {
  targetId: string;
  targetName: string;
  start: Date;
  end: Date;
  score: number;
  source: "scheduled" | "planned_window";
};

export type NightSimModel = {
  sessionStart: Date;
  sessionEnd: Date;
  durationMinutes: number;
  segments: NightSimSegment[];
};

/** Parse HH:MM (optional) onto the calendar day of `anchor`, rolling past midnight. */
function hmOnDay(hm: string, anchor: Date): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  const d = new Date(anchor);
  d.setHours(h, min, 0, 0);
  return d;
}

function segmentForTarget(
  t: MissionTarget,
  sessionStart: Date,
  sessionEnd: Date,
): NightSimSegment | null {
  if (t.scheduledStartAt && t.scheduledEndAt) {
    const start = new Date(t.scheduledStartAt);
    const end = new Date(t.scheduledEndAt);
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start
    ) {
      return {
        targetId: t.targetId,
        targetName: t.targetName,
        start,
        end,
        score: t.score ?? 0,
        source: "scheduled",
      };
    }
  }

  if (t.plannedWindowStart && t.plannedWindowEnd) {
    // Try anchoring HH:MM on session start and session end local days (overnight).
    const anchors = [sessionStart, sessionEnd];
    for (const anchor of anchors) {
      let start = hmOnDay(t.plannedWindowStart, anchor);
      let end = hmOnDay(t.plannedWindowEnd, anchor);
      if (!start || !end) continue;
      if (end <= start) {
        end = new Date(end.getTime() + 24 * 60 * 60_000);
      }
      if (end.getTime() <= sessionStart.getTime()) {
        start = new Date(start.getTime() + 24 * 60 * 60_000);
        end = new Date(end.getTime() + 24 * 60 * 60_000);
      }
      const clippedStart = start < sessionStart ? sessionStart : start;
      const clippedEnd = end > sessionEnd ? sessionEnd : end;
      if (clippedEnd <= clippedStart) continue;
      return {
        targetId: t.targetId,
        targetName: t.targetName,
        start: clippedStart,
        end: clippedEnd,
        score: t.score ?? 0,
        source: "planned_window",
      };
    }
  }

  return null;
}

export function buildNightSimModel(input: {
  dateTime: string;
  sessionEndAt?: string | null;
  targets: MissionTarget[];
}): NightSimModel {
  const { start: sessionStart, end: sessionEnd } = sessionWindowFromMission({
    dateTime: input.dateTime,
    sessionEndAt: input.sessionEndAt,
  });
  const durationMinutes = Math.max(
    1,
    Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 60_000),
  );
  const segments = input.targets
    .map((t) => segmentForTarget(t, sessionStart, sessionEnd))
    .filter((s): s is NightSimSegment => s != null);

  return { sessionStart, sessionEnd, durationMinutes, segments };
}

export function activeSegmentsAt(
  model: NightSimModel,
  minutesFromStart: number,
): NightSimSegment[] {
  const t =
    model.sessionStart.getTime() +
    Math.min(
      model.durationMinutes,
      Math.max(0, minutesFromStart),
    ) *
      60_000;
  return model.segments.filter(
    (s) => s.start.getTime() <= t && t <= s.end.getTime(),
  );
}

export function pctAlongSession(
  model: NightSimModel,
  at: Date,
): number {
  const span = model.sessionEnd.getTime() - model.sessionStart.getTime();
  if (span <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      ((at.getTime() - model.sessionStart.getTime()) / span) * 100,
    ),
  );
}

export function formatSimClock(
  model: NightSimModel,
  minutesFromStart: number,
  timeZone?: string | null,
): string {
  const d = new Date(
    model.sessionStart.getTime() +
      Math.min(model.durationMinutes, Math.max(0, minutesFromStart)) * 60_000,
  );
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}
