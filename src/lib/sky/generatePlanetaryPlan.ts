/**
 * Planetary windows from Astronomy Engine apparent positions.
 * Same dark-window, minimum-altitude, and Moon-separation rules as deep-sky.
 * The Moon itself skips the separation exclusion (it would always fail).
 * Surface detail and exposure advice are not produced here.
 */

import {
  AngleBetween,
  Body,
  Equator,
  GeoVector,
  Horizon,
  Observer,
} from "astronomy-engine";
import type { Mission, MissionTarget } from "@/lib/types";
import { planetByName, type PlanetTarget } from "@/lib/sky/planets";
import {
  computeSessionAstronomy,
  formatLocalHm,
  scoreAltitude,
  scoreMoonSeparation,
  type SessionAstronomyResult,
  type TimeInterval,
  type UnavailableReason,
} from "@/lib/sky/visibility";

export type GeneratePlanetaryPlanInput = {
  latDeg: number;
  lonDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  constraints: Mission["constraints"];
  /** Display names, e.g. "Jupiter". Unknown names are excluded. */
  planetNames: string[];
};

export type PlanetaryExclusion = {
  name: string;
  reason: UnavailableReason | "unknown_body";
};

export type GeneratePlanetaryPlanResult = {
  astronomy: SessionAstronomyResult;
  targets: MissionTarget[];
  excluded: PlanetaryExclusion[];
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function durationMs(i: TimeInterval): number {
  return i.end.getTime() - i.start.getTime();
}

function intervalsFromSamples(times: Date[], ok: boolean[]): TimeInterval[] {
  const out: TimeInterval[] = [];
  let runStart: Date | null = null;
  for (let i = 0; i < times.length; i++) {
    if (ok[i]) {
      if (!runStart) runStart = times[i]!;
    } else if (runStart) {
      const end = times[i - 1]!;
      if (end.getTime() > runStart.getTime()) out.push({ start: runStart, end });
      runStart = null;
    }
  }
  if (runStart) {
    const end = times[times.length - 1]!;
    if (end.getTime() > runStart.getTime()) out.push({ start: runStart, end });
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

function altitudeDeg(date: Date, observer: Observer, body: Body): number {
  const eq = Equator(body, date, observer, true, true);
  return Horizon(date, observer, eq.ra, eq.dec, "normal").altitude;
}

function moonSeparationDeg(date: Date, body: Body): number {
  return AngleBetween(
    GeoVector(Body.Moon, date, true),
    GeoVector(body, date, true),
  );
}

function sampleTimes(interval: TimeInterval, stepMs: number): Date[] {
  const times: Date[] = [];
  for (let t = interval.start.getTime(); t <= interval.end.getTime(); t += stepMs) {
    times.push(new Date(t));
  }
  if (
    times.length === 0 ||
    times[times.length - 1]!.getTime() < interval.end.getTime()
  ) {
    times.push(interval.end);
  }
  return times;
}

function evaluatePlanet(
  planet: PlanetTarget,
  observer: Observer,
  effectiveDark: TimeInterval,
  moonToleranceDeg: number,
  minAltitudeDeg: number,
  phaseFraction: number,
  sampleStepMinutes: number,
): { target: MissionTarget | null; reason: UnavailableReason | null } {
  const stepMs = sampleStepMinutes * 60_000;
  const times = sampleTimes(effectiveDark, stepMs);
  const above: boolean[] = [];
  let peakAltitudeDeg = -90;
  for (const d of times) {
    const alt = altitudeDeg(d, observer, planet.body);
    above.push(alt >= minAltitudeDeg);
    if (alt > peakAltitudeDeg) peakAltitudeDeg = alt;
  }

  const aboveIntervals = intervalsFromSamples(times, above);
  const recommendedWindow = longestInterval(aboveIntervals);
  const minutesAbove = aboveIntervals.reduce(
    (sum, i) => sum + durationMs(i) / 60_000,
    0,
  );

  if (!recommendedWindow || minutesAbove < sampleStepMinutes) {
    return { target: null, reason: "never_above_min_altitude" };
  }

  const isMoon = planet.body === Body.Moon;
  let minMoonSeparationDeg: number | null = null;
  let moonSeparationScore: number | undefined;

  if (!isMoon) {
    minMoonSeparationDeg = 180;
    for (
      let t = recommendedWindow.start.getTime();
      t <= recommendedWindow.end.getTime();
      t += stepMs
    ) {
      minMoonSeparationDeg = Math.min(
        minMoonSeparationDeg,
        moonSeparationDeg(new Date(t), planet.body),
      );
    }
    minMoonSeparationDeg = Math.min(
      minMoonSeparationDeg,
      moonSeparationDeg(recommendedWindow.end, planet.body),
    );
    if (minMoonSeparationDeg < moonToleranceDeg) {
      return { target: null, reason: "moon_too_close" };
    }
    moonSeparationScore = scoreMoonSeparation(
      minMoonSeparationDeg,
      moonToleranceDeg,
      phaseFraction,
    );
  }

  const effectiveDarkMinutes = durationMs(effectiveDark) / 60_000;
  const altitudeScore = scoreAltitude(
    peakAltitudeDeg,
    minAltitudeDeg,
    minutesAbove,
    effectiveDarkMinutes,
  );
  const score = isMoon
    ? clamp(Math.round(altitudeScore * 10), 0, 100)
    : clamp(
        Math.round(altitudeScore * 6 + (moonSeparationScore ?? 0) * 4),
        0,
        100,
      );

  const windowLabel = `${formatLocalHm(recommendedWindow.start)}–${formatLocalHm(recommendedWindow.end)}`;
  const whyIncluded = isMoon
    ? `Peaks at ${peakAltitudeDeg.toFixed(0)}° during ${windowLabel}. Moon-separation rule is not applied to the Moon itself. Surface detail and exposure advice are not calculated.`
    : `Peaks at ${peakAltitudeDeg.toFixed(0)}°; Moon ≥ ${minMoonSeparationDeg!.toFixed(0)}° away during ${windowLabel}. Surface detail and exposure advice are not calculated.`;

  return {
    reason: null,
    target: {
      targetId: planet.id,
      targetName: planet.name,
      targetType: planet.targetType,
      plannedWindowStart: formatLocalHm(recommendedWindow.start),
      plannedWindowEnd: formatLocalHm(recommendedWindow.end),
      score,
      sequenceIndex: 0,
      roleLabel: "",
      isFallback: false,
      altitudeScore,
      moonSeparationScore,
      whyIncluded,
    },
  };
}

export function generatePlanetaryPlan(
  input: GeneratePlanetaryPlanInput,
): GeneratePlanetaryPlanResult {
  const astronomy = computeSessionAstronomy({
    site: { latDeg: input.latDeg, lonDeg: input.lonDeg },
    sessionStart: input.sessionStart,
    sessionEnd: input.sessionEnd,
    minAltitudeDeg: input.constraints.minAltitude,
    moonToleranceDeg: input.constraints.moonTolerance,
    targets: [],
  });

  const excluded: PlanetaryExclusion[] = [];
  if (!astronomy.valid) {
    for (const name of input.planetNames) {
      excluded.push({ name, reason: "invalid_session" });
    }
    return { astronomy, targets: [], excluded };
  }
  if (!astronomy.effectiveDark) {
    for (const name of input.planetNames) {
      excluded.push({ name, reason: "no_astronomical_darkness" });
    }
    return { astronomy, targets: [], excluded };
  }

  const observer = new Observer(input.latDeg, input.lonDeg, 0);
  const phaseFraction = astronomy.moon?.phaseFraction ?? 0;
  const ranked: MissionTarget[] = [];

  for (const name of input.planetNames) {
    const planet = planetByName(name);
    if (!planet) {
      excluded.push({ name, reason: "unknown_body" });
      continue;
    }
    const evaluated = evaluatePlanet(
      planet,
      observer,
      astronomy.effectiveDark,
      input.constraints.moonTolerance,
      input.constraints.minAltitude,
      phaseFraction,
      5,
    );
    if (!evaluated.target) {
      excluded.push({
        name,
        reason: evaluated.reason ?? "never_above_min_altitude",
      });
      continue;
    }
    ranked.push(evaluated.target);
  }

  ranked.sort((a, b) => b.score - a.score);
  const targets = ranked.map((t, i) => ({
    ...t,
    sequenceIndex: i + 1,
    roleLabel: `SEQ ${i + 1}`,
  }));

  return { astronomy, targets, excluded };
}
