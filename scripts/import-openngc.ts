/**
 * Controlled OpenNGC → Parallax deep-sky subset import (scaffold).
 *
 * Usage (future): download pinned OpenNGC CSV, then:
 *   npm run catalog:build
 *
 * Today the app SoT is src/lib/sky/curatedTargets.ts with OpenNGC-cited sizes.
 * This script documents the update workflow and validates the curated snapshot.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/import-openngc.ts
 */

import assert from "node:assert/strict";
import {
  CURATED_DEEP_SKY_TARGETS,
  curatedTargetById,
  isRecommendEligible,
  resolveCatalogId,
} from "../src/lib/sky/curatedTargets";

console.log("import-openngc (scaffold)\n");
console.log(
  "Pin OpenNGC release in data/catalog/VERSION + NOTICE before expanding CSV import.",
);
console.log(`Curated rows: ${CURATED_DEEP_SKY_TARGETS.length}`);
console.log(
  `Recommend-eligible: ${CURATED_DEEP_SKY_TARGETS.filter(isRecommendEligible).length}`,
);

assert.equal(resolveCatalogId("ngc1976"), "ngc1977");
assert.ok(curatedTargetById("m42")?.catalogIds?.includes("NGC 1976"));
assert.ok(curatedTargetById("ngc1977")?.catalogIds?.includes("NGC 1977"));

console.log("\nScaffold OK — expand CSV parser when growing beyond curated set.");
