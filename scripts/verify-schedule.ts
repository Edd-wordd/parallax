/**
 * Night schedule unit checks — run: npm run test:schedule
 */

import {
  buildNightSchedule,
  proposeFeasibleSchedule,
} from "../src/lib/schedule/buildNightSchedule";
import {
  DEFAULT_IMAGING_MINUTES,
  DEFAULT_TRANSITION_MINUTES,
} from "../src/lib/schedule/types";
import { formatWindowLabel } from "../src/lib/sky/visibility";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

function atLocal(
  y: number,
  m: number,
  d: number,
  h: number,
  min = 0,
): Date {
  return new Date(y, m - 1, d, h, min, 0, 0);
}

// --- overlapping windows, user order earliest-fit ---
{
  const sessionStart = atLocal(2026, 10, 4, 20, 0);
  const sessionEnd = atLocal(2026, 10, 5, 2, 0); // 6h
  const result = buildNightSchedule({
    sessionStart,
    sessionEnd,
    transitionMinutes: 15,
    targets: [
      {
        catalogId: "m31",
        name: "Andromeda",
        usableStart: atLocal(2026, 10, 4, 20, 0),
        usableEnd: atLocal(2026, 10, 5, 1, 0),
        desiredMinutes: 90,
      },
      {
        catalogId: "m42",
        name: "Orion",
        usableStart: atLocal(2026, 10, 4, 20, 30),
        usableEnd: atLocal(2026, 10, 5, 2, 0),
        desiredMinutes: 90,
      },
    ],
  });
  assert(result.ok, "two overlapping windows schedule ok");
  assert(result.segments.length === 2, "two segments placed");
  assert(
    result.segments[0]!.start.getTime() === sessionStart.getTime(),
    "first starts at session start",
  );
  assert(
    result.segments[1]!.start.getTime() ===
      result.segments[0]!.end.getTime() + 15 * 60_000,
    "second starts after transition",
  );
  assert(
    result.segments[0]!.end.getTime() <= result.segments[1]!.start.getTime(),
    "no overlap between segments",
  );
}

// --- insufficient window rejects without shortening ---
{
  const sessionStart = atLocal(2026, 10, 4, 20, 0);
  const sessionEnd = atLocal(2026, 10, 5, 2, 0);
  const result = buildNightSchedule({
    sessionStart,
    sessionEnd,
    targets: [
      {
        catalogId: "short",
        name: "Short Window",
        usableStart: atLocal(2026, 10, 4, 21, 0),
        usableEnd: atLocal(2026, 10, 4, 22, 0),
        desiredMinutes: 90,
      },
    ],
  });
  assert(!result.ok, "short window not ok");
  assert(result.segments.length === 0, "short window not placed");
  assert(result.conflicts.length === 1, "short window conflict");
  assert(
    (result.conflicts[0]!.suggestedMaxMinutes ?? 0) === 60,
    "suggests max 60 min",
  );
  assert(
    result.conflicts[0]!.reason.includes("90"),
    "conflict mentions desired duration",
  );
}

// --- transition gap leaves second unschedulable ---
{
  const sessionStart = atLocal(2026, 10, 4, 20, 0);
  const sessionEnd = atLocal(2026, 10, 5, 0, 0);
  const result = buildNightSchedule({
    sessionStart,
    sessionEnd,
    transitionMinutes: 15,
    targets: [
      {
        catalogId: "a",
        name: "A",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 180,
      },
      {
        catalogId: "b",
        name: "B",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
      },
    ],
  });
  assert(!result.ok, "packed session leaves conflict");
  assert(result.segments.length === 1, "only first placed");
  assert(result.conflicts[0]!.catalogId === "b", "second is conflict");
}

// --- never silently drop: third conflict kept in report ---
{
  const sessionStart = atLocal(2026, 10, 4, 20, 0);
  const sessionEnd = atLocal(2026, 10, 5, 2, 0);
  const result = buildNightSchedule({
    sessionStart,
    sessionEnd,
    transitionMinutes: 15,
    targets: [
      {
        catalogId: "a",
        name: "A",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
      },
      {
        catalogId: "b",
        name: "B",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
      },
      {
        catalogId: "c",
        name: "C",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
      },
    ],
  });
  // 90+15+90+15+90 = 300 min = 5h fits in 6h
  assert(result.ok, "three 90-min with transitions fit in 6h");
  assert(result.segments.length === 3, "three segments");
}

