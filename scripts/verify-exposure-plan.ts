/**
 * Real exposure plan builder — run: npm run test:exposure-plan
 */

import assert from "node:assert/strict";
import { buildRealExposurePlan } from "../src/lib/capture/exposurePlan";
import type { Mission } from "../src/lib/types";
import type { SiteSessionForecast } from "../src/lib/forecast/types";

const mission: Mission = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test",
  dateTime: "2030-10-11T21:00:00.000Z",
  sessionEndAt: "2030-10-12T03:00:00.000Z",
  locationId: "loc",
  gearId: "gear",
  constraints: {
    minAltitude: 30,
    moonTolerance: 15,
    targetTypes: ["galaxy"],
    driveToDarker: false,
    driveRadius: 0,
  },
  targets: [
    {
      targetId: "M31",
      targetName: "Andromeda",
      targetType: "galaxy",
      plannedWindowStart: "21:00",
      plannedWindowEnd: "01:00",
      score: 80,
      proposedFilter: "L",
      proposedSubLengthSeconds: 120,
      proposedIso: 800,
      proposedIntegrationMinutes: 90,
    },
  ],
  status: "ready",
  phase: "planning",
  transitionMinutes: 15,
  createdAt: "2030-10-11T12:00:00.000Z",
};

const now = new Date("2030-10-11T12:00:00.000Z");
const forecast: SiteSessionForecast = {
  session: {
    start: new Date(mission.dateTime),
    end: new Date(mission.sessionEndAt!),
  },
  site: { latDeg: 40, lonDeg: -105 },
  weather: {
    cloudCoverPct: 20,
    humidityPct: 35,
    windMph: 6,
    coveragePct: 100,
    source: "open-meteo",
    fetchedAt: now,
    validFor: {
      start: new Date(mission.dateTime),
      end: new Date(mission.sessionEndAt!),
    },
    hourSamples: [],
  },
  astroWx: {
    seeingUi1to5: 4,
    transparencyUi1to5: 4,
    coveragePct: 100,
    source: "7timer-astro",
    fetchedAt: now,
    samples: [],
  },
  status: { weather: "ok", astroWx: "ok" },
  moonInterference: "Low",
  fetchedAt: now,
};

const empty = buildRealExposurePlan({
  mission,
  target: null,
  forecast,
  forecastStatus: "ready",
  hasSite: true,
});
assert.equal(empty.status, "empty");

const incomplete = buildRealExposurePlan({
  mission: { ...mission, targets: [{ ...mission.targets[0]!, proposedSubLengthSeconds: null, proposedIntegrationMinutes: null }] },
  target: { ...mission.targets[0]!, proposedSubLengthSeconds: null, proposedIntegrationMinutes: null },
  forecast,
  forecastStatus: "ready",
  hasSite: true,
  cameraName: "ASI2600",
});
assert.equal(incomplete.status, "incomplete");

const ready = buildRealExposurePlan({
  mission,
  target: mission.targets[0]!,
  forecast,
  forecastStatus: "ready",
  hasSite: true,
  cameraName: "ASI2600",
  hasGuiding: true,
  moonInterference: "Low",
});
assert.equal(ready.status, "ready");
assert.equal(ready.exposure, "120s");
assert.equal(ready.subs, 45);
assert.ok(ready.options.some((o) => o.label === "Worksheet" && o.recommended));
assert.ok(ready.missingEvidence.length === 0);

const cloudy = buildRealExposurePlan({
  mission,
  target: mission.targets[0]!,
  forecast: {
    ...forecast,
    weather: { ...forecast.weather!, cloudCoverPct: 70 },
  },
  forecastStatus: "ready",
  hasSite: true,
  cameraName: "ASI2600",
  hasGuiding: true,
  moonInterference: "High",
});
assert.ok(cloudy.options.some((o) => o.label === "Shorter" && o.recommended));

console.log("verify-exposure-plan: ok");
