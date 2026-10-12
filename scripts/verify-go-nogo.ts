/**
 * Verify Go/No-Go assessment from forecast inputs.
 * Run: npm run test:go-nogo
 */

import assert from "node:assert/strict";
import { assessGoNoGo } from "../src/lib/forecast/goNoGo";
import type { SiteSessionForecast } from "../src/lib/forecast/types";

function baseForecast(
  overrides: Partial<SiteSessionForecast> & {
    cloudCoverPct?: number | null;
    windMph?: number | null;
    seeingUi1to5?: number | null;
    weatherStatus?: SiteSessionForecast["status"]["weather"];
    astroStatus?: SiteSessionForecast["status"]["astroWx"];
  } = {},
): SiteSessionForecast {
  const now = new Date();
  const end = new Date(now.getTime() + 6 * 3600_000);
  const {
    cloudCoverPct = 20,
    windMph = 8,
    seeingUi1to5 = 4,
    weatherStatus = "ok",
    astroStatus = "ok",
    ...rest
  } = overrides;

  return {
    session: { start: now, end },
    site: { latDeg: 40, lonDeg: -105 },
    weather:
      weatherStatus === "ok"
        ? {
            cloudCoverPct: cloudCoverPct ?? null,
            humidityPct: 40,
            windMph: windMph ?? null,
            coveragePct: 100,
            source: "open-meteo",
            fetchedAt: now,
            validFor: { start: now, end },
            hourSamples: [],
          }
        : null,
    astroWx:
      astroStatus === "ok"
        ? {
            seeingUi1to5: seeingUi1to5 ?? null,
            transparencyUi1to5: 4,
            coveragePct: 100,
            source: "7timer-astro",
            fetchedAt: now,
            samples: [],
          }
        : null,
    status: { weather: weatherStatus, astroWx: astroStatus },
    moonInterference: "Low",
    fetchedAt: now,
    ...rest,
  };
}

assert.equal(
  assessGoNoGo({
    forecast: null,
    hasSite: false,
    sessionEnded: false,
  }).verdict,
  "unavailable",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast(),
    hasSite: true,
    sessionEnded: true,
  }).verdict,
  "unavailable",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ weatherStatus: "out_of_range" }),
    hasSite: true,
    sessionEnded: false,
  }).verdict,
  "unavailable",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ cloudCoverPct: 15, windMph: 5, seeingUi1to5: 4 }),
    hasSite: true,
    sessionEnded: false,
    moonInterference: "Low",
  }).verdict,
  "go",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ cloudCoverPct: 55 }),
    hasSite: true,
    sessionEnded: false,
  }).verdict,
  "marginal",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ cloudCoverPct: 85 }),
    hasSite: true,
    sessionEnded: false,
  }).verdict,
  "no_go",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ cloudCoverPct: 20, windMph: 35 }),
    hasSite: true,
    sessionEnded: false,
  }).verdict,
  "no_go",
);

assert.equal(
  assessGoNoGo({
    forecast: baseForecast({ cloudCoverPct: 25 }),
    hasSite: true,
    sessionEnded: false,
    moonInterference: "High",
  }).verdict,
  "marginal",
);

console.log("verify-go-nogo: ok");
