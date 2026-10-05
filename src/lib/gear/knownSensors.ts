/**
 * Verified camera sensor dimensions for form shortcuts.
 * Sources: manufacturer datasheets (ZWO ASI533MC Pro: 11.31 × 11.31 mm, 3.76 µm).
 */

export type KnownSensor = {
  id: string;
  label: string;
  /** Substrings matched case-insensitively against camera_name */
  matchNames: string[];
  sensorWidthMm: number;
  sensorHeightMm: number;
  pixelSizeUm?: number;
  /** Legacy enum kept for DB NOT NULL sensor_preset until deprecated */
  sensorPreset: "apsc" | "full_frame" | "m43" | "1inch";
};

export const KNOWN_SENSORS: KnownSensor[] = [
  {
    id: "asi533mc",
    label: "ZWO ASI533MC (11.31 × 11.31 mm)",
    matchNames: ["asi533mc", "asi533", "zwo asi533mc"],
    sensorWidthMm: 11.31,
    sensorHeightMm: 11.31,
    pixelSizeUm: 3.76,
    sensorPreset: "1inch",
  },
  {
    id: "asi2600mc",
    label: "ZWO ASI2600MC (23.5 × 15.7 mm)",
    matchNames: ["asi2600mc", "asi2600"],
    sensorWidthMm: 23.5,
    sensorHeightMm: 15.7,
    pixelSizeUm: 3.76,
    sensorPreset: "apsc",
  },
  {
    id: "full_frame_36x24",
    label: "Full frame 36 × 24 mm",
    matchNames: ["a7iii", "a7iv", "full frame"],
    sensorWidthMm: 36,
    sensorHeightMm: 24,
    sensorPreset: "full_frame",
  },
];

export function findKnownSensorByCameraName(
  cameraName: string,
): KnownSensor | null {
  const n = cameraName.trim().toLowerCase();
  if (!n) return null;
  for (const s of KNOWN_SENSORS) {
    if (s.matchNames.some((m) => n.includes(m))) return s;
  }
  return null;
}

export function getKnownSensorById(id: string): KnownSensor | null {
  return KNOWN_SENSORS.find((s) => s.id === id) ?? null;
}
