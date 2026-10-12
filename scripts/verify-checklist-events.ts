/**
 * Checklist state from mission_events — run: npm run test:checklist-events
 */

import assert from "node:assert/strict";
import { checklistStateFromEvents } from "../src/lib/missions/checklistFromEvents";
import type { MissionEventRow } from "../src/lib/schemas";

const base = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  mission_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  session_id: null,
  source: "user" as const,
  catalog_id: null,
  corrects_event_id: null,
  client_event_id: null,
  created_at: new Date().toISOString(),
};

const events: MissionEventRow[] = [
  {
    ...base,
    id: "11111111-1111-4111-8111-111111111111",
    recorded_at: "2026-10-11T20:00:00.000Z",
    kind: "checklist_item",
    summary: "Checklist · Power on",
    payload: {
      sectionId: "power-connections",
      stepId: "power-on",
      checked: true,
    },
  },
  {
    ...base,
    id: "22222222-2222-4222-8222-222222222222",
    recorded_at: "2026-10-11T20:01:00.000Z",
    kind: "checklist_item",
    summary: "Checklist · Polar",
    payload: {
      sectionId: "mount-alignment",
      stepId: "polar-align",
      checked: true,
    },
  },
  {
    ...base,
    id: "33333333-3333-4333-8333-333333333333",
    recorded_at: "2026-10-11T20:02:00.000Z",
    kind: "checklist_item",
    summary: "Unchecked · Polar",
    payload: {
      sectionId: "mount-alignment",
      stepId: "polar-align",
      checked: false,
    },
  },
  {
    ...base,
    id: "44444444-4444-4444-8444-444444444444",
    recorded_at: "2026-10-11T20:03:00.000Z",
    kind: "note",
    summary: "ignore",
    payload: { text: "hi" },
  },
];

const state = checklistStateFromEvents(events);
assert.equal(state["power-connections-power-on"], true);
assert.equal(state["mount-alignment-polar-align"], false);

console.log("verify-checklist-events: ok");
