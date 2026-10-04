/**
 * Forecast aggregation fixtures (no live network).
 * Run: npm run test:forecast
 */

import assert from "node:assert/strict";
import { cacheClearForTests } from "../src/lib/forecast/cache";
import {
  aggregateOpenMeteoWeather,
  expectedSessionHours,
  forecastDaysForSession,
  type OpenMeteoResponse,
} from "../src/lib/forecast/openMeteo";
import {
  aggregateSevenTimerAstro,
  mapSevenTimerScaleToUi,
  type SevenTimerResponse,
} from "../src/lib/forecast/sevenTimer";

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

cacheClearForTests();
console.log("verify-forecast\n");

function makeHourly(
  startIso: string,
  hours: number,
  values: {
    cloud: (number | null)[];
    humidity: (number | null)[];
    wind: (number | null)[];
  },
): OpenMeteoResponse {
  const start = new Date(startIso).getTime();
  const time: string[] = [];
  for (let i = 0; i < hours; i++) {
    // Naive ISO without Z — parseOpenMeteoTime treats as UTC
    time.push(new Date(start + i * 3_600_000).toISOString().slice(0, 16));
  }
  return {
    latitude: 39.74,
    longitude: -104.99,
    hourly: {
      time,
      cloud_cover: values.cloud,
      relative_humidity_2m: values.humidity,
      wind_speed_10m: values.wind,
    },
  };
}

check("overnight session aggregates means", () => {
  // Session 21:00–03:00 local encoded as fixed UTC window for fixture
  const session = {
    start: new Date("2026-03-16T03:00:00.000Z"),
    end: new Date("2026-03-16T09:00:00.000Z"),
  };
  const raw = makeHourly("2026-03-16T03:00:00.000Z", 7, {
    cloud: [10, 20, 30, 40, 20, 10, 0],
    humidity: [50, 60, 70, 60, 50, 40, 50],
    wind: [5, 6, 7, 8, 7, 6, 5],
  });
  const { weather, status } = aggregateOpenMeteoWeather(raw, session);
  assert.equal(status, "ok");
  assert.ok(weather);
  assert.equal(weather!.cloudCoverPct, 19); // mean ~18.57 → 19
  assert.equal(weather!.humidityPct, 54);
  assert.equal(weather!.windMph, 6);
  assert.ok(weather!.coveragePct > 0);
});

check("out of range when no overlap", () => {
  const session = {
    start: new Date("2026-06-01T00:00:00.000Z"),
    end: new Date("2026-06-01T06:00:00.000Z"),
  };
  const raw = makeHourly("2026-03-16T03:00:00.000Z", 6, {
    cloud: [10, 10, 10, 10, 10, 10],
    humidity: [50, 50, 50, 50, 50, 50],
    wind: [5, 5, 5, 5, 5, 5],
  });
  const { weather, status } = aggregateOpenMeteoWeather(raw, session);
  assert.equal(status, "out_of_range");
  assert.equal(weather, null);
});

check("partial nulls do not invent values", () => {
  const session = {
    start: new Date("2026-03-16T03:00:00.000Z"),
    end: new Date("2026-03-16T06:00:00.000Z"),
  };
  const raw = makeHourly("2026-03-16T03:00:00.000Z", 4, {
    cloud: [10, null, 30, 40],
    humidity: [null, null, null, null],
    wind: [5, 6, null, 8],
  });
  const { weather, status } = aggregateOpenMeteoWeather(raw, session);
  assert.equal(status, "ok");
  assert.ok(weather);
  assert.equal(weather!.humidityPct, null);
  assert.ok(weather!.cloudCoverPct != null);
  assert.ok(weather!.coveragePct < 100);
});

check("expectedSessionHours and forecastDays", () => {
  const start = new Date("2026-03-16T03:00:00.000Z");
  const end = new Date("2026-03-16T09:00:00.000Z");
  assert.equal(expectedSessionHours({ start, end }), 6);
  const days = forecastDaysForSession(
    start,
    end,
    new Date("2026-03-15T00:00:00.000Z"),
  );
  assert.ok(days >= 1 && days <= 16);
});

check("7Timer scale mapping: best→5, worst→1", () => {
  assert.equal(mapSevenTimerScaleToUi(1), 5);
  assert.equal(mapSevenTimerScaleToUi(8), 1);
  assert.equal(mapSevenTimerScaleToUi(-9999), null);
  assert.equal(mapSevenTimerScaleToUi(0), null);
});

check("7Timer aggregation skips -9999 and out-of-session", () => {
  const session = {
    start: new Date("2026-03-16T03:00:00.000Z"),
    end: new Date("2026-03-16T12:00:00.000Z"),
  };
  // init = 2026-03-16 00:00 UTC → timepoint 3 = 03:00, 6 = 06:00, 9 = 09:00
  const raw: SevenTimerResponse = {
    product: "astro",
    init: "2026031600",
    dataseries: [
      { timepoint: 3, seeing: 2, transparency: 2 },
      { timepoint: 6, seeing: -9999, transparency: 3 },
      { timepoint: 9, seeing: 4, transparency: 4 },
      { timepoint: 48, seeing: 1, transparency: 1 }, // outside session
    ],
  };
  const { astroWx, status } = aggregateSevenTimerAstro(raw, session);
  assert.equal(status, "ok");
  assert.ok(astroWx);
  assert.ok(astroWx!.seeingUi1to5 != null);
  assert.ok(astroWx!.transparencyUi1to5 != null);
  assert.equal(astroWx!.samples.length, 3);
  assert.equal(astroWx!.samples[1]!.seeingUi1to5, null);
});

check("7Timer empty overlap → out_of_range", () => {
  const session = {
    start: new Date("2026-08-01T00:00:00.000Z"),
    end: new Date("2026-08-01T06:00:00.000Z"),
  };
  const raw: SevenTimerResponse = {
    init: "2026031600",
    dataseries: [{ timepoint: 3, seeing: 2, transparency: 2 }],
  };
  const { astroWx, status } = aggregateSevenTimerAstro(raw, session);
  assert.equal(status, "out_of_range");
  assert.equal(astroWx, null);
});

console.log(`\n${passed} checks passed`);
