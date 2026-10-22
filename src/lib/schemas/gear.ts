import { z } from "zod";

export const SensorPresetSchema = z.enum([
  "apsc",
  "full_frame",
  "m43",
  "1inch",
]);

export const MountTypeSchema = z.enum(["alt-az", "equatorial"]);

export const MountClassSchema = z.enum([
  "stock",
  "custom_diy",
  "star_tracker",
]);

export const TrackingSchema = z.enum(["none", "motorized", "guided"]);

export const GearAccessorySchema = z.enum([
  "focus_mask",
  "flattener_coma",
  "dew_control",
  "filters_owned",
]);

const sensorMm = z
  .number()
  .positive()
  .max(50)
  .nullable()
  .optional();

export const GearProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  telescope_name: z.string().min(1),
  focal_length: z.number().positive(),
  aperture: z.number().positive(),
  camera_name: z.string().min(1),
  sensor_preset: SensorPresetSchema,
  sensor_width_mm: sensorMm,
  sensor_height_mm: sensorMm,
  optics_factor: z.number().positive().nullable().optional(),
  pixel_size: z.number().positive().nullable().optional(),
  mount_type: MountTypeSchema,
  mount_class: MountClassSchema.default("stock"),
  tracking: TrackingSchema.default("none"),
  guiding: z.boolean(),
  camera_cooled: z.boolean().default(false),
  accessories: z.array(GearAccessorySchema).default([]),
  mount_notes: z.string().nullable().optional(),
  is_active: z.boolean(),
  deleted_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const GearProfileInsertSchema = z.object({
  name: z.string().min(1),
  telescope_name: z.string().min(1),
  focal_length: z.number().positive(),
  aperture: z.number().positive(),
  camera_name: z.string().min(1),
  sensor_preset: SensorPresetSchema,
  sensor_width_mm: z.number().positive().max(50).optional(),
  sensor_height_mm: z.number().positive().max(50).optional(),
  optics_factor: z.number().positive().optional().nullable(),
  pixel_size: z.number().positive().optional(),
  mount_type: MountTypeSchema,
  mount_class: MountClassSchema.default("stock"),
  tracking: TrackingSchema.default("none"),
  guiding: z.boolean().default(false),
  camera_cooled: z.boolean().default(false),
  accessories: z.array(GearAccessorySchema).default([]),
  mount_notes: z.string().optional().nullable(),
  is_active: z.boolean().default(false),
});

export const GearProfileUpdateSchema = GearProfileInsertSchema.partial().extend({
  name: z.string().min(1).optional(),
});

export type GearProfileRow = z.infer<typeof GearProfileSchema>;
export type GearProfileInsert = z.infer<typeof GearProfileInsertSchema>;
export type GearProfileUpdate = z.infer<typeof GearProfileUpdateSchema>;
export type MountClass = z.infer<typeof MountClassSchema>;
export type TrackingLevel = z.infer<typeof TrackingSchema>;
export type GearAccessory = z.infer<typeof GearAccessorySchema>;
