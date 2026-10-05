/**
 * Canonical catalog identity + Explorer visibility sanity.
 * Run: npm run test:catalog
 */

import assert from "node:assert/strict";
import {
  CATALOG_VERSION,
  curatedTargetById,
  isBrightAndLarge,
  isRecommendEligible,
  listDeepSkyCatalog,
  resolveCatalogId,
} from "../src/lib/catalog";
import { getCatalogDisplayImage } from "../src/lib/catalog/images";
import { buildExplorerVisibility } from "../src/lib/catalog/explorerVisibility";
import { CURATED_DEEP_SKY_TARGETS } from "../src/lib/sky/curatedTargets";

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

console.log("verify-catalog\n");

check("catalog version string present", () => {
  assert.ok(CATALOG_VERSION.length > 0);
});

check("listDeepSky matches curated SoT", () => {
  assert.equal(listDeepSkyCatalog().length, CURATED_DEEP_SKY_TARGETS.length);
  assert.ok(listDeepSkyCatalog().every((t) => t.type !== ("planet" as never)));
});

check("Running Man ≠ M42", () => {
  assert.equal(resolveCatalogId("ngc1976"), "ngc1977");
  const rm = curatedTargetById("ngc1977");
  const m42 = curatedTargetById("m42");
  assert.ok(rm && m42);
  assert.notEqual(rm!.id, m42!.id);
  assert.ok(Math.abs(rm!.decDeg - m42!.decDeg) > 0.3);
});

check("M31 RA is near 0.7h not 10h", () => {
  const m31 = curatedTargetById("m31");
  assert.ok(m31);
  assert.ok(m31!.raHours < 2, `raHours=${m31!.raHours}`);
});

check("recommendEligible requires sizeVerified", () => {
  for (const t of CURATED_DEEP_SKY_TARGETS) {
    if (isRecommendEligible(t)) {
      assert.equal(t.sizeVerified, true, t.id);
    }
  }
});

check("bright & large criteria", () => {
  const m31 = curatedTargetById("m31");
  assert.ok(m31 && isBrightAndLarge(m31));
  const m57 = curatedTargetById("m57");
  assert.ok(m57 && !isBrightAndLarge(m57));
});

check("each catalog object has a DSS cutout display image", () => {
  for (const t of listDeepSkyCatalog()) {
    const img = getCatalogDisplayImage(t.id);
    assert.ok(img, t.id);
    assert.ok(img!.url.includes("hips2fits") || img!.url.startsWith("http"), t.id);
    assert.ok(img!.credit.length > 0, t.id);
  }
});

check("explorer visibility distinguishes statuses", () => {
  const { rows, visibleFilterLabel } = buildExplorerVisibility({
    latDeg: 39.74,
    lonDeg: -104.99,
    dateTime: new Date(2026, 2, 15, 21, 0, 0).toISOString(),
    constraints: {
      minAltitude: 30,
      moonTolerance: 15,
      targetTypes: ["galaxy", "nebula", "open_cluster", "globular_cluster"],
      driveToDarker: false,
      driveRadius: 0,
    },
  });
  assert.ok(rows.length > 0);
  assert.ok(
    visibleFilterLabel === "Visible tonight" ||
      visibleFilterLabel === "Visible this session",
  );
  const recommended = rows.filter((r) => r.status === "recommended");
  const visible = rows.filter((r) => r.status === "visible");
  const unsuitable = rows.filter((r) => r.status === "unsuitable");
  assert.ok(recommended.length > 0);
  // Outside top-N can still be visible
  assert.ok(
    visible.length + recommended.length + unsuitable.length === rows.length,
  );
  for (const r of visible) {
    assert.ok(r.windowLabel);
  }
});

console.log(`\n${passed} checks passed`);
