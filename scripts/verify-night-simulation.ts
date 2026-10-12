/**
 * Night simulation model — run: npm run test:night-simulation
 */

import assert from "node:assert/strict";
import {
  activeSegmentsAt,
  buildNightSimModel,
  pctAlongSession,
} from "../src/lib/missions/nightSimulation";
import type { MissionTarget } from "../src/lib/types";

const targets: MissionTarget[] = [
  {
    targetId: "M31",
    targetName: "Andromeda",
    targetType: "galaxy",
    plannedWindowStart: "21:00",
    plannedWindowEnd: "01:00",
    score: 90,
    scheduledStartAt: "2026-10-11T21:00:00.000Z",
    scheduledEndAt: "2026-10-12T01:00:00.000Z",
  },
  {
    targetId: "M42",
    targetName: "Orion",
    targetType: "nebula",
    plannedWindowStart: "01:00",
    plannedWindowEnd: "03:00",
    score: 70,
    scheduledStartAt: "2026-10-12T01:00:00.000Z",
    scheduledEndAt: "2026-10-12T03:00:00.000Z",
  },
];

const model = buildNightSimModel({
  dateTime: "2026-10-11T21:00:00.000Z",
  sessionEndAt: "2026-10-12T03:00:00.000Z",
  targets,
});

assert.equal(model.durationMinutes, 360);
assert.equal(model.segments.length, 2);
assert.equal(model.segments[0]?.source, "scheduled");
assert.equal(model.segments[1]?.source, "scheduled");

const atPeak = activeSegmentsAt(model, 60); // +1h into session
assert.ok(atPeak.some((s) => s.targetId === "M31"));

const left = pctAlongSession(model, model.segments[0]!.start);
assert.ok(left >= 0 && left <= 100);

// Planned-window only: build ISO-free target using local HM relative to a local session.
const localStart = new Date(2026, 9, 11, 21, 0, 0, 0); // Oct 11 21:00 local
const localEnd = new Date(2026, 9, 12, 3, 0, 0, 0);
const plannedOnly = buildNightSimModel({
  dateTime: localStart.toISOString(),
  sessionEndAt: localEnd.toISOString(),
  targets: [
    {
      targetId: "M45",
      targetName: "Pleiades",
      targetType: "galaxy",
      plannedWindowStart: "22:00",
      plannedWindowEnd: "02:00",
      score: 80,
    },
  ],
});
assert.equal(plannedOnly.segments.length, 1);
assert.equal(plannedOnly.segments[0]?.source, "planned_window");

console.log("verify-night-simulation: ok");
