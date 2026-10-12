/**
 * Real session simulation builder — run: npm run test:session-simulation
 */

import assert from "node:assert/strict";
import { buildRealSessionSimulation } from "../src/lib/missions/sessionSimulation";
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
      scheduledStartAt: "2030-10-11T21:00:00.000Z",
      scheduledEndAt: "2030-10-12T01:00:00.000Z",
      proposedIntegrationMinutes: 90,
      proposedSubLengthSeconds: 120,
    },
  ],
  status: "ready",
  phase: "planning",
  transitionMinutes: 15,
  createdAt: "2026-10-11T12:00:00.000Z",
};

const now = new Date("2030-10-11T12:00:00.000Z");
const forecast: SiteSessionForecast = {
  session: {
    start: new Date(mission.dateTime),
    end: new Date(mission.sessionEndAt!),
  },
  site: { latDeg: 40, lonDeg: -105 },
  weather: {
    cloudCoverPct: 25,
    humidityPct: 40,
    windMph: 8,
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

const sim = buildRealSessionSimulation({
  mission,
  forecast,
  forecastStatus: "ready",
  hasSite: true,
  moonInterference: "Low",
});

assert.ok(sim.timeline.length >= 3);
assert.ok(sim.recommendedStop);
assert.ok(sim.weatherNote?.includes("25"));
assert.ok(sim.risks.some((r) => r.label === "Conditions"));
assert.ok(sim.risks.some((r) => r.label === "Plan fit" && r.level === "Low"));

const noFit = buildRealSessionSimulation({
  mission: {
    ...mission,
    targets: mission.targets.map((t) => ({
      ...t,
      proposedIntegrationMinutes: 500,
    })),
  },
  forecast,
  forecastStatus: "ready",
  hasSite: true,
});
assert.ok(noFit.risks.some((r) => r.label === "Plan fit" && r.level === "High"));

console.log("verify-session-simulation: ok");
