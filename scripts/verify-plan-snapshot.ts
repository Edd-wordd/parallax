/**
 * Plan snapshot builder — run: npm run test:plan-snapshot
 */

import assert from "node:assert/strict";
import { buildPlanSnapshot } from "../src/lib/missions/planSnapshot";
import type { Mission } from "../src/lib/types";

const mission: Mission = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test night",
  dateTime: "2026-10-11T21:00:00.000Z",
  sessionEndAt: "2026-10-12T03:00:00.000Z",
  locationId: "loc",
  gearId: "gear",
  constraints: {
    minAltitude: 30,
    moonTolerance: 15,
    targetTypes: ["galaxy", "nebula"],
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
      roleLabel: "SEQ 1",
      sequenceIndex: 1,
      proposedFilter: "L",
      proposedSubLengthSeconds: 120,
      proposedIso: 800,
      proposedIntegrationMinutes: 90,
    },
    {
      targetId: "M42",
      targetName: "Orion Nebula",
      targetType: "nebula",
      plannedWindowStart: "01:00",
      plannedWindowEnd: "03:00",
      score: 70,
      roleLabel: "SEQ 2",
      sequenceIndex: 2,
      isFallback: true,
    },
  ],
  status: "ready",
  phase: "planning",
  transitionMinutes: 15,
  currentTargetId: "M31",
  createdAt: "2026-10-11T12:00:00.000Z",
};

const snap = buildPlanSnapshot(mission, "Mission started");
assert.match(snap.summary, /Mission started/);
assert.match(snap.summary, /2 targets/);
assert.equal(snap.payload.targetCount, 2);
assert.equal(snap.payload.targets[0]?.proposedFilter, "L");
assert.equal(snap.payload.targets[0]?.proposedSubLengthSeconds, 120);
assert.equal(snap.payload.targets[1]?.isFallback, true);
assert.equal(snap.payload.transitionMinutes, 15);

const empty = buildPlanSnapshot(
  { ...mission, targets: [] },
  "Planning complete",
);
assert.match(empty.summary, /no targets/);

console.log("verify-plan-snapshot: ok");
