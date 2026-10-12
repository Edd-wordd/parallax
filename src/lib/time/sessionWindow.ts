/**
 * Shared observing session window: start/end instants, defaults, labels, TZ display.
 * Device TZ when siteTimezone is null; optional IANA site timezone for labels/defaults.
 */

export const DEFAULT_SESSION_HOURS = 6;
export const EVENING_START_HOUR = 21;
/**
 * Local hours 0..(DAYTIME_START_HOUR-1) and >= EVENING_START_HOUR default to the
 * next evening 21:00 (useful observing night over / already past tonight's start).
 * Hours DAYTIME_START_HOUR..(EVENING_START_HOUR-1) default to today 21:00.
 */
export const DAYTIME_START_HOUR = 12;

export type SessionWindow = {
  start: Date;
  end: Date;
};

export type DisplayTimeZone = {
  /** IANA id or undefined for device */
  timeZone?: string;
  /** Short label e.g. MDT or UTC-6 */
  abbreviation: string;
  /** "Device time" or "Site: America/Denver" */
  sourceLabel: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parts of an instant in a timezone (device local if timeZone omitted). */
export function zonedParts(
  date: Date,
  timeZone?: string | null,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some engines
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/**
 * Convert wall-clock components in a timezone to a UTC Date.
 * Uses iterative offset correction (no external TZ lib).
 */
export function wallTimeInZoneToUtc(
  wall: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    second?: number;
  },
  timeZone?: string | null,
): Date {
  const minute = wall.minute ?? 0;
  const second = wall.second ?? 0;
  if (!timeZone) {
    return new Date(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      minute,
      second,
      0,
    );
  }
  let utc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    minute,
    second,
  );
  for (let i = 0; i < 3; i++) {
    const asDate = new Date(utc);
    const parts = zonedParts(asDate, timeZone);
    const asWallUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const desiredWallUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      minute,
      second,
    );
    utc += desiredWallUtc - asWallUtc;
  }
  return new Date(utc);
}