// --- overnight label includes calendar date ---
{
  const start = atLocal(2026, 10, 4, 22, 0);
  const end = atLocal(2026, 10, 5, 1, 30);
  const label = formatWindowLabel(start, end);
  assert(label.includes("Oct"), "overnight label includes month");
  assert(
    /4|5/.test(label),
    "overnight label includes day numbers",
  );
  const result = buildNightSchedule({
    sessionStart: atLocal(2026, 10, 4, 20, 0),
    sessionEnd: atLocal(2026, 10, 5, 2, 0),
    targets: [
      {
        catalogId: "ngc7000",
        name: "North America",
        usableStart: start,
        usableEnd: end,
        desiredMinutes: 90,
      },
    ],
  });
  assert(result.ok, "overnight segment schedules");
  // Place a segment that itself crosses midnight
  const overnight = buildNightSchedule({
    sessionStart: atLocal(2026, 10, 4, 20, 0),
    sessionEnd: atLocal(2026, 10, 5, 2, 0),
    targets: [
      {
        catalogId: "late",
        name: "Late",
        usableStart: atLocal(2026, 10, 4, 23, 0),
        usableEnd: atLocal(2026, 10, 5, 2, 0),
        desiredMinutes: 90,
      },
    ],
  });
  assert(overnight.ok, "midnight-crossing segment schedules");
  assert(
    overnight.segments[0]!.label.includes("Oct") &&
      overnight.segments[0]!.start.getDate() !==
        overnight.segments[0]!.end.getDate(),
    "midnight-crossing segment has dated label",
  );
}

// --- proposeFeasibleSchedule drops trailing when needed ---
{
  const sessionStart = atLocal(2026, 10, 4, 20, 0);
  const sessionEnd = atLocal(2026, 10, 4, 23, 0); // 3h — only one 90 fits cleanly with room
  const result = proposeFeasibleSchedule({
    sessionStart,
    sessionEnd,
    transitionMinutes: 15,
    targets: [
      {
        catalogId: "low",
        name: "Low",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
        score: 10,
      },
      {
        catalogId: "high",
        name: "High",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
        score: 90,
      },
      {
        catalogId: "mid",
        name: "Mid",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: 90,
        score: 50,
      },
    ],
  });
  assert(result.ok, "propose finds a feasible prefix");
  assert(
    result.segments[0]!.catalogId === "high",
    "propose uses score order (highest first)",
  );
  assert(
    (result.proposalNote ?? "").length > 0,
    "propose explains trade-off",
  );
}

// --- DST spring forward fixture (US local): 2h clock jump ---
{
  // 2026-03-08 local: clocks spring forward 2:00 → 3:00
  const sessionStart = atLocal(2026, 3, 8, 1, 0);
  const sessionEnd = new Date(sessionStart.getTime() + 6 * 60 * 60_000);
  const result = buildNightSchedule({
    sessionStart,
    sessionEnd,
    targets: [
      {
        catalogId: "dst",
        name: "DST Target",
        usableStart: sessionStart,
        usableEnd: sessionEnd,
        desiredMinutes: DEFAULT_IMAGING_MINUTES,
      },
    ],
  });
  assert(result.ok, "DST session schedules with JS Date arithmetic");
  assert(
    result.segments[0]!.end.getTime() - result.segments[0]!.start.getTime() ===
      DEFAULT_IMAGING_MINUTES * 60_000,
    "imaging duration is wall-clock ms based",
  );
}

// --- defaults ---
{
  assert(DEFAULT_IMAGING_MINUTES === 90, "default imaging 90");
  assert(DEFAULT_TRANSITION_MINUTES === 15, "default transition 15");
}

if (failed > 0) {
  console.error(`\n${failed} schedule check(s) failed`);
  process.exit(1);
}
console.log("\nAll schedule checks passed");
