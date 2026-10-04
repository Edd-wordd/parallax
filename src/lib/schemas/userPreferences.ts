import { z } from "zod";

export const UnitsSchema = z.enum(["metric", "imperial"]);

export const UserPreferencesSchema = z.object({
  user_id: z.string().min(1),
  default_min_altitude: z.number(),
  default_moon_tolerance: z.number(),
  units: UnitsSchema,
  updated_at: z.string().datetime().optional(),
});

export const UserPreferencesUpsertSchema = z.object({
  default_min_altitude: z.number(),
  default_moon_tolerance: z.number(),
  units: UnitsSchema,
});

export type UserPreferencesRow = z.infer<typeof UserPreferencesSchema>;
export type UserPreferencesUpsert = z.infer<typeof UserPreferencesUpsertSchema>;
