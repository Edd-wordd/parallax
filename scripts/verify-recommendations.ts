/**
 * Dashboard recommendation mapper + peak-altitude sanity.
 * Run: npm run test:recommendations
 */

import assert from "node:assert/strict";
import {
  buildDashboardRecommendations,
  geometricMaxAltitudeDeg,
  isPeakAltitudeSane,
  recommendationToMissionTarget,
  sessionIntervalFromDateTime,
} from "../src/lib/recommendations/mapper";
import { buildEngineReasons } from "../src/lib/recommendations/engineReasons";
import {
  computeSessionAstronomy,
  formatWindowLabel,
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

const constraints = {
  minAltitude: 30,
  moonTolerance: 15,
  targetTypes: ["galaxy", "nebula", "open_cluster", "globular_cluster"],
  driveToDarker: false,
  driveRadius: 0,
};

console.log("verify-recommendations\n");

check("session interval is start + 6h", () => {
  const start = new Date("2026-03-16T03:00:00.000Z");
  const { end } = sessionIntervalFromDateTime(start);
  assert.equal(end.getTime() - start.getTime(), 6 * 3_600_000);
});

check("no site → no_site empty state", () => {
  const r = buildDashboardRecommendations({
    latDeg: null,
    lonDeg: null,
    dateTime: new Date(2026, 2, 15, 21, 0, 0).toISOString(),
    constraints,
  });
  assert.equal(r.status, "no_site");
  assert.equal(r.recommendations.length, 0);
  assert.ok(r.emptyMessage);
});

check("daylight session → no_darkness or empty", () => {
  const r = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(2026, 5, 21, 10, 0, 0).toISOString(),
    constraints,
  });
  assert.ok(r.status === "no_darkness" || r.status === "empty");
  assert.equal(r.recommendations.length, 0);
});

check("overnight Denver yields recommendations with sane peaks", () => {
  const r = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(2026, 2, 15, 21, 0, 0).toISOString(),
    constraints,
  });
  assert.equal(r.status, "ready");
  assert.ok(r.recommendations.length > 0);
  for (const rec of r.recommendations) {
    assert.ok(rec.windowEnd.getTime() > rec.windowStart.getTime());
    assert.ok(rec.windowStart.getTime() >= r.sessionStart.getTime() - 1000);
    assert.ok(rec.windowEnd.getTime() <= r.sessionEnd.getTime() + 1000);
    assert.ok(
      ["fits", "tight_crop", "small_in_frame", "mosaic_needed", "unknown"].includes(
        rec.rigFit,
      ),
      `${rec.id}: unexpected rigFit ${rec.rigFit}`,
    );
    assert.ok(
      rec.peakAltitudeDeg <= rec.maxPossibleAltitudeDeg + 1.5,
      `${rec.id}: peak ${rec.peakAltitudeDeg} > geometric max ${rec.maxPossibleAltitudeDeg}`,
    );
    // Cross-check helper with reconstructed dec from maxPossible
    const approxDec = 39.74 - (90 - rec.maxPossibleAltitudeDeg);
    assert.ok(
      isPeakAltitudeSane(rec.peakAltitudeDeg, 39.74, approxDec),
      `${rec.id}: failed isPeakAltitudeSane`,
    );
  }
});

check("geometric max altitude formula", () => {
  // lat 40, dec 40 → culmination ~90°
  assert.ok(Math.abs(geometricMaxAltitudeDeg(40, 40) - 90) < 0.01);
  // lat 40, dec -5 → max ~45°
  assert.ok(Math.abs(geometricMaxAltitudeDeg(40, -5) - 45) < 0.01);
});

check("mission target mapping has no framing score", () => {
  const r = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(2026, 2, 15, 21, 0, 0).toISOString(),
    constraints,
  });
  assert.ok(r.recommendations[0]);
  const mt = recommendationToMissionTarget(r.recommendations[0]!);
  assert.equal(mt.rigFramingScore, undefined);
  assert.ok(mt.plannedWindowStart);
  assert.ok(mt.altitudeScore != null);
});

