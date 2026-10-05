import { z } from "zod";
import { CatalogIdSchema } from "./catalogId";

export const MissionObjectiveSchema = z.enum([
  "deep_integration",
  "survey_night",
  "quick_session",
]);

export const MissionTypeSchema = z.enum(["deep_sky", "planetary"]);

export const MissionStatusSchema = z.enum([
  "draft",
  "ready",
  "in_progress",
  "completed",
  "cancelled",
  "aborted",
]);

export const MissionPhaseSchema = z.enum([
  "planning",
  "setup",
  "capturing",
  "logging",
  "completed",
]);

export const TargetResultSchema = z.enum(["success", "partial", "failed"]);

export const MissionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  date_time: z.string().datetime(),
  location_id: z.string().uuid(),
  gear_id: z.string().uuid(),
  mission_type: MissionTypeSchema.nullable().optional(),
  objective: MissionObjectiveSchema.nullable().optional(),
  status: MissionStatusSchema,
  phase: MissionPhaseSchema,
  current_target_catalog_id: CatalogIdSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  cancelled_reason: z.string().nullable().optional(),
  log_locked: z.boolean(),
  transition_minutes: z.number().int().nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const MissionTargetSchema = z.object({
  id: z.string().uuid(),
  mission_id: z.string().uuid(),
  user_id: z.string().uuid(),
  catalog_id: CatalogIdSchema,
  target_name: z.string().min(1),
  target_type: z.string().min(1),
  planned_window_start: z.string().nullable().optional(),
  planned_window_end: z.string().nullable().optional(),
  scheduled_start_at: z.string().datetime().nullable().optional(),
  scheduled_end_at: z.string().datetime().nullable().optional(),
  planned_imaging_minutes: z.number().int().nullable().optional(),
  score: z.number(),
  sequence_index: z.number().int().nullable().optional(),
  role_label: z.string().nullable().optional(),
  is_fallback: z.boolean(),
  captured: z.boolean(),
  result: TargetResultSchema.nullable().optional(),
  sub_length: z.number().nullable().optional(),
  frames: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  planned_iso_gain: z.string().nullable().optional(),
  altitude_score: z.number().nullable().optional(),
  moon_separation_score: z.number().nullable().optional(),
  rig_framing_score: z.number().nullable().optional(),
  why_included: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const MissionInsertSchema = z.object({
  name: z.string().min(1),
  date_time: z.string().datetime(),
  location_id: z.string().uuid(),
  gear_id: z.string().uuid(),
  mission_type: MissionTypeSchema.optional(),
  objective: MissionObjectiveSchema.optional(),
  status: MissionStatusSchema,
  phase: MissionPhaseSchema,
  current_target_catalog_id: CatalogIdSchema.optional(),
  notes: z.string().optional(),
  transition_minutes: z.number().int().nullable().optional(),
});

export type MissionRow = z.infer<typeof MissionSchema>;
export type MissionTargetRow = z.infer<typeof MissionTargetSchema>;
export type MissionInsert = z.infer<typeof MissionInsertSchema>;
export type MissionObjective = z.infer<typeof MissionObjectiveSchema>;
