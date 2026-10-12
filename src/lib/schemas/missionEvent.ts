import { z } from "zod";

export const MissionEventKindSchema = z.enum([
  "phase_change",
  "target_added",
  "target_removed",
  "target_reordered",
  "target_completed",
  "target_skipped",
  "schedule_changed",
  "field_reading",
  "actuals_updated",
  "capture_plan_updated",
    "plan_snapshot",
    "mission_started",
    "checklist_item",
    "note",
    "save_log",
    "correction",
]);

export const MissionEventSourceSchema = z.enum([
  "user",
  "system",
  "forecast",
  "astronomy",
  "manual",
]);

export const MissionEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  mission_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  recorded_at: z.string().datetime(),
  kind: MissionEventKindSchema,
  source: MissionEventSourceSchema,
  catalog_id: z.string().nullable().optional(),
  summary: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  corrects_event_id: z.string().uuid().nullable().optional(),
  client_event_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export const MissionEventInsertSchema = z.object({
  mission_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  recorded_at: z.string().datetime(),
  kind: MissionEventKindSchema,
  source: MissionEventSourceSchema,
  catalog_id: z.string().nullable().optional(),
  summary: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  corrects_event_id: z.string().uuid().nullable().optional(),
  client_event_id: z.string().uuid().optional(),
});

export type MissionEventKind = z.infer<typeof MissionEventKindSchema>;
export type MissionEventSource = z.infer<typeof MissionEventSourceSchema>;
export type MissionEventRow = z.infer<typeof MissionEventSchema>;
export type MissionEventInsert = z.infer<typeof MissionEventInsertSchema>;
