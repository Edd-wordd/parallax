import { z } from "zod";

export const ConditionSourceSchema = z.enum([
  "forecast",
  "live",
  "manual",
  "telemetry",
]);

/** Telemetry event_type values (null for plain condition samples). */
export const TelemetryEventTypeSchema = z.enum([
  "guiding_started",
  "guiding_failed",
  "focus_drift",
  "sequence_resumed",
]);

export const ConditionLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  mission_id: z.string().uuid().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  recorded_at: z.string().datetime(),
  source: ConditionSourceSchema,
  event_type: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime().optional(),
});

export const ConditionLogInsertSchema = z.object({
  mission_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  recorded_at: z.string().datetime(),
  source: ConditionSourceSchema,
  event_type: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type ConditionLogRow = z.infer<typeof ConditionLogSchema>;
export type ConditionLogInsert = z.infer<typeof ConditionLogInsertSchema>;
