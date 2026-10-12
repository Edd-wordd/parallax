/**
 * Mission events / field-reading schema checks — run: npm run test:mission-events
 */

import {
  MissionEventInsertSchema,
  MissionEventSchema,
} from "../src/lib/schemas/missionEvent";
import { ConditionLogInsertSchema } from "../src/lib/schemas/conditionLog";
import type { ManualFieldReadingPayload } from "../src/lib/supabase/queries/conditionLogs";
import { latestManualReading } from "../src/lib/supabase/queries/conditionLogs";
import type { ConditionLogRow } from "../src/lib/schemas";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

const missionId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const clientEventId = "33333333-3333-4333-8333-333333333333";
const now = new Date().toISOString();

{
  const insert = MissionEventInsertSchema.parse({
    mission_id: missionId,
    recorded_at: now,
    kind: "field_reading",
    source: "manual",
    summary: "Field reading · seeing 3 · clouds 20%",
    payload: {
      seeing: 3,
      transparency: 4,
      cloudsPct: 20,
      wind: "low",
      moonGlare: false,
    },
    client_event_id: clientEventId,
  });
  assert(insert.kind === "field_reading", "insert kind field_reading");
  assert(insert.client_event_id === clientEventId, "client_event_id kept");
}

{
  const snap = MissionEventInsertSchema.parse({
    mission_id: missionId,
    recorded_at: now,
    kind: "plan_snapshot",
    source: "system",
    summary: "Planning complete · 2 targets: M31, M42",
    payload: {
      reason: "Planning complete",
      targetCount: 2,
      targets: [{ catalogId: "M31", name: "Andromeda" }],
    },
  });
  assert(snap.kind === "plan_snapshot", "insert kind plan_snapshot");
}

{
  const started = MissionEventInsertSchema.parse({
    mission_id: missionId,
    recorded_at: now,
    kind: "mission_started",
    source: "system",
    summary: "Mission started · 1 target: M31",
    payload: { reason: "Mission started", targetCount: 1, targets: [] },
  });
  assert(started.kind === "mission_started", "insert kind mission_started");
}

{
  const check = MissionEventInsertSchema.parse({
    mission_id: missionId,
    recorded_at: now,
    kind: "checklist_item",
    source: "user",
    summary: "Checklist · Polar alignment within tolerance",
    payload: {
      sectionId: "mount-alignment",
      stepId: "polar-align",
      label: "Polar alignment within tolerance",
      sectionLabel: "Mount & Alignment",
      checked: true,
    },
  });
  assert(check.kind === "checklist_item", "insert kind checklist_item");
}

{
  const row = MissionEventSchema.parse({
    id: "44444444-4444-4444-8444-444444444444",
    user_id: userId,
    mission_id: missionId,
    session_id: null,
    recorded_at: now,
    kind: "correction",
    source: "user",
    catalog_id: null,
    summary: "Corrected earlier reading",
    payload: {},
    corrects_event_id: "55555555-5555-4555-8555-555555555555",
    client_event_id: null,
    created_at: now,
  });
  assert(row.kind === "correction", "correction kind parses");
  assert(!!row.corrects_event_id, "corrects_event_id present");
}

{
  // Idempotency helper: same client_event_id → treat as one logical event
  const seen = new Map<string, string>();
  function acceptOrReuse(clientId: string, id: string): string {
    const existing = seen.get(clientId);
    if (existing) return existing;
    seen.set(clientId, id);
    return id;
  }
  const a = acceptOrReuse(clientEventId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  const b = acceptOrReuse(clientEventId, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert(a === b, "duplicate client_event_id reuses first id");
}

{
  const reading: ManualFieldReadingPayload = {
    seeing: 2,
    transparency: 3,
    cloudsPct: 40,
    wind: "med",
    moonGlare: true,
    notes: "gusty",
  };
  const insert = ConditionLogInsertSchema.parse({
    mission_id: missionId,
    recorded_at: now,
    source: "manual",
    payload: {
      seeing: reading.seeing,
      transparency: reading.transparency,
      cloudsPct: reading.cloudsPct,
      wind: reading.wind,
      moonGlare: reading.moonGlare,
      notes: reading.notes,
    },
  });
  assert(insert.source === "manual", "condition_log manual source");
  assert(
    (insert.payload as { cloudsPct: number }).cloudsPct === 40,
    "cloudsPct in payload",
  );
}

{
  const logs: ConditionLogRow[] = [
    {
      id: "66666666-6666-4666-8666-666666666666",
      user_id: userId,
      mission_id: missionId,
      session_id: null,
      recorded_at: "2026-10-04T20:00:00.000Z",
      source: "forecast",
      event_type: null,
      payload: {},
      created_at: "2026-10-04T20:00:00.000Z",
    },
    {
      id: "77777777-7777-4777-8777-777777777777",
      user_id: userId,
      mission_id: missionId,
      session_id: null,
      recorded_at: "2026-10-04T21:00:00.000Z",
      source: "manual",
      event_type: null,
      payload: { seeing: 4 },
      created_at: "2026-10-04T21:00:00.000Z",
    },
  ];
  const latest = latestManualReading(logs);
  assert(latest?.id === logs[1]!.id, "latestManualReading picks last manual");
  assert(latestManualReading([]) === null, "latestManualReading empty → null");
}

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nall mission-events checks passed");
