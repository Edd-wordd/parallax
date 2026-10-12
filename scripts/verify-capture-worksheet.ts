/**
 * Capture worksheet math — run: npm run test:capture-worksheet
 */

import {
  DEFAULT_SETUP_ALLOWANCE_MINUTES,
  derivedFrames,
  estimatedCaptureMinutes,
  fitWarning,
  missingExposureEvidence,
} from "../src/lib/capture/worksheetMath";
import { MissionEventKindSchema } from "../src/lib/schemas/missionEvent";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

{
  assert(derivedFrames(60, 120) === 30, "60 min / 120s → 30 frames");
  assert(derivedFrames(90, 180) === 30, "90 min / 180s → 30 frames");
  assert(derivedFrames(10, 180) === 4, "ceil frames");
  assert(derivedFrames(null, 120) === null, "null integration → null frames");
  assert(derivedFrames(60, 0) === null, "zero sub → null");
}

{
  const est = estimatedCaptureMinutes(
    [{ proposedIntegrationMinutes: 90 }, { proposedIntegrationMinutes: 60 }],
    15,
    DEFAULT_SETUP_ALLOWANCE_MINUTES,
  );
  // 90+60 + 15 transition + 10 setup = 175
  assert(est === 175, "estimated capture includes transitions + setup");
}

{
  assert(
    fitWarning(175, 180) === null,
    "fit ok when under budget",
  );
  const warn = fitWarning(200, 180);
  assert(typeof warn === "string" && /not shortened/i.test(warn ?? ""), "fit warn does not mutate");
  assert(fitWarning(null, 180) === null, "null estimate → no warn");
}

{
  const gaps = missingExposureEvidence({
    hasCameraName: true,
    hasFilter: false,
    hasIsoOrGain: false,
    hasSkyContext: true,
    hasTrackingHint: false,
  });
  assert(gaps.includes("filter choice"), "lists filter gap");
  assert(gaps.includes("camera gain/ISO mode"), "lists ISO/gain gap");
  assert(gaps.includes("tracking / guiding capability"), "lists tracking gap");
}

{
  const parsed = MissionEventKindSchema.safeParse("capture_plan_updated");
  assert(parsed.success, "capture_plan_updated is a valid event kind");
}

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nall capture-worksheet checks passed");
