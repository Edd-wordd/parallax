/**
 * Deterministic session astronomy: dark window, Moon, target visibility.
 * Uses astronomy-engine only. No weather / seeing / framing.
 */

import {
  AngleBetween,
  Body,
  DefineStar,
  Equator,
  GeoVector,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from "astronomy-engine";
import type { CuratedTarget } from "@/lib/sky/curatedTargets";

const MS_PER_DAY = 86_400_000;
const ASTRONOMICAL_TWILIGHT_ALT_DEG = -18;
/** Star1 slot for fixed DSO DefineStar / GeoVector (redefined per target). */
const STAR_BODY = Body.Star1;
const STAR_DISTANCE_LY = 1000;

export type TimeInterval = { start: Date; end: Date };

export type UnavailableReason =
  | "invalid_session"
  | "no_astronomical_darkness"
  | "never_above_min_altitude"
  | "moon_too_close";

export interface SessionAstronomyInput {
  site: { latDeg: number; lonDeg: number; heightMeters?: number };
  sessionStart: Date;
  sessionEnd: Date;
  minAltitudeDeg: number;
  moonToleranceDeg: number;
  targets: CuratedTarget[];
  /** Sampling step inside effective dark for altitude / Moon sep. Default 5. */
  sampleStepMinutes?: number;
}

export interface MoonInfo {
  phaseFraction: number;
  phaseLabel: string;
  elongationDeg: number;
  riseAt: Date | null;
  setAt: Date | null;
  interferenceLabel: "Low" | "Moderate" | "High";
  /** Apparent altitude at session/dark midpoint (degrees). */
  altitudeDeg: number | null;
}

export interface TargetVisibility {
  targetId: string;
  targetName: string;
  targetType: CuratedTarget["type"];
  /** Longest contiguous above-min-alt ∩ effectiveDark */
  recommendedWindow: TimeInterval | null;
  peakAltitudeDeg: number | null;
  peakAt: Date | null;
  minMoonSeparationDeg: number | null;
  minutesAboveMinAltitude: number;
  altitudeScore: number | null;
  moonSeparationScore: number | null;
  /** 0–100 from altitude + moon only */
  score: number | null;
  unavailableReason: UnavailableReason | null;
  whyIncluded: string | null;
}

export interface SessionAstronomyResult {
  valid: boolean;
  session: TimeInterval;
  /** Broadest astronomical night overlapping the search span (may extend past session). */
  darkWindow: TimeInterval | null;
  /** dark ∩ session */
  effectiveDark: TimeInterval | null;
  moon: MoonInfo | null;
  targets: TargetVisibility[];
  emptyReason: UnavailableReason | null;
}

function makeObserver(site: SessionAstronomyInput["site"]): Observer {
  return new Observer(site.latDeg, site.lonDeg, site.heightMeters ?? 0);
}

function intersect(
  a: TimeInterval | null,
  b: TimeInterval | null,
): TimeInterval | null {
  if (!a || !b) return null;
  const start = a.start.getTime() > b.start.getTime() ? a.start : b.start;
  const end = a.end.getTime() < b.end.getTime() ? a.end : b.end;
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function durationMs(i: TimeInterval): number {
  return i.end.getTime() - i.start.getTime();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Local HH:MM for display (browser timezone). */
export function formatLocalHm(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatLocalWindow(interval: TimeInterval | null): string {
  if (!interval) return "—";
  return formatWindowLabel(interval.start, interval.end);
}

function shortMonthDay(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * HH:MM–HH:MM, with calendar dates when the window crosses midnight.
 */
export function formatWindowLabel(start: Date, end: Date): string {
  const startHm = formatLocalHm(start);
  const endHm = formatLocalHm(end);
  if (isSameLocalCalendarDay(start, end)) {
    return `${startHm}–${endHm}`;
  }
  return `${startHm} ${shortMonthDay(start)} – ${endHm} ${shortMonthDay(end)}`;
}

export function moonPhaseLabel(elongationDeg: number): string {
  const e = ((elongationDeg % 360) + 360) % 360;
  if (e < 22.5 || e >= 337.5) return "New Moon";
  if (e < 67.5) return "Waxing Crescent";
  if (e < 112.5) return "First Quarter";
  if (e < 157.5) return "Waxing Gibbous";
  if (e < 202.5) return "Full Moon";
  if (e < 247.5) return "Waning Gibbous";
  if (e < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

function moonInterference(
  phaseFraction: number,
): MoonInfo["interferenceLabel"] {
  if (phaseFraction < 0.35) return "Low";
  if (phaseFraction < 0.7) return "Moderate";
  return "High";
}

/**
 * Find dusk (Sun descending through −18°) then dawn after it, near `around`.
 */
export function findAstronomicalNight(
  observer: Observer,
  around: Date,
): TimeInterval | null {
  const searchFrom = new Date(around.getTime() - MS_PER_DAY);
  const dusk = SearchAltitude(
    Body.Sun,
    observer,
    -1,
    searchFrom,
    2.5,
    ASTRONOMICAL_TWILIGHT_ALT_DEG,
  );
  if (!dusk) return null;
  const dawn = SearchAltitude(
    Body.Sun,
    observer,
    +1,
    dusk.date,
    1.5,
    ASTRONOMICAL_TWILIGHT_ALT_DEG,
  );
  if (!dawn) return null;
  if (dawn.date.getTime() <= dusk.date.getTime()) return null;
  return { start: dusk.date, end: dawn.date };
}

/**
 * Prefer the astronomical night that overlaps the session; if none, the nearest night
 * whose dusk is before session end.
 */
export function computeDarkWindow(
  observer: Observer,
  sessionStart: Date,
  sessionEnd: Date,
): TimeInterval | null {
  const candidates: TimeInterval[] = [];
  // Probe around session start, mid, and day before (overnight / DST edges).
  const probes = [
    new Date(sessionStart.getTime() - MS_PER_DAY),
    sessionStart,
    new Date(
      sessionStart.getTime() +
        (sessionEnd.getTime() - sessionStart.getTime()) / 2,
    ),
    sessionEnd,
  ];
  const seen = new Set<string>();
  for (const p of probes) {
    const night = findAstronomicalNight(observer, p);
    if (!night) continue;
    const key = `${night.start.toISOString()}|${night.end.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(night);
  }
  if (!candidates.length) return null;

  const session: TimeInterval = { start: sessionStart, end: sessionEnd };
  let best: TimeInterval | null = null;
  let bestOverlap = 0;
  for (const night of candidates) {
    const ov = intersect(night, session);
    const ovMs = ov ? durationMs(ov) : 0;
    if (ovMs > bestOverlap) {
      bestOverlap = ovMs;
      best = night;
    }
  }
  if (best) return best;

  // No overlap: return the night whose start is closest after/before session mid.
  const mid =
    sessionStart.getTime() +
    (sessionEnd.getTime() - sessionStart.getTime()) / 2;
  candidates.sort(
    (a, b) =>
      Math.abs(a.start.getTime() - mid) - Math.abs(b.start.getTime() - mid),
  );
  return candidates[0] ?? null;
}

function defineTargetStar(target: CuratedTarget): void {
  DefineStar(STAR_BODY, target.raHours, target.decDeg, STAR_DISTANCE_LY);
}

function moonTargetSeparationDeg(date: Date, target: CuratedTarget): number {
  defineTargetStar(target);
  const moonVec = GeoVector(Body.Moon, date, true);
  const starVec = GeoVector(STAR_BODY, date, false);
  return AngleBetween(moonVec, starVec);
}

function targetAltitudeDeg(
  date: Date,
  observer: Observer,
  target: CuratedTarget,
): number {
  const hor = Horizon(
    date,
    observer,
    target.raHours,
    target.decDeg,
    "normal",
  );
  return hor.altitude;
}

/** Contiguous intervals where sample predicate holds. */
function intervalsFromSamples(
  times: Date[],
  ok: boolean[],
): TimeInterval[] {
  const out: TimeInterval[] = [];
  let runStart: Date | null = null;
  for (let i = 0; i < times.length; i++) {
    if (ok[i]) {
      if (!runStart) runStart = times[i]!;
    } else if (runStart) {
      const end = times[i - 1]!;
      if (end.getTime() > runStart.getTime()) {
        out.push({ start: runStart, end });
      }
      runStart = null;
    }
  }
  if (runStart) {
    const end = times[times.length - 1]!;
    if (end.getTime() > runStart.getTime()) {
      out.push({ start: runStart, end });
    }
  }
  return out;
}

function longestInterval(intervals: TimeInterval[]): TimeInterval | null {
  let best: TimeInterval | null = null;
  let bestMs = 0;
  for (const i of intervals) {
    const ms = durationMs(i);
    if (ms > bestMs) {
      bestMs = ms;
      best = i;
    }
  }
  return best;
}

export function scoreAltitude(
  peakAltitudeDeg: number,
  minAltitudeDeg: number,
  minutesAbove: number,
  effectiveDarkMinutes: number,
): number {
  const span = Math.max(1, 90 - minAltitudeDeg);
  const peakPart = clamp(
    (peakAltitudeDeg - minAltitudeDeg) / span,
    0,
    1,
  );
  const timePart =
    effectiveDarkMinutes > 0
      ? clamp(minutesAbove / effectiveDarkMinutes, 0, 1)
      : 0;
  const blended = 0.7 * peakPart + 0.3 * timePart;
  return clamp(Math.round(1 + blended * 9), 1, 10);
}

export function scoreMoonSeparation(
  minSepDeg: number,
  moonToleranceDeg: number,
  phaseFraction: number,
): number {
  const usable = Math.max(1, 180 - moonToleranceDeg);
  const sepPart = clamp((minSepDeg - moonToleranceDeg) / usable, 0, 1);
  // Bright Moon + closer sep hurts more.
  const phasePenalty = phaseFraction * (1 - sepPart) * 0.35;
  const raw = sepPart - phasePenalty;
  return clamp(Math.round(1 + clamp(raw, 0, 1) * 9), 1, 10);
}

function evaluateTarget(
  target: CuratedTarget,
  observer: Observer,
  effectiveDark: TimeInterval,
  moonToleranceDeg: number,
  minAltitudeDeg: number,
  phaseFraction: number,
  sampleStepMinutes: number,
): TargetVisibility {
  const stepMs = sampleStepMinutes * 60_000;
  const times: Date[] = [];
  for (
    let t = effectiveDark.start.getTime();
    t <= effectiveDark.end.getTime();
    t += stepMs
  ) {
    times.push(new Date(t));
  }
  if (
    times.length === 0 ||
    times[times.length - 1]!.getTime() < effectiveDark.end.getTime()
  ) {
    times.push(effectiveDark.end);
  }

  const above: boolean[] = [];
  let peakAltitudeDeg = -90;
  let peakAt: Date | null = null;
  for (const d of times) {
    const alt = targetAltitudeDeg(d, observer, target);
    above.push(alt >= minAltitudeDeg);
    if (alt > peakAltitudeDeg) {
      peakAltitudeDeg = alt;
      peakAt = d;
    }
  }

  const aboveIntervals = intervalsFromSamples(times, above);
  const recommendedWindow = longestInterval(aboveIntervals);
  const minutesAboveMinAltitude = aboveIntervals.reduce(
    (sum, i) => sum + durationMs(i) / 60_000,
    0,
  );

  if (!recommendedWindow || minutesAboveMinAltitude < sampleStepMinutes) {
    return {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      recommendedWindow: null,
      peakAltitudeDeg: peakAltitudeDeg > -90 ? peakAltitudeDeg : null,
      peakAt,
      minMoonSeparationDeg: null,
      minutesAboveMinAltitude,
      altitudeScore: null,
      moonSeparationScore: null,
      score: null,
      unavailableReason: "never_above_min_altitude",
      whyIncluded: null,
    };
  }

  // Sample Moon separation across recommended window.
  let minMoonSeparationDeg = 180;
  for (
    let t = recommendedWindow.start.getTime();
    t <= recommendedWindow.end.getTime();
    t += stepMs
  ) {
    const sep = moonTargetSeparationDeg(new Date(t), target);
    if (sep < minMoonSeparationDeg) minMoonSeparationDeg = sep;
  }
  // Include end sample.
  minMoonSeparationDeg = Math.min(
    minMoonSeparationDeg,
    moonTargetSeparationDeg(recommendedWindow.end, target),
  );

  if (minMoonSeparationDeg < moonToleranceDeg) {
    return {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      recommendedWindow: null,
      peakAltitudeDeg,
      peakAt,
      minMoonSeparationDeg,
      minutesAboveMinAltitude,
      altitudeScore: null,
      moonSeparationScore: null,
      score: null,
      unavailableReason: "moon_too_close",
      whyIncluded: null,
    };
  }

  const effectiveDarkMinutes = durationMs(effectiveDark) / 60_000;
  const altitudeScore = scoreAltitude(
    peakAltitudeDeg,
    minAltitudeDeg,
    minutesAboveMinAltitude,
    effectiveDarkMinutes,
  );
  const moonSeparationScore = scoreMoonSeparation(
    minMoonSeparationDeg,
    moonToleranceDeg,
    phaseFraction,
  );
  const score = clamp(
    Math.round(altitudeScore * 6 + moonSeparationScore * 4),
    0,
    100,
  );

  const whyIncluded = `Peaks at ${peakAltitudeDeg.toFixed(0)}°; Moon ≥ ${minMoonSeparationDeg.toFixed(0)}° away during ${formatLocalWindow(recommendedWindow)}.`;

  return {
    targetId: target.id,
    targetName: target.name,
    targetType: target.type,
    recommendedWindow,
    peakAltitudeDeg,
    peakAt,
    minMoonSeparationDeg,
    minutesAboveMinAltitude,
    altitudeScore,
    moonSeparationScore,
    score,
    unavailableReason: null,
    whyIncluded,
  };
}

function computeMoonInfo(
  observer: Observer,
  effectiveDark: TimeInterval | null,
  session: TimeInterval,
): MoonInfo {
  const mid = effectiveDark
    ? new Date(
        effectiveDark.start.getTime() + durationMs(effectiveDark) / 2,
      )
    : new Date(session.start.getTime() + durationMs(session) / 2);

  const illum = Illumination(Body.Moon, mid);
  const elongationDeg = MoonPhase(mid);
  const phaseFraction = illum.phase_fraction;
  const phaseLabel = moonPhaseLabel(elongationDeg);

  const searchFrom = new Date(session.start.getTime() - MS_PER_DAY * 0.5);
  const rise = SearchRiseSet(Body.Moon, observer, +1, searchFrom, 2);
  const set = SearchRiseSet(Body.Moon, observer, -1, searchFrom, 2);

  let altitudeDeg: number | null = null;
  try {
    const eq = Equator(Body.Moon, mid, observer, true, true);
    const hor = Horizon(mid, observer, eq.ra, eq.dec, "normal");
    altitudeDeg = hor.altitude;
  } catch {
    altitudeDeg = null;
  }

  return {
    phaseFraction,
    phaseLabel,
    elongationDeg,
    riseAt: rise?.date ?? null,
    setAt: set?.date ?? null,
    interferenceLabel: moonInterference(phaseFraction),
    altitudeDeg,
  };
}

export function formatMoonRiseSet(moon: MoonInfo): string {
  const parts: string[] = [];
  if (moon.riseAt) parts.push(`Rises ${formatLocalHm(moon.riseAt)}`);
  if (moon.setAt) parts.push(`Sets ${formatLocalHm(moon.setAt)}`);
  return parts.length ? parts.join(" · ") : "Rise/set unavailable";
}

/**
 * Primary entry: session astronomy for conditions UI and plan generation.
 */
export function computeSessionAstronomy(
  input: SessionAstronomyInput,
): SessionAstronomyResult {
  const session: TimeInterval = {
    start: input.sessionStart,
    end: input.sessionEnd,
  };

  if (
    !(input.sessionStart instanceof Date) ||
    !(input.sessionEnd instanceof Date) ||
    Number.isNaN(input.sessionStart.getTime()) ||
    Number.isNaN(input.sessionEnd.getTime()) ||
    input.sessionEnd.getTime() <= input.sessionStart.getTime()
  ) {
    return {
      valid: false,
      session,
      darkWindow: null,
      effectiveDark: null,
      moon: null,
      targets: [],
      emptyReason: "invalid_session",
    };
  }

  const observer = makeObserver(input.site);
  const darkWindow = computeDarkWindow(
    observer,
    input.sessionStart,
    input.sessionEnd,
  );
  const effectiveDark = intersect(darkWindow, session);
  const moon = computeMoonInfo(observer, effectiveDark, session);
  const sampleStepMinutes = input.sampleStepMinutes ?? 5;

  if (!effectiveDark) {
    return {
      valid: true,
      session,
      darkWindow,
      effectiveDark: null,
      moon,
      targets: input.targets.map((t) => ({
        targetId: t.id,
        targetName: t.name,
        targetType: t.type,
        recommendedWindow: null,
        peakAltitudeDeg: null,
        peakAt: null,
        minMoonSeparationDeg: null,
        minutesAboveMinAltitude: 0,
        altitudeScore: null,
        moonSeparationScore: null,
        score: null,
        unavailableReason: "no_astronomical_darkness",
        whyIncluded: null,
      })),
      emptyReason: "no_astronomical_darkness",
    };
  }

  const targets = input.targets.map((t) =>
    evaluateTarget(
      t,
      observer,
      effectiveDark,
      input.moonToleranceDeg,
      input.minAltitudeDeg,
      moon.phaseFraction,
      sampleStepMinutes,
    ),
  );

  const anyOk = targets.some((t) => t.recommendedWindow && t.score != null);

  return {
    valid: true,
    session,
    darkWindow,
    effectiveDark,
    moon,
    targets,
    emptyReason: anyOk ? null : "never_above_min_altitude",
  };
}
