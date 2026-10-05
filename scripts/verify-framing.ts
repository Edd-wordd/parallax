/**
 * Rig FOV geometry + fit classification + catalog identity.
 * Run: npm run test:framing
 */

import assert from "node:assert/strict";
import {
  classifyRigFit,
  computeRigFraming,
  effectiveFocalLengthMm,
  fovArcmin,
  MOSAIC_FACTOR,
  SMALL_IN_FRAME_FRACTION,
} from "../src/lib/gear/framing";
import {
  CATALOG_ID_ALIASES,
  curatedTargetById,
  CURATED_DEEP_SKY_TARGETS,
  resolveCatalogId,
} from "../src/lib/sky/curatedTargets";

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

console.log("verify-framing\n");

check("ASI533 @ 420mm FOV ~92 arcmin", () => {
  // 2*atan(11.31/(2*420))*180/pi * 60 ≈ 92.5′
  const fov = fovArcmin(11.31, 420);
  assert.ok(fov > 90 && fov < 95, `got ${fov}`);
});

check("ASI533 @ 1000mm FOV ~38.8 arcmin", () => {
  const fov = fovArcmin(11.31, 1000);
  assert.ok(fov > 37 && fov < 41, `got ${fov}`);
});

check("optics factor changes effective FL", () => {
  assert.equal(effectiveFocalLengthMm(420, null), 420);
  assert.equal(effectiveFocalLengthMm(420, 1), 420);
  assert.equal(effectiveFocalLengthMm(420, 0.8), 336);
  assert.equal(effectiveFocalLengthMm(420, 2), 840);
});

check("M57 small in frame on wide 420mm ASI533", () => {
  const r = computeRigFraming(
    {
      focalLengthMm: 420,
      sensorWidthMm: 11.31,
      sensorHeightMm: 11.31,
    },
    { sizeMajorArcmin: 1.4, sizeVerified: true },
  );
  assert.equal(r.state, "small_in_frame");
});

check("M31 mosaic needed on 420mm ASI533", () => {
  const r = computeRigFraming(
    {
      focalLengthMm: 420,
      sensorWidthMm: 11.31,
      sensorHeightMm: 11.31,
    },
    { sizeMajorArcmin: 178, sizeVerified: true },
  );
  assert.equal(r.state, "mosaic_needed");
});

check("target near FOV width fits", () => {
  const shorter = fovArcmin(11.31, 420);
  const r = computeRigFraming(
    {
      focalLengthMm: 420,
      sensorWidthMm: 11.31,
      sensorHeightMm: 11.31,
    },
    { sizeMajorArcmin: shorter * 0.5, sizeVerified: true },
  );
  assert.equal(r.state, "fits");
});

check("tight crop just over shorter FOV", () => {
  const shorter = fovArcmin(11.31, 420);
  assert.equal(classifyRigFit(shorter * 1.05, shorter), "tight_crop");
  assert.equal(
    classifyRigFit(shorter * (MOSAIC_FACTOR + 0.01), shorter),
    "mosaic_needed",
  );
  assert.equal(
    classifyRigFit(shorter * (SMALL_IN_FRAME_FRACTION - 0.01), shorter),
    "small_in_frame",
  );
});

check("missing sensor → unknown", () => {
  const r = computeRigFraming(
    { focalLengthMm: 420, sensorWidthMm: null, sensorHeightMm: null },
    { sizeMajorArcmin: 20, sizeVerified: true },
  );
  assert.equal(r.state, "unknown");
  assert.ok(r.missing.includes("sensor"));
});

check("unverified target size → unknown", () => {
  const r = computeRigFraming(
    {
      focalLengthMm: 420,
      sensorWidthMm: 11.31,
      sensorHeightMm: 11.31,
    },
    { sizeMajorArcmin: 20, sizeVerified: false },
  );
  assert.equal(r.state, "unknown");
  assert.ok(r.missing.includes("target_size"));
});

check("Running Man is NGC 1977 not M42/NGC 1976", () => {
  assert.equal(resolveCatalogId("ngc1976"), "ngc1977");
  assert.equal(CATALOG_ID_ALIASES.ngc1976, "ngc1977");
  const rm = curatedTargetById("ngc1977");
  const m42 = curatedTargetById("m42");
  assert.ok(rm);
  assert.ok(m42);
  assert.ok(rm!.catalogIds?.includes("NGC 1977"));
  assert.ok(m42!.catalogIds?.includes("NGC 1976"));
  assert.notEqual(rm!.id, m42!.id);
  assert.ok(Math.abs(rm!.decDeg - m42!.decDeg) > 0.3);
});

check("Rosette cluster vs nebulosity distinct", () => {
  const cluster = curatedTargetById("ngc2244");
  const neb = curatedTargetById("ngc2237");
  assert.ok(cluster && neb);
  assert.equal(cluster!.type, "open_cluster");
  assert.equal(neb!.type, "nebula");
  assert.ok((neb!.sizeMajorArcmin ?? 0) > (cluster!.sizeMajorArcmin ?? 0));
});

check("verified catalog rows have source and sizeKind", () => {
  for (const t of CURATED_DEEP_SKY_TARGETS) {
    if (t.sizeVerified) {
      assert.ok(t.sizeMajorArcmin != null && t.sizeMajorArcmin > 0, t.id);
      assert.ok(t.sizeKind, t.id);
      assert.ok(t.sizeSource, t.id);
    }
  }
});

console.log(`\n${passed} checks passed`);
