/**
 * Place a target's planned window on the mission session axis.
 * HH:MM values roll past midnight onto the session night.
 */

import type { MissionTarget } from "@/lib/types";

export type SessionClockBar = {
  targetId: string;
  name: string;
  label: string;
  startPct: number;
  widthPct: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Clock time on the session night. Rolls forward one day when it falls before the start. */
export function instantOnSession(
  hm: string,
  sessionStart: Date,
  sessionEnd: Date,
): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  const d = new Date(sessionStart);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < sessionStart.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  if (d.getTime() > sessionEnd.getTime()) return null;
  return d;
}

function targetInstants(
  target: MissionTarget,
  sessionStart: Date,
  sessionEnd: Date,
): { start: Date; end: Date } | null {
  if (target.scheduledStartAt && target.scheduledEndAt) {
    const start = new Date(target.scheduledStartAt);
    const end = new Date(target.scheduledEndAt);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
      return { start, end };
    }
  }
  if (!target.plannedWindowStart || !target.plannedWindowEnd) return null;
  const start = instantOnSession(
    target.plannedWindowStart,
    sessionStart,
    sessionEnd,
  );
  let end = instantOnSession(
    target.plannedWindowEnd,
    sessionStart,
    sessionEnd,
  );
  if (!start || !end) return null;
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 86_400_000);
  }
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

export function sessionClockBars(input: {
  sessionStart: Date;
  sessionEnd: Date;
  targets: MissionTarget[];
}): SessionClockBar[] {
  const span =
    input.sessionEnd.getTime() - input.sessionStart.getTime();
  if (span <= 0) return [];
  const bars: SessionClockBar[] = [];
  for (const target of input.targets) {
    const window = targetInstants(
      target,
      input.sessionStart,
      input.sessionEnd,
    );
    if (!window) continue;
    const startMs = clamp(
      window.start.getTime(),
      input.sessionStart.getTime(),
      input.sessionEnd.getTime(),
    );
    const endMs = clamp(
      window.end.getTime(),
      input.sessionStart.getTime(),
      input.sessionEnd.getTime(),
    );
    if (endMs <= startMs) continue;
    const startPct = ((startMs - input.sessionStart.getTime()) / span) * 100;
    const widthPct = ((endMs - startMs) / span) * 100;
    const label =
      target.plannedWindowStart && target.plannedWindowEnd
        ? `${target.plannedWindowStart}–${target.plannedWindowEnd}`
        : target.targetName;
    bars.push({
      targetId: target.targetId,
      name: target.targetName,
      label,
      startPct,
      widthPct,
    });
  }
  return bars;
}

export function nowPercent(
  sessionStart: Date,
  sessionEnd: Date,
  now: Date = new Date(),
): number | null {
  const span = sessionEnd.getTime() - sessionStart.getTime();
  if (span <= 0) return null;
  const t = now.getTime();
  if (t < sessionStart.getTime() || t > sessionEnd.getTime()) return null;
  return ((t - sessionStart.getTime()) / span) * 100;
}
