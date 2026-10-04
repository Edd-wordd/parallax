/**
 * 7Timer ASTRO product — seeing & transparency.
 * https://www.7timer.info/doc.php
 *
 * Swappable via AstroForecastProvider. No mock numeric fallback on failure.
 */

import { z } from "zod";
import {
  cacheGet,
  cacheKeyParts,
  cacheSet,
  roundCoord,
} from "@/lib/forecast/cache";
import type {
  AstroWxForecastBlock,
  AstroWxSample,
  ForecastProviderStatus,
  TimeInterval,
} from "@/lib/forecast/types";
import { expectedSessionHours } from "@/lib/forecast/openMeteo";

const MISSING = -9999;

const SevenTimerPointSchema = z.object({
  timepoint: z.number(),
  seeing: z.number().optional(),
  transparency: z.number().optional(),
  cloudcover: z.number().optional(),
});

export const SevenTimerResponseSchema = z.object({
  product: z.string().optional(),
  init: z.string(),
  dataseries: z.array(SevenTimerPointSchema),
});

export type SevenTimerResponse = z.infer<typeof SevenTimerResponseSchema>;

const SEVEN_TIMER_URL = "https://www.7timer.info/bin/api.pl";
const FETCH_TIMEOUT_MS = 15_000;

export interface AstroForecastProvider {
  readonly id: string;
  fetchAstroWx(input: {
    latDeg: number;
    lonDeg: number;
    sessionStart: Date;
    sessionEnd: Date;
    fetchImpl?: typeof fetch;
  }): Promise<FetchAstroWxResult>;
}

/**
 * Map 7Timer 1–8 (1 = best) to UI 1–5 (5 = best).
 * ui = clamp(round(6 - raw * 5 / 7), 1, 5)
 */
export function mapSevenTimerScaleToUi(raw: number): number | null {
  if (!Number.isFinite(raw) || raw === MISSING || raw < 1 || raw > 8) {
    return null;
  }
  return Math.min(5, Math.max(1, Math.round(6 - (raw * 5) / 7)));
}