check("overnight window labels include dates when crossing midnight", () => {
  const start = new Date(2026, 2, 15, 22, 30, 0);
  const end = new Date(2026, 2, 16, 5, 18, 0);
  const label = formatWindowLabel(start, end);
  assert.match(label, /Mar/);
  assert.ok(label.includes("22:30"));
  assert.ok(label.includes("05:18"));
});

check("recommendation windows stay inside effectiveDark ∩ session", () => {
  const sessionStart = new Date(2026, 2, 15, 21, 0, 0);
  const { end: sessionEnd } = sessionIntervalFromDateTime(sessionStart);
  const astro = computeSessionAstronomy({
    site: { latDeg: 39.74, lonDeg: -104.99 },
    sessionStart,
    sessionEnd,
    minAltitudeDeg: 30,
    moonToleranceDeg: 15,
    targets: [],
  });
  assert.ok(astro.effectiveDark);
  const dark = astro.effectiveDark!;
  const r = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: sessionStart.toISOString(),
    constraints,
  });
  assert.equal(r.status, "ready");
  for (const rec of r.recommendations) {
    assert.ok(
      rec.windowStart.getTime() >= dark.start.getTime() - 1000,
      `${rec.id}: window starts before effectiveDark`,
    );
    assert.ok(
      rec.windowEnd.getTime() <= dark.end.getTime() + 1000,
      `${rec.id}: window ends after effectiveDark (${rec.windowLabel} vs dark ${formatWindowLabel(dark.start, dark.end)})`,
    );
  }
});

check("engine reasons are calculated templates, not AI claims", () => {
  const r = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(2026, 2, 15, 21, 0, 0).toISOString(),
    constraints,
  });
  assert.ok(r.recommendations[0]);
  const reasons = buildEngineReasons(r.recommendations[0]!);
  assert.ok(reasons.length >= 3);
  for (const line of reasons) {
    assert.ok(!/AI[- ]generated/i.test(line));
  }
  assert.ok(reasons.some((l) => /Usable imaging window/i.test(l)));
});

check("gear changes framing not ranking order or scores", () => {
  const dateTime = new Date(2026, 2, 15, 21, 0, 0).toISOString();
  const noGear = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime,
    constraints,
  });
  const withGear = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime,
    constraints,
    gear: {
      focalLengthMm: 420,
      sensorWidthMm: 11.31,
      sensorHeightMm: 11.31,
    },
  });
  assert.equal(noGear.status, "ready");
  assert.equal(withGear.status, "ready");
  assert.deepEqual(
    noGear.recommendations.map((r) => r.id),
    withGear.recommendations.map((r) => r.id),
  );
  assert.deepEqual(
    noGear.recommendations.map((r) => r.score),
    withGear.recommendations.map((r) => r.score),
  );
  assert.ok(noGear.recommendations.every((r) => r.rigFit === "unknown"));
  assert.ok(withGear.recommendations.some((r) => r.rigFit !== "unknown"));
  assert.deepEqual(
    noGear.recommendations.map((r) => r.windowLabel),
    withGear.recommendations.map((r) => r.windowLabel),
  );
});

check("site change changes recommendation set or windows", () => {
  const denver = buildDashboardRecommendations({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(Date.UTC(2026, 2, 16, 3, 0, 0)).toISOString(),
    constraints,
  });
  const london = buildDashboardRecommendations({
    latDeg: 51.5,
    lonDeg: -0.12,
    dateTime: new Date(Date.UTC(2026, 2, 16, 3, 0, 0)).toISOString(),
    constraints,
  });
  // At least one of: different top id, or different window start for shared id
  if (denver.status === "ready" && london.status === "ready") {
    const d0 = denver.recommendations[0];
    const lMatch = london.recommendations.find((t) => t.id === d0?.id);
    if (d0 && lMatch) {
      assert.ok(
        d0.windowStart.getTime() !== lMatch.windowStart.getTime() ||
          d0.score !== lMatch.score ||
          d0.peakAltitudeDeg !== lMatch.peakAltitudeDeg,
      );
    } else {
      assert.notEqual(
        denver.recommendations[0]?.id,
        london.recommendations[0]?.id,
      );
    }
  }
});

console.log(`\n${passed} checks passed`);
