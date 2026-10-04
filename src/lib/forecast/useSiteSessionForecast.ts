"use client";

import { useEffect, useState } from "react";
import type {
  AstroWxForecastBlock,
  ForecastProviderStatus,
  SiteSessionForecast,
  WeatherForecastBlock,
} from "@/lib/forecast/types";

export type ForecastHookState = {
  status: "idle" | "loading" | "ready" | "error";
  forecast: SiteSessionForecast | null;
  error: string | null;
};

function reviveForecast(raw: unknown): SiteSessionForecast {
  const o = raw as Record<string, unknown>;
  const session = o.session as { start: string; end: string };
  const weatherRaw = o.weather as Record<string, unknown> | null;
  const astroRaw = o.astroWx as Record<string, unknown> | null;
  const status = o.status as {
    weather: ForecastProviderStatus;
    astroWx: ForecastProviderStatus;
  };

  let weather: WeatherForecastBlock | null = null;
  if (weatherRaw) {
    const validFor = weatherRaw.validFor as { start: string; end: string };
    weather = {
      cloudCoverPct: weatherRaw.cloudCoverPct as number | null,
      humidityPct: weatherRaw.humidityPct as number | null,
      windMph: weatherRaw.windMph as number | null,
      coveragePct: weatherRaw.coveragePct as number,
      source: "open-meteo",
      fetchedAt: new Date(weatherRaw.fetchedAt as string),
      validFor: {
        start: new Date(validFor.start),
        end: new Date(validFor.end),
      },
      hourSamples: (
        (weatherRaw.hourSamples as Array<Record<string, unknown>>) ?? []
      ).map((s) => ({
        time: new Date(s.time as string),
        cloudCoverPct: s.cloudCoverPct as number | null,
        humidityPct: s.humidityPct as number | null,
        windMph: s.windMph as number | null,
      })),
    };
  }

  let astroWx: AstroWxForecastBlock | null = null;
  if (astroRaw) {
    astroWx = {
      seeingUi1to5: astroRaw.seeingUi1to5 as number | null,
      transparencyUi1to5: astroRaw.transparencyUi1to5 as number | null,
      coveragePct: astroRaw.coveragePct as number,
      source: "7timer-astro",
      fetchedAt: new Date(astroRaw.fetchedAt as string),
      samples: (
        (astroRaw.samples as Array<Record<string, unknown>>) ?? []
      ).map((s) => ({
        time: new Date(s.time as string),
        seeingRaw: s.seeingRaw as number | null,
        transparencyRaw: s.transparencyRaw as number | null,
        seeingUi1to5: s.seeingUi1to5 as number | null,
        transparencyUi1to5: s.transparencyUi1to5 as number | null,
      })),
    };
  }

  return {
    session: {
      start: new Date(session.start),
      end: new Date(session.end),
    },
    site: o.site as { latDeg: number; lonDeg: number },
    weather,
    astroWx,
    status,
    moonInterference: (o.moonInterference as string | null) ?? null,
    weatherError: o.weatherError as string | undefined,
    astroWxError: o.astroWxError as string | undefined,
    fetchedAt: new Date(o.fetchedAt as string),
  };
}

export function useSiteSessionForecast(input: {
  latDeg: number | null | undefined;
  lonDeg: number | null | undefined;
  sessionStart: Date | null | undefined;
  sessionEnd: Date | null | undefined;
  includeAstroWx?: boolean;
  moonInterference?: string | null;
  enabled?: boolean;
}): ForecastHookState {
  const enabled = input.enabled !== false;
  const [state, setState] = useState<ForecastHookState>({
    status: "idle",
    forecast: null,
    error: null,
  });

  const startIso = input.sessionStart?.toISOString() ?? "";
  const endIso = input.sessionEnd?.toISOString() ?? "";
  const lat = input.latDeg;
  const lon = input.lonDeg;
  const includeAstroWx = input.includeAstroWx !== false;
  const moon = input.moonInterference ?? "";

  useEffect(() => {
    if (
      !enabled ||
      lat == null ||
      lon == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !startIso ||
      !endIso
    ) {
      setState({ status: "idle", forecast: null, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({
      ...prev,
      status: "loading",
      error: null,
    }));

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      sessionStart: startIso,
      sessionEnd: endIso,
      includeAstroWx: includeAstroWx ? "1" : "0",
    });
    if (moon) params.set("moonInterference", moon);

    void fetch(`/api/forecast?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `Forecast HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled) return;
        setState({
          status: "ready",
          forecast: reviveForecast(json),
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          forecast: null,
          error: e instanceof Error ? e.message : "Forecast failed",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, lat, lon, startIso, endIso, includeAstroWx, moon]);

  return state;
}
