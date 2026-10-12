/**
 * Session window unit checks — run: npm run test:session-window
 */

import {
  DEFAULT_SESSION_HOURS,
  defaultUpcomingSession,
  formatObservingNightLabel,
  isSessionStartInPast,
  isValidSessionOrder,
  scheduleOutsideWindow,
  sessionWindowFromMission,
  useCurrentTimeWindow,
  wallTimeInZoneToUtc,
  zonedParts,
} from "../src/lib/time/sessionWindow";

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

// --- defaults: 3 PM → today 21:00 ---
{
  const now = atLocal(2026, 10, 5, 15, 0);
  const { start, end } = defaultUpcomingSession(now);
  assert(start.getHours() === 21, "3 PM default start hour 21");
  assert(start.getDate() === 5, "3 PM default start same calendar day");
  assert(
    end.getTime() - start.getTime() === DEFAULT_SESSION_HOURS * 3_600_000,
    "default duration 6h",
  );
}

// --- defaults: 11 PM → next evening 21:00 ---
{
  const now = atLocal(2026, 10, 5, 23, 0);
  const { start } = defaultUpcomingSession(now);
  assert(start.getHours() === 21, "11 PM default start hour 21");
  assert(start.getDate() === 6, "11 PM default start next calendar day");
}

// --- defaults: 6 AM → next evening 21:00 ---
{
  const now = atLocal(2026, 10, 5, 6, 0);
  const { start } = defaultUpcomingSession(now);
  assert(start.getDate() === 6, "6 AM default start next calendar day");
  assert(start.getHours() === 21, "6 AM default start hour 21");
}

// --- defaults: midnight → next evening ---
{
  const now = atLocal(2026, 10, 6, 0, 0);
  const { start } = defaultUpcomingSession(now);
  assert(start.getDate() === 7, "midnight default start next evening day");
  assert(start.getHours() === 21, "midnight default start hour 21");
}

// --- defaults: noon → today 21:00 ---
{
  const now = atLocal(2026, 10, 5, 12, 0);
  const { start } = defaultUpcomingSession(now);
  assert(start.getDate() === 5, "noon default start same day");
  assert(start.getHours() === 21, "noon default start hour 21");
}

// --- no silent +24h: invalid order ---
{
  const start = atLocal(2026, 10, 5, 21, 0);
  const end = atLocal(2026, 10, 5, 20, 0);
  assert(!isValidSessionOrder(start, end), "end before start invalid");
}

// --- mission window uses sessionEndAt ---
{
  const start = atLocal(2026, 10, 5, 21, 0);
  const end = atLocal(2026, 10, 6, 4, 0);
  const w = sessionWindowFromMission({
    dateTime: start.toISOString(),
    sessionEndAt: end.toISOString(),
  });
  assert(
    w.end.getTime() === end.getTime(),
    "sessionEndAt honored (not forced +6h)",
  );
}

// --- fallback +6h when end missing ---
{
  const start = atLocal(2026, 10, 5, 21, 0);
  const w = sessionWindowFromMission({ dateTime: start.toISOString() });
  assert(
    w.end.getTime() - w.start.getTime() === DEFAULT_SESSION_HOURS * 3_600_000,
    "missing end → +6h fallback",
  );
}

// --- past start detection ---
{
  const start = atLocal(2026, 10, 5, 21, 0);
  const now = atLocal(2026, 10, 5, 22, 0);
  assert(isSessionStartInPast(start, now), "start in past detected");
  assert(
    !isSessionStartInPast(start, atLocal(2026, 10, 5, 20, 0)),
    "future start not past",
  );
}

// --- observing night label overnight ---
{
  const start = atLocal(2026, 10, 5, 21, 0);
  const end = atLocal(2026, 10, 6, 3, 0);
  const now = atLocal(2026, 10, 5, 22, 0);
  const label = formatObservingNightLabel({ start, end, now });
  assert(/Tonight/i.test(label), "overnight same night labeled Tonight");
  assert(/–|-/i.test(label) || /Oct/i.test(label), "label includes dates");
}

