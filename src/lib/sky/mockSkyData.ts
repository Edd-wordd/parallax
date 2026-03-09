/**
 * Mock sky data for Live Sky View.
 * TODO: Replace with real RA/Dec -> Alt/Az conversion based on site lat/lon and time.
 */

export interface SkySite {
  name: string;
  lat: number;
  lon: number;
}

export interface SkyTarget {
  id: string;
  name: string;
  ra: number;  // Right ascension (hours)
  dec: number; // Declination (degrees)
  color: string;
  /** Precomputed unit-sphere position [x,y,z] for 3D display until real conversion exists */
  position: [number, number, number];
  /** Mock Alt/Az for display until real conversion */
  alt?: number;
  az?: number;
  /** Best imaging window (mock) */
  bestWindow?: string;
}

export interface ConstellationSegment {
  /** Constellation id (e.g. "orion", "big_dipper") */
  id: string;
  /** Array of [x,y,z] unit-sphere points forming line segments */
  segments: [number, number, number][];
}

// Precomputed 3D unit-sphere positions (RA/Dec converted for display at a reference time)
// TODO: Compute from RA/Dec using site lat/lon and time for proper Alt/Az display
const targetPositions: Record<string, [number, number, number]> = {
  M31: [0.45, 0.35, 0.82],
  M42: [0.12, -0.55, 0.83],
  M13: [-0.25, 0.62, 0.74],
  M51: [0.55, -0.22, 0.81],
  M81: [-0.6, 0.5, 0.62],
};

export const site: SkySite = {
  name: "Pinnacles Dark Site",
  lat: 36.49,
  lon: -121.18,
};

export const time: string = new Date().toISOString();

export const targets: SkyTarget[] = [
  { id: "m31", name: "M31 (Andromeda)", ra: 0.71, dec: 41.27, color: "#22d3ee", position: targetPositions.M31, alt: 62, az: 185, bestWindow: "22:00–02:00" },
  { id: "m42", name: "M42 (Orion Nebula)", ra: 5.59, dec: -5.4, color: "#2dd4bf", position: targetPositions.M42, alt: 48, az: 210, bestWindow: "20:30–01:00" },
  { id: "m13", name: "M13 (Hercules)", ra: 16.72, dec: 36.46, color: "#67e8f9", position: targetPositions.M13, alt: 71, az: 95, bestWindow: "23:15–04:00" },
  { id: "m51", name: "M51 (Whirlpool)", ra: 13.5, dec: 47.2, color: "#5eead4", position: targetPositions.M51, alt: 65, az: 120, bestWindow: "22:45–03:30" },
  { id: "m81", name: "M81 (Bode's Galaxy)", ra: 9.93, dec: 69.07, color: "#99f6e4", position: targetPositions.M81, alt: 58, az: 350, bestWindow: "21:00–02:30" },
];

/** First target treated as recommended for "breathe" pulse effect */
export const RECOMMENDED_TARGET_ID = "m31";

/** Sample constellation line segments in unit-sphere coords (Orion + Big Dipper) */
export const constellationLines: ConstellationSegment[] = [
  {
    id: "orion",
    segments: [
      // Orion belt + shoulders + legs (simplified)
      [0.3, 0.6, 0.74],
      [0.2, 0.4, 0.89],
      [0.1, 0.2, 0.97],
      [0.05, -0.1, 0.99],
      [0.0, -0.35, 0.94],
      [0.08, -0.55, 0.83],
      [0.15, -0.7, 0.7],
      [0.1, -0.55, 0.83],
      [0.05, -0.35, 0.94],
      [0.0, -0.1, 0.99],
      [-0.08, 0.15, 0.98],
      [-0.15, 0.45, 0.88],
      [-0.2, 0.65, 0.73],
    ],
  },
  {
    id: "big_dipper",
    segments: [
      [-0.6, 0.5, 0.62],
      [-0.5, 0.65, 0.58],
      [-0.35, 0.75, 0.56],
      [-0.2, 0.82, 0.54],
      [-0.1, 0.85, 0.52],
      [0.0, 0.86, 0.51],
      [0.15, 0.84, 0.52],
      [0.25, 0.8, 0.55],
      [0.15, 0.84, 0.52],
      [0.2, 0.7, 0.69],
      [0.35, 0.55, 0.76],
      [0.5, 0.35, 0.8],
    ],
  },
];

/** Tonight time string for display (e.g. "Tonight 19:42–05:18") */
export function getTonightTimeString(): string {
  return "Tonight 19:42–05:18";
}
