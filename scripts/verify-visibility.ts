/**
 * Verification fixtures for session astronomy.
 * Run: npx tsx --tsconfig tsconfig.json scripts/verify-visibility.ts
 *
 * Compares a few values against known Astronomy Engine results (same library
 * as production). Spot-check dark window / altitudes with Stellarium or USNO
 * when changing the algorithm.
 */

import assert from "node:assert/strict";
import {
  Body,
  Horizon,
  Observer,
  SearchAltitude,
} from "astronomy-engine";
import { CURATED_DEEP_SKY_TARGETS } from "../src/lib/sky/curatedTargets";
import { generateDeepSkyPlan } from "../src/lib/sky/generateDeepSkyPlan";
import {
  computeDarkWindow,
  computeSessionAstronomy,
  findAstronomicalNight,
  formatLocalHm,
  scoreAltitude,
  scoreMoonSeparation,
} from "../src/lib/sky/visibility";

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

// Denver-ish site
const DENVER = { latDeg: 39.74, lonDeg: -104.99 };
const observer = new Observer(DENVER.latDeg, DENVER.lonDeg, 0);

console.log("verify-visibility\n");

check("overnight session has effective dark", () => {
  // Local evening → morning (interpreted as local Date construction)
  const sessionStart = new Date(2026, 2, 15, 21, 0, 0); // Mar 15 2026 21:00 local
  const sessionEnd = new Date(2026, 2, 16, 3, 0, 0);
  const result = computeSessionAstronomy({
    site: DENVER,
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 30,
    moonToleranceDeg: 15,
    targets: CURATED_DEEP_SKY_TARGETS.slice(0, 5),
  });
  assert.equal(result.valid, true);
  assert.ok(result.darkWindow, "expected darkWindow");
  assert.ok(result.effectiveDark, "expected effectiveDark");
  assert.ok(
    result.effectiveDark!.start.getTime() >= sessionStart.getTime() - 1000,
  );
  assert.ok(
    result.effectiveDark!.end.getTime() <= sessionEnd.getTime() + 1000,
  );
  assert.ok(result.moon);
  assert.ok(result.moon!.phaseLabel.length > 0);
});

check("daylight-only session → no effective dark", () => {
  const sessionStart = new Date(2026, 5, 21, 10, 0, 0);
  const sessionEnd = new Date(2026, 5, 21, 16, 0, 0);
  const result = computeSessionAstronomy({
    site: DENVER,
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 30,
    moonToleranceDeg: 15,
    targets: CURATED_DEEP_SKY_TARGETS.slice(0, 3),
  });
  assert.equal(result.effectiveDark, null);
  assert.equal(result.emptyReason, "no_astronomical_darkness");
  assert.equal(result.targets.every((t) => t.recommendedWindow == null), true);
});

check("target never above min altitude is unavailable", () => {
  // Extreme southern target from northern high min altitude
  const sessionStart = new Date(2026, 0, 15, 20, 0, 0);
  const sessionEnd = new Date(2026, 0, 16, 4, 0, 0);
  const farSouth = {
    id: "far_south",
    name: "Far South Test",
    type: "galaxy" as const,
    raHours: 12,
    decDeg: -75,
  };
  const result = computeSessionAstronomy({
    site: DENVER,
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 45,
    moonToleranceDeg: 0,
    targets: [farSouth],
  });
  if (result.effectiveDark) {
    assert.equal(result.targets[0]!.unavailableReason, "never_above_min_altitude");
    assert.equal(result.targets[0]!.recommendedWindow, null);
  }
});

check("moon tolerance hard-excludes close targets", () => {
  const sessionStart = new Date(2026, 2, 15, 21, 0, 0);
  const sessionEnd = new Date(2026, 2, 16, 4, 0, 0);
  // First compute with loose tolerance to find a visible target
  const loose = computeSessionAstronomy({
    site: DENVER,
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 20,
    moonToleranceDeg: 0,
    targets: CURATED_DEEP_SKY_TARGETS,
  });
  const viable = loose.targets.find(
    (t) => t.recommendedWindow && t.minMoonSeparationDeg != null,
  );
  assert.ok(viable, "need at least one viable target for moon test");
  const sep = viable!.minMoonSeparationDeg!;
  const strict = computeSessionAstronomy({
    site: DENVER,
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 20,
    moonToleranceDeg: sep + 30,
    targets: CURATED_DEEP_SKY_TARGETS.filter((t) => t.id === viable!.targetId),
  });
  assert.equal(strict.targets[0]!.unavailableReason, "moon_too_close");
  assert.equal(strict.targets[0]!.recommendedWindow, null);
});