export function resolveDisplayTimeZone(
  siteTimezone?: string | null,
): DisplayTimeZone {
  const trimmed = siteTimezone?.trim() || "";
  if (!trimmed) {
    const abbr =
      new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "local";
    return {
      timeZone: undefined,
      abbreviation: abbr,
      sourceLabel: "Device time",
    };
  }
  let abbr = trimmed;
  try {
    abbr =
      new Intl.DateTimeFormat(undefined, {
        timeZone: trimmed,
        timeZoneName: "short",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? trimmed;
  } catch {
    return {
      timeZone: undefined,
      abbreviation:
        new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value ?? "local",
      sourceLabel: "Device time",
    };
  }
  return {
    timeZone: trimmed,
    abbreviation: abbr,
    sourceLabel: `Site: ${trimmed}`,
  };
}

/**
 * Practical upcoming session:
 * - Hour 12–20 → today 21:00
 * - Hour ≥ 21 or 0–11 → next calendar day 21:00
 * End = start + DEFAULT_SESSION_HOURS.
 */
export function defaultUpcomingSession(
  now: Date = new Date(),
  siteTimezone?: string | null,
): SessionWindow {
  const display = resolveDisplayTimeZone(siteTimezone);
  const tz = display.timeZone;
  const parts = zonedParts(now, tz);
  let year = parts.year;
  let month = parts.month;
  let day = parts.day;
  const useNextEvening =
    parts.hour >= EVENING_START_HOUR || parts.hour < DAYTIME_START_HOUR;
  if (useNextEvening) {
    const next = wallTimeInZoneToUtc(
      { year, month, day, hour: 12 },
      tz,
    );
    next.setTime(next.getTime() + 24 * 60 * 60 * 1000);
    const np = zonedParts(next, tz);
    year = np.year;
    month = np.month;
    day = np.day;
  }
  const start = wallTimeInZoneToUtc(
    { year, month, day, hour: EVENING_START_HOUR, minute: 0 },
    tz,
  );
  const end = new Date(
    start.getTime() + DEFAULT_SESSION_HOURS * 3_600_000,
  );
  return { start, end };
}

export function sessionWindowFromMission(input: {
  dateTime: string | Date;
  sessionEndAt?: string | Date | null;
  fallbackHours?: number;
}): SessionWindow {
  const hours = input.fallbackHours ?? DEFAULT_SESSION_HOURS;
  const start =
    input.dateTime instanceof Date
      ? new Date(input.dateTime)
      : new Date(input.dateTime);
  if (Number.isNaN(start.getTime())) {
    return defaultUpcomingSession();
  }
  if (input.sessionEndAt != null && input.sessionEndAt !== "") {
    const end =
      input.sessionEndAt instanceof Date
        ? new Date(input.sessionEndAt)
        : new Date(input.sessionEndAt);
    if (!Number.isNaN(end.getTime())) {
      return { start, end };
    }
  }
  return {
    start,
    end: new Date(start.getTime() + hours * 3_600_000),
  };
}

/** True when start is strictly before now. */
export function isSessionStartInPast(
  start: Date,
  now: Date = new Date(),
): boolean {
  return start.getTime() < now.getTime();
}

/** True when the entire window has ended. */
export function isSessionWindowEnded(
  end: Date,
  now: Date = new Date(),
): boolean {
  return end.getTime() <= now.getTime();
}

export function isValidSessionOrder(start: Date, end: Date): boolean {
  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end.getTime() > start.getTime()
  );
}

/** Observing-night calendar key (local/site): evening starts use that date; pre-noon uses previous date. */
export function observingNightKey(
  start: Date,
  timeZone?: string | null,
): { year: number; month: number; day: number } {
  const p = zonedParts(start, timeZone);
  if (p.hour >= 12) {
    return { year: p.year, month: p.month, day: p.day };
  }
  const prev = new Date(start.getTime() - 12 * 60 * 60 * 1000);
  const pp = zonedParts(prev, timeZone);
  return { year: pp.year, month: pp.month, day: pp.day };
}

function formatShortDateParts(p: {
  year: number;
  month: number;
  day: number;
}): string {
  const d = new Date(p.year, p.month - 1, p.day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Label for chips: "Tonight · Oct 5–6 (MDT)" or a dated range with TZ.
 */
export function formatObservingNightLabel(input: {
  start: Date;
  end: Date;
  now?: Date;
  siteTimezone?: string | null;
}): string {
  const now = input.now ?? new Date();
  const display = resolveDisplayTimeZone(input.siteTimezone);
  const tz = display.timeZone;
  const night = observingNightKey(input.start, tz);
  const nowNight = observingNightKey(now, tz);
  const startP = zonedParts(input.start, tz);
  const endP = zonedParts(input.end, tz);
  const crosses =
    startP.year !== endP.year ||
    startP.month !== endP.month ||
    startP.day !== endP.day;
  const dateSpan = crosses
    ? `${formatShortDateParts(startP)}–${formatShortDateParts(endP)}`
    : formatShortDateParts(startP);
  const isTonight =
    night.year === nowNight.year &&
    night.month === nowNight.month &&
    night.day === nowNight.day;
  if (isTonight) {
    return crosses
      ? `Tonight · ${dateSpan} (${display.abbreviation})`
      : `Tonight (${dateSpan}, ${display.abbreviation})`;
  }
  return `${dateSpan} (${display.abbreviation})`;
}

export function formatSessionWindowDates(input: {
  start: Date;
  end: Date;
  siteTimezone?: string | null;
}): string {
  const display = resolveDisplayTimeZone(input.siteTimezone);
  const tz = display.timeZone;
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const a = input.start.toLocaleString(undefined, opts);
  const b = input.end.toLocaleString(undefined, opts);
  return `${a} → ${b} · ${display.abbreviation}`;
}

/** datetime-local value in device local (browser constraint). */
export function toDatetimeLocalValueFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Apply "Use current time": start = now; keep duration if end was after old start, else +6h.
 */
export function useCurrentTimeWindow(
  previous: SessionWindow,
  now: Date = new Date(),
): SessionWindow {
  const durationMs = Math.max(
    previous.end.getTime() - previous.start.getTime(),
    DEFAULT_SESSION_HOURS * 3_600_000,
  );
  const start = new Date(now);
  const end = new Date(start.getTime() + durationMs);
  return { start, end };
}

/** True if any scheduled segment falls outside [start, end]. */
export function scheduleOutsideWindow(
  segments: { scheduledStartAt?: string | null; scheduledEndAt?: string | null }[],
  window: SessionWindow,
): boolean {
  for (const s of segments) {
    if (!s.scheduledStartAt || !s.scheduledEndAt) continue;
    const a = new Date(s.scheduledStartAt).getTime();
    const b = new Date(s.scheduledEndAt).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) continue;
    if (a < window.start.getTime() || b > window.end.getTime()) return true;
  }
  return false;
}
