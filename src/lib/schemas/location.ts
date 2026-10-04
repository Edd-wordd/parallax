import { z } from "zod";

export const LocationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  lat: z.number().finite(),
  lon: z.number().finite(),
  bortle: z.number().int().min(1).max(9),
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
  notes: z.string().optional(),
});

export type LocationRow = z.infer<typeof LocationSchema>;
export type LocationInsert = z.infer<typeof LocationInsertSchema>;
