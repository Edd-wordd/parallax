/**
 * Shared Tonight’s Sky metrics from Astronomy Engine + forecast providers.
 * Matches Observing Conditions for the same site/session.
 */

import type { SiteSessionForecast } from "@/lib/forecast/types";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import {
  computeSessionAstronomy,
  formatLocalHm,
  formatWindowLabel,
  type SessionAstronomyResult,
} from "@/lib/sky/visibility";

export type MetricValue = {
  display: string;
  available: boolean;
};

export type TonightSkyDisplay = {
  astronomy: SessionAstronomyResult;
  sessionStart: Date;
  sessionEnd: Date;
  moonPhase: MetricValue;
  moonPhasePercent: number | null;
  illumination: number | null;
  moonAltitude: MetricValue;
  moonset: MetricValue;
  bortle: MetricValue;
  seeing: MetricValue;
  cloudCover: MetricValue;
  windSpeed: MetricValue;
  /** effectiveDark — darkness overlapping the session (same clip as recommendations) */
  darkDuringSession: MetricValue;
  darkDurationHours: string | null;
  demoNotes: string[];
};

function unavailable(label = "Unavailable"): MetricValue {
  return { display: label, available: false };
}

function ok(display: string): MetricValue {
  return { display, available: true };
}

export function buildTonightSkyDisplay(input: {
  latDeg: number | null | undefined;
  lonDeg: number | null | undefined;
  bortle: number | null | undefined;
  dateTime: string;
  minAltitudeDeg: number;
  moonToleranceDeg: number;
  forecast: SiteSessionForecast | null;
  forecastLoading?: boolean;
}): TonightSkyDisplay | null {
  if (
    input.latDeg == null ||
    input.lonDeg == null ||
    !Number.isFinite(input.latDeg) ||
    !Number.isFinite(input.lonDeg)
  ) {
    return null;
  }

  const { start: sessionStart, end: sessionEnd } = sessionIntervalFromDateTime(
    input.dateTime,
  );

  const astronomy = computeSessionAstronomy({
    site: { latDeg: input.latDeg, lonDeg: input.lonDeg },
    sessionStart,
    sessionEnd,
    minAltitudeDeg: input.minAltitudeDeg,
    moonToleranceDeg: input.moonToleranceDeg,
    targets: [],
  });

  const moon = astronomy.moon;
  const weather = input.forecast?.weather;
  const astroWx = input.forecast?.astroWx;
  const wStatus = input.forecast?.status.weather;
  const aStatus = input.forecast?.status.astroWx;

  const dark = astronomy.effectiveDark;
  const darkDuringSession = dark
    ? ok(formatWindowLabel(dark.start, dark.end))
    : astronomy.valid
      ? unavailable("No astronomical darkness in this session")
      : unavailable("Invalid session");

  let darkDurationHours: string | null = null;
  if (dark) {
    const hrs =
      (dark.end.getTime() - dark.start.getTime()) / 3_600_000;
    darkDurationHours = hrs.toFixed(1);
  }

  const cloudCover =
    input.forecastLoading
      ? ok("Loading…")
      : wStatus === "out_of_range"
        ? unavailable("Out of range")
        : weather?.cloudCoverPct != null
          ? ok(`${weather.cloudCoverPct}%`)
          : unavailable();

  const windSpeed =
    input.forecastLoading
      ? ok("Loading…")
      : wStatus === "out_of_range"
        ? unavailable("Out of range")
        : weather?.windMph != null
          ? ok(`${weather.windMph} mph`)
          : unavailable();

  const seeing =
    input.forecastLoading
      ? ok("Loading…")
      : aStatus === "out_of_range"
        ? unavailable("Out of range")
        : astroWx?.seeingUi1to5 != null
          ? ok(`${astroWx.seeingUi1to5}/5`)
          : unavailable();

  const demoNotes: string[] = [];
  if (dark) {
    demoNotes.push(
      `Astronomical darkness overlapping your session: ${formatWindowLabel(dark.start, dark.end)}${
        darkDurationHours ? ` (${darkDurationHours} h)` : ""
      }. Recommendation windows are clipped to this interval.`,
    );
  } else {
    demoNotes.push(
      "No astronomical darkness overlaps this session, so deep-sky windows will be empty.",
    );
  }
  if (moon) {
    demoNotes.push(
      `${moon.phaseLabel} · ${moon.interferenceLabel} interference` +
        (moon.altitudeDeg != null
          ? ` · altitude ~${moon.altitudeDeg.toFixed(0)}° at mid-session dark`
          : "") +
        ".",
    );
  }
  if (weather?.cloudCoverPct != null) {
    demoNotes.push(
      weather.cloudCoverPct < 40
        ? `Cloud cover ~${weather.cloudCoverPct}% averaged over the session (Open-Meteo).`
        : `Cloud cover ~${weather.cloudCoverPct}% — may limit broadband imaging (Open-Meteo).`,
    );
  } else if (!input.forecastLoading) {
    demoNotes.push("Weather forecast unavailable for this session.");
  }

  return {
    astronomy,
    sessionStart,
    sessionEnd,
    moonPhase: moon
      ? ok(
          `${moon.phaseLabel} (${Math.round(moon.phaseFraction * 100)}%)`,
        )
      : unavailable(),
    moonPhasePercent: moon ? Math.round(moon.phaseFraction * 100) : null,
    illumination: moon?.phaseFraction ?? null,
    moonAltitude:
      moon?.altitudeDeg != null
        ? ok(`${moon.altitudeDeg.toFixed(0)}°`)
        : unavailable(),
    moonset: moon?.setAt
      ? ok(formatLocalHm(moon.setAt))
      : unavailable("—"),
    bortle:
      input.bortle != null ? ok(`Class ${input.bortle}`) : unavailable(),
    seeing,
    cloudCover,
    windSpeed,
    darkDuringSession,
    darkDurationHours,
    demoNotes,
  };
}