// --- 01:00 start still Tonight for that observing night ---
{
  const start = atLocal(2026, 10, 6, 1, 0);
  const end = atLocal(2026, 10, 6, 5, 0);
  const now = atLocal(2026, 10, 6, 1, 30);
  const label = formatObservingNightLabel({ start, end, now });
  assert(/Tonight/i.test(label), "01:00 start is Tonight for observing night");
}

// --- use current time ---
{
  const prev = {
    start: atLocal(2026, 10, 5, 3, 0),
    end: atLocal(2026, 10, 5, 9, 0),
  };
  const now = atLocal(2026, 10, 5, 22, 0);
  const next = useCurrentTimeWindow(prev, now);
  assert(next.start.getTime() === now.getTime(), "use current → start=now");
  assert(
    next.end.getTime() - next.start.getTime() === 6 * 3_600_000,
    "use current keeps 6h duration",
  );
}

// --- schedule outside window ---
{
  const window = {
    start: atLocal(2026, 10, 5, 21, 0),
    end: atLocal(2026, 10, 6, 3, 0),
  };
  assert(
    scheduleOutsideWindow(
      [
        {
          scheduledStartAt: atLocal(2026, 10, 5, 22, 0).toISOString(),
          scheduledEndAt: atLocal(2026, 10, 6, 4, 0).toISOString(),
        },
      ],
      window,
    ),
    "segment past session end → outside",
  );
  assert(
    !scheduleOutsideWindow(
      [
        {
          scheduledStartAt: atLocal(2026, 10, 5, 22, 0).toISOString(),
          scheduledEndAt: atLocal(2026, 10, 6, 2, 0).toISOString(),
        },
      ],
      window,
    ),
    "segment inside window ok",
  );
}

// --- America/Denver wall time round-trip ---
{
  try {
    const utc = wallTimeInZoneToUtc(
      { year: 2026, month: 10, day: 5, hour: 21, minute: 0 },
      "America/Denver",
    );
    const parts = zonedParts(utc, "America/Denver");
    assert(parts.hour === 21, "Denver wall 21:00 round-trip hour");
    assert(parts.day === 5, "Denver wall 21:00 round-trip day");

    const nowDenver = wallTimeInZoneToUtc(
      { year: 2026, month: 10, day: 5, hour: 23, minute: 0 },
      "America/Denver",
    );
    const { start } = defaultUpcomingSession(nowDenver, "America/Denver");
    const sp = zonedParts(start, "America/Denver");
    assert(sp.hour === 21, "Denver 11 PM → next evening hour 21");
    assert(sp.day === 6, "Denver 11 PM → next calendar day");
  } catch (e) {
    console.error("FAIL: Denver TZ", e);
    failed += 1;
  }
}

// --- DST spring forward (US 2026-03-08): 2 AM skipped in America/Denver ---
{
  try {
    const before = wallTimeInZoneToUtc(
      { year: 2026, month: 3, day: 8, hour: 1, minute: 30 },
      "America/Denver",
    );
    const after = wallTimeInZoneToUtc(
      { year: 2026, month: 3, day: 8, hour: 3, minute: 0 },
      "America/Denver",
    );
    assert(
      after.getTime() > before.getTime(),
      "DST spring: 3:00 after 1:30 same local day",
    );
    const p1 = zonedParts(before, "America/Denver");
    const p3 = zonedParts(after, "America/Denver");
    assert(p1.hour === 1, "DST spring: 1:30 stays hour 1");
    assert(p3.hour === 3, "DST spring: 3:00 stays hour 3");
  } catch (e) {
    console.error("FAIL: DST spring", e);
    failed += 1;
  }
}

// --- DST fall back (US 2026-11-01): wall 1:30 still resolvable ---
{
  try {
    const wall = wallTimeInZoneToUtc(
      { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
      "America/Denver",
    );
    const parts = zonedParts(wall, "America/Denver");
    assert(parts.hour === 1, "DST fall: 1:30 hour");
    assert(parts.minute === 30, "DST fall: 1:30 minute");
    assert(parts.day === 1, "DST fall: Nov 1 day");
  } catch (e) {
    console.error("FAIL: DST fall", e);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nall session-window checks passed");
