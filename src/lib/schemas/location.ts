import { z } from "zod";

export const LocationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  lat: z.number().finite(),
  lon: z.number().finite(),
  bortle: z.number().int().min(1).max(9),
  timezone: z.string().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const LocationInsertSchema = z.object({
  name: z.string().min(1),
  lat: z.number().finite(),
  lon: z.number().finite(),
  bortle: z.number().int().min(1).max(9),
  timezone: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export const LocationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  lat: z.number().finite().optional(),
  lon: z.number().finite().optional(),
  bortle: z.number().int().min(1).max(9).optional(),
  timezone: z.string().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type LocationRow = z.infer<typeof LocationSchema>;
export type LocationInsert = z.infer<typeof LocationInsertSchema>;
export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;