function parseInitUtc(init: string): Date | null {
  // "YYYYMMDDHH"
  if (!/^\d{10}$/.test(init)) return null;
  const y = Number(init.slice(0, 4));
  const mo = Number(init.slice(4, 6)) - 1;
  const d = Number(init.slice(6, 8));
  const h = Number(init.slice(8, 10));
  const date = new Date(Date.UTC(y, mo, d, h, 0, 0));
  return Number.isNaN(date.getTime()) ? null : date;
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Aggregate 7Timer ASTRO series over session. Pure for fixtures.
 */
export function aggregateSevenTimerAstro(
  raw: SevenTimerResponse,
  session: TimeInterval,
  fetchedAt: Date = new Date(),
): {
  astroWx: AstroWxForecastBlock | null;
  status: ForecastProviderStatus;
} {
  const init = parseInitUtc(raw.init);
  if (!init) {
    return { astroWx: null, status: "error" };
  }

  const samples: AstroWxSample[] = [];
  const seeingUi: number[] = [];
  const transUi: number[] = [];
  let complete = 0;

  for (const pt of raw.dataseries) {
    const t = new Date(init.getTime() + pt.timepoint * 3_600_000);
    if (t.getTime() < session.start.getTime() || t.getTime() > session.end.getTime()) {
      continue;
    }
    const seeingRaw =
      pt.seeing != null && pt.seeing !== MISSING ? pt.seeing : null;
    const transparencyRaw =
      pt.transparency != null && pt.transparency !== MISSING
        ? pt.transparency
        : null;
    const seeingUi1to5 =
      seeingRaw != null ? mapSevenTimerScaleToUi(seeingRaw) : null;
    const transparencyUi1to5 =
      transparencyRaw != null
        ? mapSevenTimerScaleToUi(transparencyRaw)
        : null;
    samples.push({
      time: t,
      seeingRaw,
      transparencyRaw,
      seeingUi1to5,
      transparencyUi1to5,
    });
    if (seeingUi1to5 != null) seeingUi.push(seeingUi1to5);
    if (transparencyUi1to5 != null) transUi.push(transparencyUi1to5);
    if (seeingUi1to5 != null && transparencyUi1to5 != null) complete += 1;
  }

  if (samples.length === 0 || (seeingUi.length === 0 && transUi.length === 0)) {
    return { astroWx: null, status: "out_of_range" };
  }

  const expected = expectedSessionHours(session);
  // 7Timer steps are ~3h; coverage vs expected hours is approximate
  const coveragePct = Math.round(
    Math.min(100, (complete / Math.max(1, expected / 3)) * 100),
  );

  const seeingMean = mean(seeingUi);
  const transMean = mean(transUi);

  return {
    status: "ok",
    astroWx: {
      seeingUi1to5:
        seeingMean != null ? Math.round(seeingMean) : null,
      transparencyUi1to5:
        transMean != null ? Math.round(transMean) : null,
      coveragePct,
      source: "7timer-astro",
      fetchedAt,
      samples,
    },
  };
}

export type FetchAstroWxResult =
  | { ok: true; astroWx: AstroWxForecastBlock; status: "ok" }
  | {
      ok: false;
      astroWx: null;
      status: Exclude<ForecastProviderStatus, "ok" | "loading">;
      error: string;
    };

export async function fetchSevenTimerAstro(input: {
  latDeg: number;
  lonDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  fetchImpl?: typeof fetch;
}): Promise<FetchAstroWxResult> {
  const session = { start: input.sessionStart, end: input.sessionEnd };
  if (session.end.getTime() <= session.start.getTime()) {
    return {
      ok: false,
      astroWx: null,
      status: "error",
      error: "Invalid session interval",
    };
  }

  const cacheKey = cacheKeyParts([
    "t7",
    roundCoord(input.latDeg),
    roundCoord(input.lonDeg),
    session.start.toISOString(),
    session.end.toISOString(),
  ]);
  const cached = cacheGet<FetchAstroWxResult>(cacheKey);
  if (cached) return cached;

  const url = new URL(SEVEN_TIMER_URL);
  url.searchParams.set("lon", String(input.lonDeg));
  url.searchParams.set("lat", String(input.latDeg));
  url.searchParams.set("product", "astro");
  url.searchParams.set("output", "json");

  const fetchFn = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetchFn(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        ok: false,
        astroWx: null,
        status: "error",
        error: `7Timer HTTP ${res.status}`,
      };
    }
    const text = await res.text();
    // 7Timer sometimes returns JSONP-ish whitespace; parse JSON
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        astroWx: null,
        status: "error",
        error: "7Timer response is not JSON",
      };
    }
    const parsed = SevenTimerResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        astroWx: null,
        status: "error",
        error: "7Timer response failed validation",
      };
    }
    const aggregated = aggregateSevenTimerAstro(
      parsed.data,
      session,
      new Date(),
    );
    if (!aggregated.astroWx) {
      const result: FetchAstroWxResult = {
        ok: false,
        astroWx: null,
        status: "out_of_range",
        error: "No 7Timer samples overlap this session",
      };
      cacheSet(cacheKey, result);
      return result;
    }
    const result: FetchAstroWxResult = {
      ok: true,
      astroWx: aggregated.astroWx,
      status: "ok",
    };
    cacheSet(cacheKey, result);
    return result;
  } catch (e) {
    const message =
      e instanceof Error
        ? e.name === "AbortError"
          ? "7Timer request timed out"
          : e.message
        : "7Timer request failed";
    return {
      ok: false,
      astroWx: null,
      status: "error",
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export const SevenTimerAstroProvider: AstroForecastProvider = {
  id: "7timer-astro",
  fetchAstroWx: fetchSevenTimerAstro,
};
