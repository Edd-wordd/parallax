/**
 * Assemble SiteSessionForecast from weather + optional astroWx providers.
 * Astronomy Moon/darkness stay outside this module (passed in if needed).
 */

import { fetchOpenMeteoWeather } from "@/lib/forecast/openMeteo";
import {
  SevenTimerAstroProvider,
  type AstroForecastProvider,
} from "@/lib/forecast/sevenTimer";
import type {
  SiteSessionForecast,
  SiteSessionForecastInput,
} from "@/lib/forecast/types";

export async function assembleSiteSessionForecast(
  input: SiteSessionForecastInput,
  options?: {
    fetchImpl?: typeof fetch;
    astroProvider?: AstroForecastProvider;
  },
): Promise<SiteSessionForecast> {
  const session = {
    start: input.sessionStart,
    end: input.sessionEnd,
  };
  const fetchedAt = new Date();
  const includeAstroWx = input.includeAstroWx !== false;
  const astroProvider = options?.astroProvider ?? SevenTimerAstroProvider;

  const weatherPromise = fetchOpenMeteoWeather({
    latDeg: input.latDeg,
    lonDeg: input.lonDeg,
    sessionStart: input.sessionStart,
    sessionEnd: input.sessionEnd,
    fetchImpl: options?.fetchImpl,
  });

  const astroPromise = includeAstroWx
    ? astroProvider.fetchAstroWx({
        latDeg: input.latDeg,
        lonDeg: input.lonDeg,
        sessionStart: input.sessionStart,
        sessionEnd: input.sessionEnd,
        fetchImpl: options?.fetchImpl,
      })
    : Promise.resolve({
        ok: false as const,
        astroWx: null,
        status: "unavailable" as const,
        error: "Astro weather not requested",
      });

  const [weatherRes, astroRes] = await Promise.all([
    weatherPromise,
    astroPromise,
  ]);

  return {
    session,
    site: { latDeg: input.latDeg, lonDeg: input.lonDeg },
    weather: weatherRes.ok ? weatherRes.weather : null,
    astroWx: astroRes.ok ? astroRes.astroWx : null,
    status: {
      weather: weatherRes.status,
      astroWx: includeAstroWx ? astroRes.status : "unavailable",
    },
    moonInterference: input.moonInterference ?? null,
    weatherError: weatherRes.ok ? undefined : weatherRes.error,
    astroWxError: astroRes.ok ? undefined : astroRes.error,
    fetchedAt,
  };
}

/** JSON-safe serialization for API responses. */
export function serializeSiteSessionForecast(
  forecast: SiteSessionForecast,
): unknown {
  return {
    session: {
      start: forecast.session.start.toISOString(),
      end: forecast.session.end.toISOString(),
    },
    site: forecast.site,
    weather: forecast.weather
      ? {
          ...forecast.weather,
          fetchedAt: forecast.weather.fetchedAt.toISOString(),
          validFor: {
            start: forecast.weather.validFor.start.toISOString(),
            end: forecast.weather.validFor.end.toISOString(),
          },
          hourSamples: forecast.weather.hourSamples.map((s) => ({
            ...s,
            time: s.time.toISOString(),
          })),
        }
      : null,
    astroWx: forecast.astroWx
      ? {
          ...forecast.astroWx,
          fetchedAt: forecast.astroWx.fetchedAt.toISOString(),
          samples: forecast.astroWx.samples.map((s) => ({
            ...s,
            time: s.time.toISOString(),
          })),
        }
      : null,
    status: forecast.status,
    moonInterference: forecast.moonInterference,
    weatherError: forecast.weatherError,
    astroWxError: forecast.astroWxError,
    fetchedAt: forecast.fetchedAt.toISOString(),
  };
}
