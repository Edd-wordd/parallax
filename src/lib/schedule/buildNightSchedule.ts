/**
 * Deterministic night schedule: user-order earliest-fit.
 * Never silently shortens or drops a selected target.
 */

import { formatWindowLabel } from "@/lib/sky/visibility";
import {
  DEFAULT_TRANSITION_MINUTES,
  MAX_TRANSITION_MINUTES,
  MIN_TRANSITION_MINUTES,
  type NightScheduleResult,
  type ScheduleConflict,
  type ScheduleTargetInput,
  type ScheduledSegment,
} from "@/lib/schedule/types";

function clampTransition(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_TRANSITION_MINUTES;
  return Math.min(
    MAX_TRANSITION_MINUTES,
    Math.max(MIN_TRANSITION_MINUTES, Math.round(minutes)),
  );
}

function maxFitMinutes(
  usableStart: Date,
  usableEnd: Date,
  notBefore: Date,
): number {
  const start = Math.max(usableStart.getTime(), notBefore.getTime());
  const end = usableEnd.getTime();
  if (end <= start) return 0;
  return Math.floor((end - start) / 60_000);
}

function placeEarliest(
  target: ScheduleTargetInput,
  notBefore: Date,
): { start: Date; end: Date } | null {
  const desiredMs = target.desiredMinutes * 60_000;
  if (desiredMs <= 0) return null;
  const startMs = Math.max(
    target.usableStart.getTime(),
    notBefore.getTime(),
  );
  const endMs = startMs + desiredMs;
  if (endMs > target.usableEnd.getTime()) return null;
  return { start: new Date(startMs), end: new Date(endMs) };
}

/**
 * Schedule targets in given order. Conflicts collect unscheduled targets
 * without mutating desired durations.
 */
export function buildNightSchedule(input: {
  sessionStart: Date;
  sessionEnd: Date;
  targets: ScheduleTargetInput[];
  transitionMinutes?: number;
}): NightScheduleResult {
  const transitionMinutes = clampTransition(
    input.transitionMinutes ?? DEFAULT_TRANSITION_MINUTES,
  );
  const sessionStart = input.sessionStart;
  const sessionEnd = input.sessionEnd;
  const segments: ScheduledSegment[] = [];
  const conflicts: ScheduleConflict[] = [];
  let cursor = sessionStart;

  for (const target of input.targets) {
    const usableStart =
      target.usableStart.getTime() < sessionStart.getTime()
        ? sessionStart
        : target.usableStart;
    const usableEnd =
      target.usableEnd.getTime() > sessionEnd.getTime()
        ? sessionEnd
        : target.usableEnd;

    const clipped: ScheduleTargetInput = {
      ...target,
      usableStart,
      usableEnd,
    };

    const notBefore =
      segments.length === 0
        ? sessionStart
        : new Date(cursor.getTime() + transitionMinutes * 60_000);

    const windowLen = maxFitMinutes(usableStart, usableEnd, sessionStart);
    if (windowLen <= 0 || usableEnd.getTime() <= usableStart.getTime()) {
      conflicts.push({
        catalogId: target.catalogId,
        name: target.name,
        reason: "No usable imaging window in this session.",
      });
      continue;
    }

    if (target.desiredMinutes > windowLen) {
      conflicts.push({
        catalogId: target.catalogId,
        name: target.name,
        reason: `Desired ${target.desiredMinutes} min exceeds usable window (${windowLen} min: ${formatWindowLabel(usableStart, usableEnd)}).`,
        suggestedMaxMinutes: windowLen,
      });
      continue;
    }

    const placed = placeEarliest(clipped, notBefore);
    if (!placed) {
      const maxAfter = maxFitMinutes(usableStart, usableEnd, notBefore);
      conflicts.push({
        catalogId: target.catalogId,
        name: target.name,
        reason:
          maxAfter <= 0
            ? `No time left after prior targets and ${transitionMinutes} min transition (usable ${formatWindowLabel(usableStart, usableEnd)}).`
            : `Cannot fit ${target.desiredMinutes} min after prior targets (at most ${maxAfter} min remain in window).`,
        suggestedMaxMinutes: maxAfter > 0 ? maxAfter : undefined,
      });
      continue;
    }

    segments.push({
      catalogId: target.catalogId,
      name: target.name,
      start: placed.start,
      end: placed.end,
      imagingMinutes: target.desiredMinutes,
      label: formatWindowLabel(placed.start, placed.end),
    });
    cursor = placed.end;
  }

  const lastEnd =
    segments.length > 0
      ? segments[segments.length - 1]!.end.getTime()
      : sessionStart.getTime();
  const unusedMinutes = Math.max(
    0,
    Math.floor((sessionEnd.getTime() - lastEnd) / 60_000),
  );

  return {
    ok: conflicts.length === 0 && segments.length === input.targets.length,
    segments,
    conflicts,
    transitionMinutes,
    sessionStart,
    sessionEnd,
    unusedMinutes,
    proposalNote: null,
  };
}

/**
 * Propose a feasible schedule from ranked candidates (score order).
 * Tries full set, then largest prefix that schedules cleanly.
 * Never silently shortens durations.
 */
export function proposeFeasibleSchedule(input: {
  sessionStart: Date;
  sessionEnd: Date;
  targets: ScheduleTargetInput[];
  transitionMinutes?: number;
}): NightScheduleResult {
  const ordered = [...input.targets].sort((a, b) => {
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    if (sb !== sa) return sb - sa;
    return a.catalogId.localeCompare(b.catalogId);
  });

  if (ordered.length === 0) {
    return {
      ok: false,
      segments: [],
      conflicts: [],
      transitionMinutes: clampTransition(
        input.transitionMinutes ?? DEFAULT_TRANSITION_MINUTES,
      ),
      sessionStart: input.sessionStart,
      sessionEnd: input.sessionEnd,
      unusedMinutes: Math.floor(
        (input.sessionEnd.getTime() - input.sessionStart.getTime()) / 60_000,
      ),
      proposalNote: "No targets selected.",
    };
  }

  for (let n = ordered.length; n >= 1; n--) {
    const slice = ordered.slice(0, n);
    const result = buildNightSchedule({
      sessionStart: input.sessionStart,
      sessionEnd: input.sessionEnd,
      targets: slice,
      transitionMinutes: input.transitionMinutes,
    });
    if (result.ok) {
      const dropped = ordered.slice(n);
      return {
        ...result,
        proposalNote:
          dropped.length === 0
            ? `All ${n} targets fit with ${result.transitionMinutes} min transitions.`
            : `Only the top ${n} of ${ordered.length} fit without changing durations. Left out: ${dropped.map((t) => t.name).join(", ")}.`,
      };
    }
  }

  // Nothing fits even alone
  const alone = buildNightSchedule({
    sessionStart: input.sessionStart,
    sessionEnd: input.sessionEnd,
    targets: [ordered[0]!],
    transitionMinutes: input.transitionMinutes,
  });
  return {
    ...alone,
    proposalNote:
      "Could not schedule any target at the requested durations. Shorten a duration or pick another target.",
  };
}
