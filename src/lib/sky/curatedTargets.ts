/**
 * Curated deep-sky targets for planning v1.
 *
 * Coordinates are approximate J2000: RA in sidereal hours, Dec in degrees
 * (same convention as astronomy-engine Horizon / DefineStar).
 * Provenance: Messier/NGC values previously used in MOCK_TARGETS; verify
 * against SIMBAD/OpenNGC when a full catalog import lands.
 *
 * Later: swap this module for a larger static catalog with the same shape.
 * Planetary targets stay out of this list (use Body ephemerides separately).
 */

import type { TargetType } from "@/lib/types";

export interface CuratedTarget {
  id: string;
  name: string;
  type: Exclude<TargetType, "planet" | "moon" | "planetarium">;
  /** Right ascension in hours [0, 24) */
  raHours: number;
  /** Declination in degrees [-90, 90] */
  decDeg: number;
  magnitude?: number;
  angularSizeArcmin?: number;
  constellation?: string;
}

export const CURATED_DEEP_SKY_TARGETS: CuratedTarget[] = [
  { id: "m31", name: "Andromeda Galaxy (M31)", type: "galaxy", raHours: 10.68, decDeg: 41.27, magnitude: 3.44, angularSizeArcmin: 178, constellation: "Andromeda" },
  { id: "m42", name: "Orion Nebula (M42)", type: "nebula", raHours: 5.59, decDeg: -5.39, magnitude: 4.0, angularSizeArcmin: 65, constellation: "Orion" },
  { id: "m45", name: "Pleiades (M45)", type: "open_cluster", raHours: 3.78, decDeg: 24.12, magnitude: 1.6, angularSizeArcmin: 110, constellation: "Taurus" },
  { id: "m13", name: "Hercules Cluster (M13)", type: "globular_cluster", raHours: 16.72, decDeg: 36.46, magnitude: 5.8, angularSizeArcmin: 20, constellation: "Hercules" },
  { id: "m51", name: "Whirlpool Galaxy (M51)", type: "galaxy", raHours: 13.5, decDeg: 47.19, magnitude: 8.4, angularSizeArcmin: 11, constellation: "Canes Venatici" },
  { id: "m101", name: "Pinwheel Galaxy (M101)", type: "galaxy", raHours: 14.05, decDeg: 54.35, magnitude: 7.9, angularSizeArcmin: 29, constellation: "Ursa Major" },
  { id: "m104", name: "Sombrero Galaxy (M104)", type: "galaxy", raHours: 12.67, decDeg: -11.62, magnitude: 8.0, angularSizeArcmin: 9, constellation: "Virgo" },
  { id: "m81", name: "Bode's Galaxy (M81)", type: "galaxy", raHours: 9.93, decDeg: 69.07, magnitude: 6.9, angularSizeArcmin: 21, constellation: "Ursa Major" },
  { id: "m82", name: "Cigar Galaxy (M82)", type: "galaxy", raHours: 9.93, decDeg: 69.68, magnitude: 8.4, angularSizeArcmin: 11, constellation: "Ursa Major" },
  { id: "m33", name: "Triangulum Galaxy (M33)", type: "galaxy", raHours: 1.56, decDeg: 30.66, magnitude: 5.7, angularSizeArcmin: 73, constellation: "Triangulum" },
  { id: "m17", name: "Omega Nebula (M17)", type: "nebula", raHours: 18.34, decDeg: -16.2, magnitude: 6.0, angularSizeArcmin: 20, constellation: "Sagittarius" },
  { id: "m20", name: "Trifid Nebula (M20)", type: "nebula", raHours: 18.04, decDeg: -23.03, magnitude: 6.3, angularSizeArcmin: 28, constellation: "Sagittarius" },
  { id: "m8", name: "Lagoon Nebula (M8)", type: "nebula", raHours: 18.06, decDeg: -24.38, magnitude: 6.0, angularSizeArcmin: 90, constellation: "Sagittarius" },
  { id: "m16", name: "Eagle Nebula (M16)", type: "nebula", raHours: 18.31, decDeg: -13.79, magnitude: 6.4, angularSizeArcmin: 7, constellation: "Serpens" },
  { id: "ngc1976", name: "Running Man Nebula", type: "nebula", raHours: 5.59, decDeg: -4.84, magnitude: 5.0, angularSizeArcmin: 40, constellation: "Orion" },
  { id: "m44", name: "Beehive Cluster (M44)", type: "open_cluster", raHours: 8.67, decDeg: 19.98, magnitude: 3.7, angularSizeArcmin: 95, constellation: "Cancer" },
  { id: "m35", name: "M35 Open Cluster", type: "open_cluster", raHours: 6.15, decDeg: 24.33, magnitude: 5.3, angularSizeArcmin: 28, constellation: "Gemini" },
  { id: "m11", name: "Wild Duck Cluster (M11)", type: "open_cluster", raHours: 18.85, decDeg: -6.27, magnitude: 6.3, angularSizeArcmin: 14, constellation: "Scutum" },
  { id: "m3", name: "M3 Globular Cluster", type: "globular_cluster", raHours: 13.72, decDeg: 28.38, magnitude: 6.2, angularSizeArcmin: 18, constellation: "Canes Venatici" },
  { id: "m5", name: "M5 Globular Cluster", type: "globular_cluster", raHours: 15.31, decDeg: 2.08, magnitude: 5.6, angularSizeArcmin: 23, constellation: "Serpens" },
  { id: "m15", name: "M15 Globular Cluster", type: "globular_cluster", raHours: 21.5, decDeg: 12.17, magnitude: 6.2, angularSizeArcmin: 18, constellation: "Pegasus" },
  { id: "m57", name: "Ring Nebula (M57)", type: "nebula", raHours: 18.89, decDeg: 33.03, magnitude: 8.8, angularSizeArcmin: 1.4, constellation: "Lyra" },
  { id: "m27", name: "Dumbbell Nebula (M27)", type: "nebula", raHours: 19.99, decDeg: 22.72, magnitude: 7.4, angularSizeArcmin: 8, constellation: "Vulpecula" },
  { id: "m97", name: "Owl Nebula (M97)", type: "nebula", raHours: 11.25, decDeg: 55.02, magnitude: 9.9, angularSizeArcmin: 3.4, constellation: "Ursa Major" },
  { id: "ngc2392", name: "Eskimo Nebula", type: "nebula", raHours: 7.58, decDeg: 20.91, magnitude: 9.1, angularSizeArcmin: 0.8, constellation: "Gemini" },
  { id: "m1", name: "Crab Nebula (M1)", type: "nebula", raHours: 5.58, decDeg: 22.01, magnitude: 8.4, angularSizeArcmin: 6, constellation: "Taurus" },
  { id: "ngc869", name: "Double Cluster (NGC 869)", type: "open_cluster", raHours: 2.2, decDeg: 57.15, magnitude: 4.3, angularSizeArcmin: 30, constellation: "Perseus" },
  { id: "ngc2244", name: "Rosette Nebula Cluster", type: "open_cluster", raHours: 6.5, decDeg: 4.9, magnitude: 4.8, angularSizeArcmin: 25, constellation: "Monoceros" },
];

export function curatedTargetsByTypes(types: string[]): CuratedTarget[] {
  if (!types.length) return CURATED_DEEP_SKY_TARGETS;
  const set = new Set(types);
  return CURATED_DEEP_SKY_TARGETS.filter((t) => set.has(t.type));
}
