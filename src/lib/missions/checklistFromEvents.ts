/**
 * Derive equipment checklist checked state from append-only mission_events.
 * Last write for a section/step wins.
 */

import type { MissionEventRow } from "@/lib/schemas";

export function checklistStateFromEvents(
  events: MissionEventRow[],
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const ev of events) {
    if (ev.kind !== "checklist_item") continue;
    const sectionId =
      typeof ev.payload.sectionId === "string" ? ev.payload.sectionId : null;
    const stepId =
      typeof ev.payload.stepId === "string" ? ev.payload.stepId : null;
    if (!sectionId || !stepId) continue;
    if (typeof ev.payload.checked !== "boolean") continue;
    state[`${sectionId}-${stepId}`] = ev.payload.checked;
  }
  return state;
}