check("site change moves dark window", () => {
  const sessionStart = new Date(Date.UTC(2026, 2, 16, 3, 0, 0)); // fixed UTC
  const sessionEnd = new Date(Date.UTC(2026, 2, 16, 10, 0, 0));
  const denverNight = computeDarkWindow(
    new Observer(39.74, -104.99, 0),
    sessionStart,
    sessionEnd,
  );
  const londonNight = computeDarkWindow(
    new Observer(51.5, -0.12, 0),
    sessionStart,
    sessionEnd,
  );
  assert.ok(denverNight && londonNight);
  // Longitudinal separation → dusk times differ by tens of minutes+
  const deltaMin =
    Math.abs(denverNight!.start.getTime() - londonNight!.start.getTime()) /
    60_000;
  assert.ok(deltaMin > 30, `expected dusk shift, got ${deltaMin} min`);
});

check("date change moves dark window", () => {
  const jun = findAstronomicalNight(observer, new Date(2026, 5, 21, 12));
  const dec = findAstronomicalNight(observer, new Date(2026, 11, 21, 12));
  assert.ok(jun && dec);
  const junLen = jun!.end.getTime() - jun!.start.getTime();
  const decLen = dec!.end.getTime() - dec!.start.getTime();
  // Northern hemisphere: winter nights longer
  assert.ok(decLen > junLen, "Dec night should be longer than Jun in Denver");
});

check("planned windows clipped to session", () => {
  const sessionStart = new Date(2026, 2, 15, 22, 0, 0);
  const sessionEnd = new Date(2026, 2, 16, 2, 0, 0);
  const { targets, astronomy } = generateDeepSkyPlan({
    latDeg: DENVER.latDeg,
    lonDeg: DENVER.lonDeg,
    sessionStart,
    sessionEnd,
    constraints: {
      minAltitude: 25,
      moonTolerance: 10,
      targetTypes: ["galaxy", "nebula", "open_cluster", "globular_cluster"],
      driveToDarker: false,
      driveRadius: 0,
    },
  });
  assert.ok(astronomy.effectiveDark);
  for (const t of astronomy.targets) {
    if (!t.recommendedWindow) continue;
    assert.ok(
      t.recommendedWindow.start.getTime() >=
        astronomy.effectiveDark!.start.getTime() - 1000,
    );
    assert.ok(
      t.recommendedWindow.end.getTime() <=
        astronomy.effectiveDark!.end.getTime() + 1000,
    );
    assert.ok(t.recommendedWindow.start.getTime() >= sessionStart.getTime() - 1000);
    assert.ok(t.recommendedWindow.end.getTime() <= sessionEnd.getTime() + 1000);
  }
  // Mission targets use HH:MM strings
  for (const t of targets) {
    assert.match(t.plannedWindowStart, /^\d{2}:\d{2}$/);
    assert.match(t.plannedWindowEnd, /^\d{2}:\d{2}$/);
    assert.ok(t.altitudeScore != null);
    assert.ok(t.moonSeparationScore != null);
    assert.equal(t.rigFramingScore, undefined);
  }
});

check("invalid session rejected", () => {
  const a = new Date(2026, 2, 15, 21, 0, 0);
  const result = computeSessionAstronomy({
    site: DENVER,
    sessionStart: a,
    sessionEnd: a,
    minAltitudeDeg: 30,
    moonToleranceDeg: 15,
    targets: [],
  });
  assert.equal(result.valid, false);
  assert.equal(result.emptyReason, "invalid_session");
});

check("scoring helpers stay in range", () => {
  assert.ok(scoreAltitude(60, 30, 120, 240) >= 1);
  assert.ok(scoreAltitude(60, 30, 120, 240) <= 10);
  assert.ok(scoreMoonSeparation(90, 15, 0.2) >= 1);
  assert.ok(scoreMoonSeparation(20, 15, 0.9) <= 10);
});

check("reference: SearchAltitude dusk matches computeDarkWindow start", () => {
  const around = new Date(Date.UTC(2026, 2, 16, 0, 0, 0));
  const night = findAstronomicalNight(observer, around);
  assert.ok(night);
  const dusk = SearchAltitude(Body.Sun, observer, -1, new Date(around.getTime() - 86_400_000), 2.5, -18);
  assert.ok(dusk);
  assert.equal(night!.start.getTime(), dusk!.date.getTime());
});

check("reference: M42 altitude via Horizon is finite near winter evening", () => {
  // M42 RA 5.59h Dec -5.39 — winter northern evening often high
  const t = new Date(2026, 0, 15, 22, 0, 0);
  const hor = Horizon(t, observer, 5.59, -5.39, "normal");
  assert.ok(Number.isFinite(hor.altitude));
  console.log(
    `       (info) M42 alt at ${formatLocalHm(t)} local Denver: ${hor.altitude.toFixed(1)}°`,
  );
});

console.log(`\n${passed} checks passed`);
