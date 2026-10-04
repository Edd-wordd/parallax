import { z } from "zod";
import { CatalogIdSchema } from "./catalogId";

/** Session night quality 1–10; UI label is derived, not stored (Decision C). */
export const OutcomeScoreSchema = z.number().int().min(1).max(10);

export const SessionSoftwareSchema = z.enum(["nina", "asiair", "ekos"]);

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  mission_id: z.string().uuid(),
  location_id: z.string().uuid(),
  started_at: z.string().datetime().nullable().optional(),
  ended_at: z.string().datetime().nullable().optional(),
  outcome_score: OutcomeScoreSchema,
  what_i_learned: z.string().nullable().optional(),
  session_software: SessionSoftwareSchema.nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const SessionTargetSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  catalog_id: CatalogIdSchema,
  target_name: z.string().min(1),
  frames_captured: z.number().int().min(0),
  exposure_seconds: z.number().positive(),
  iso: z.number().int().nullable().optional(),
  gain: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const SessionUpsertSchema = z.object({
  mission_id: z.string().uuid(),
  location_id: z.string().uuid(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  outcome_score: OutcomeScoreSchema,
  what_i_learned: z.string().optional(),
  session_software: SessionSoftwareSchema.optional(),
});

export const SessionTargetInsertSchema = z.object({
  catalog_id: CatalogIdSchema,
  target_name: z.string().min(1),
  frames_captured: z.number().int().min(0),
  exposure_seconds: z.number().positive(),
  iso: z.number().int().optional(),
  gain: z.number().optional(),
  notes: z.string().optional(),
});

/** Derived — never persisted. */
export function integrationMinutes(
  framesCaptured: number,
  exposureSeconds: number,
): number {
  return (framesCaptured * exposureSeconds) / 60;
}

export type SessionRow = z.infer<typeof SessionSchema>;
export type SessionTargetRow = z.infer<typeof SessionTargetSchema>;
export type SessionUpsert = z.infer<typeof SessionUpsertSchema>;
export type SessionTargetInsert = z.infer<typeof SessionTargetInsertSchema>;
export type OutcomeScore = z.infer<typeof OutcomeScoreSchema>;
