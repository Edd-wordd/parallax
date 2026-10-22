import { z } from "zod";

export const UnitsSchema = z.enum(["metric", "imperial"]);
export type Units = z.infer<typeof UnitsSchema>;

export const UserPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  default_min_altitude: z.number().min(0).max(60),
  default_moon_tolerance: z.number().min(0).max(50),
  units: UnitsSchema,
  updated_at: z.string().datetime().optional(),
});

export const UserPreferencesUpsertSchema = z.object({
  default_min_altitude: z.number().min(0).max(60),
  default_moon_tolerance: z.number().min(0).max(50),
  units: UnitsSchema,
});

export type UserPreferencesRow = z.infer<typeof UserPreferencesSchema>;
export type UserPreferencesUpsert = z.infer<typeof UserPreferencesUpsertSchema>;
