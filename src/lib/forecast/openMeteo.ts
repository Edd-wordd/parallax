/**
 * Open-Meteo hourly weather for mission planning.
 * https://open-meteo.com/en/docs — CC BY 4.0 attribution required in UI.
 */

import { z } from "zod";
import {
  cacheGet,
  cacheKeyParts,
  cacheSet,
  roundCoord,
} from "@/lib/forecast/cache";
import type {
  ForecastProviderStatus,
  TimeInterval,
  WeatherForecastBlock,
  WeatherHourSample,
} from "@/lib/forecast/types";

const OpenMeteoHourlySchema = z.object({
  time: z.array(z.string()),
  cloud_cover: z.array(z.number().nullable()).optional(),
  relative_humidity_2m: z.array(z.number().nullable()).optional(),
  wind_speed_10m: z.array(z.number().nullable()).optional(),
});

export const OpenMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  hourly: OpenMeteoHourlySchema,
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT_MS = 12_000;
const MS_PER_HOUR = 3_600_000;

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function roundInt(n: number | null): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n);
}

/** Hours spanned by session (at least 1 if duration > 0). */
export function expectedSessionHours(session: TimeInterval): number {
  const ms = session.end.getTime() - session.start.getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / MS_PER_HOUR));
}

export function forecastDaysForSession(
  sessionStart: Date,
  sessionEnd: Date,
  now: Date = new Date(),
): number {
  const endMs = Math.max(sessionEnd.getTime(), sessionStart.getTime());
  const daysAhead = Math.ceil((endMs - now.getTime()) / 86_400_000) + 1;
  return Math.min(16, Math.max(1, daysAhead));
}

/**
 * Aggregate Open-Meteo hourly arrays over the session interval.
 * Pure — used by tests with fixtures (no network).
 */
/** Parse Open-Meteo hourly time; naive ISO strings are treated as UTC. */
export function parseOpenMeteoTime(iso: string): Date {
  if (/Z$/i.test(iso) || /[+-]\d{2}:\d{2}$/.test(iso)) {
    return new Date(iso);
  }
  // "2026-03-16T03:00" or "2026-03-16T03:00:00"
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
}

export function aggregateOpenMeteoWeather(
  raw: OpenMeteoResponse,
  session: TimeInterval,
  fetchedAt: Date = new Date(),
): {
  weather: WeatherForecastBlock | null;
  status: ForecastProviderStatus;
} {
  const times = raw.hourly.time;
  const clouds = raw.hourly.cloud_cover ?? [];
  const humidity = raw.hourly.relative_humidity_2m ?? [];
  const wind = raw.hourly.wind_speed_10m ?? [];

  const samples: WeatherHourSample[] = [];
  const cloudVals: number[] = [];
  const humVals: number[] = [];
  const windVals: number[] = [];
  let completeHours = 0;

  for (let i = 0; i < times.length; i++) {
    const t = parseOpenMeteoTime(times[i]!);
    if (Number.isNaN(t.getTime())) continue;
    if (t.getTime() < session.start.getTime() || t.getTime() > session.end.getTime()) {
      continue;
    }
    const c = clouds[i] ?? null;
    const h = humidity[i] ?? null;
    const w = wind[i] ?? null;
    samples.push({
      time: t,
      cloudCoverPct: c,
      humidityPct: h,
      windMph: w,
    });
    if (c != null) cloudVals.push(c);
    if (h != null) humVals.push(h);
    if (w != null) windVals.push(w);
    if (c != null && h != null && w != null) completeHours += 1;
  }

  if (samples.length === 0) {
    return { weather: null, status: "out_of_range" };
  }

  const expected = expectedSessionHours(session);
  const coveragePct = Math.round(
    Math.min(100, (completeHours / expected) * 100),
  );

  return {
    status: "ok",
    weather: {
      cloudCoverPct: roundInt(mean(cloudVals)),
      humidityPct: roundInt(mean(humVals)),
      windMph: roundInt(mean(windVals)),
      coveragePct,
      source: "open-meteo",
      fetchedAt,
      validFor: session,
      hourSamples: samples,
    },
  };
}

export type FetchOpenMeteoResult =
  | { ok: true; weather: WeatherForecastBlock; status: "ok" }
  | {
      ok: false;
      weather: null;
      status: Exclude<ForecastProviderStatus, "ok" | "loading">;
      error: string;
    };

export async function fetchOpenMeteoWeather(input: {
  latDeg: number;
  lonDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  fetchImpl?: typeof fetch;
}): Promise<FetchOpenMeteoResult> {
  const session = { start: input.sessionStart, end: input.sessionEnd };
  if (session.end.getTime() <= session.start.getTime()) {
    return {
      ok: false,
      weather: null,
      status: "error",
      error: "Invalid session interval",
    };
  }

  const cacheKey = cacheKeyParts([
    "om",
    roundCoord(input.latDeg),
    roundCoord(input.lonDeg),
    session.start.toISOString(),
    session.end.toISOString(),
  ]);
  const cached = cacheGet<FetchOpenMeteoResult>(cacheKey);
  if (cached) return cached;

  const days = forecastDaysForSession(session.start, session.end);
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(input.latDeg));
  url.searchParams.set("longitude", String(input.lonDeg));
  url.searchParams.set(
    "hourly",
    "cloud_cover,relative_humidity_2m,wind_speed_10m",
  );
  url.searchParams.set("wind_speed_unit", "mph");
  // UTC so hourly timestamps are unambiguous vs session Date instants
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("forecast_days", String(days));

  const fetchFn = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetchFn(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const result: FetchOpenMeteoResult = {
        ok: false,
        weather: null,
        status: "error",
        error: `Open-Meteo HTTP ${res.status}`,
      };
      return result;
    }
    const json: unknown = await res.json();
    const parsed = OpenMeteoResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        weather: null,
        status: "error",
        error: "Open-Meteo response failed validation",
      };
    }
    const aggregated = aggregateOpenMeteoWeather(
      parsed.data,
      session,
      new Date(),
    );
    if (!aggregated.weather) {
      const result: FetchOpenMeteoResult = {
        ok: false,
        weather: null,
        status: "out_of_range",
        error: "No Open-Meteo hours overlap this session",
      };
      cacheSet(cacheKey, result);
      return result;
    }
    const result: FetchOpenMeteoResult = {
      ok: true,
      weather: aggregated.weather,
      status: "ok",
    };
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    const message =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Open-Meteo request timed out"
          : e.message
        : "Open-Meteo request failed";
    return {
      ok: false,
      weather: null,
      status: "error",
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}
