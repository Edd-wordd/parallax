/**
 * Curated deep-sky targets for planning.
 *
 * Coordinates are J2000: RA in sidereal hours, Dec in degrees
 * (astronomy-engine Horizon / DefineStar convention).
 *
 * Angular sizes used for rig framing must set sizeVerified: true and cite
 * sizeSource. Unverified sizes must not produce a Fits/Tight/etc. state.
 *
 * Planetary targets stay out of this list.
 */

import type { TargetType } from "@/lib/types";

export type SizeKind = "bright_core" | "extended" | "unknown";

export interface CuratedTarget {
  id: string;
  name: string;
  type: Exclude<TargetType, "planet" | "moon" | "planetarium">;
  /** Alternate ids (e.g. legacy catalog keys) resolved by catalogById */
  aliases?: string[];
  /** Primary Messier / NGC / IC label for display */
  catalogIds?: string[];
  /** Right ascension in hours [0, 24) */
  raHours: number;
  /** Declination in degrees [-90, 90] */
  decDeg: number;
  magnitude?: number;
  /** Major angular size (arcmin) for framing */
  sizeMajorArcmin?: number;
  sizeMinorArcmin?: number;
  sizeKind?: SizeKind;
  /** True only after check against a cited source */
  sizeVerified?: boolean;
  sizeSource?: string;
  constellation?: string;
  /**
   * Eligible for automatic dashboard recommendations.
   * Default: true when sizeVerified and coords valid (see isRecommendEligible).
   */
  recommendEligible?: boolean;
  /** OpenNGC / import provenance note */
  provenance?: string;
  /** @deprecated use sizeMajorArcmin */
  angularSizeArcmin?: number;
}

/**
 * Legacy id → current id (mission planning-only targets may still store old ids).
 */
export const CATALOG_ID_ALIASES: Record<string, string> = {
  ngc1976: "ngc1977", // was wrongly used for Running Man; NGC 1976 is M42
};

export const CURATED_DEEP_SKY_TARGETS: CuratedTarget[] = [
  {
    id: "m31",
    name: "Andromeda Galaxy (M31)",
    type: "galaxy",
    catalogIds: ["M31", "NGC 224"],
    raHours: 0.712,
    decDeg: 41.269,
    magnitude: 3.44,
    sizeMajorArcmin: 178,
    sizeMinorArcmin: 63,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SIMBAD / common major-axis ~3°; OpenNGC-scale ellipse",
    constellation: "Andromeda",
    angularSizeArcmin: 178,
  },
  {
    id: "m42",
    name: "Orion Nebula (M42)",
    type: "nebula",
    catalogIds: ["M42", "NGC 1976"],
    raHours: 5.588,
    decDeg: -5.391,
    magnitude: 4.0,
    sizeMajorArcmin: 65,
    sizeMinorArcmin: 60,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SIMBAD/Wikipedia-scale bright core ~65′; extended glow larger",
    constellation: "Orion",
    angularSizeArcmin: 65,
  },
  {
    id: "ngc1977",
    name: "Running Man Nebula (NGC 1977)",
    type: "nebula",
    aliases: ["ngc1976"],
    catalogIds: ["NGC 1977"],
    raHours: 5.588,
    decDeg: -4.817,
    magnitude: 5.0,
    sizeMajorArcmin: 40,
    sizeMinorArcmin: 25,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC / common imaging size for NGC 1977 region (~40′)",
    constellation: "Orion",
    angularSizeArcmin: 40,
  },
  {
    id: "m45",
    name: "Pleiades (M45)",
    type: "open_cluster",
    catalogIds: ["M45"],
    raHours: 3.783,
    decDeg: 24.117,
    magnitude: 1.6,
    sizeMajorArcmin: 110,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "Common cluster diameter ~110′ (SEDS/Wikipedia)",
    constellation: "Taurus",
    angularSizeArcmin: 110,
  },
  {
    id: "m13",
    name: "Hercules Cluster (M13)",
    type: "globular_cluster",
    catalogIds: ["M13", "NGC 6205"],
    raHours: 16.695,
    decDeg: 36.46,
    magnitude: 5.8,
    sizeMajorArcmin: 20,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SIMBAD/SEDS ~20′",
    constellation: "Hercules",
    angularSizeArcmin: 20,
  },
  {
    id: "m51",
    name: "Whirlpool Galaxy (M51)",
    type: "galaxy",
    catalogIds: ["M51", "NGC 5194"],
    raHours: 13.498,
    decDeg: 47.195,
    magnitude: 8.4,
    sizeMajorArcmin: 11,
    sizeMinorArcmin: 7,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC / SIMBAD ~11×7′",
    constellation: "Canes Venatici",
    angularSizeArcmin: 11,
  },
  {
    id: "m101",
    name: "Pinwheel Galaxy (M101)",
    type: "galaxy",
    catalogIds: ["M101", "NGC 5457"],
    raHours: 14.053,
    decDeg: 54.349,
    magnitude: 7.9,
    sizeMajorArcmin: 29,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC ~28–29′",
    constellation: "Ursa Major",
    angularSizeArcmin: 29,
  },
  {
    id: "m104",
    name: "Sombrero Galaxy (M104)",
    type: "galaxy",
    catalogIds: ["M104", "NGC 4594"],
    raHours: 12.667,
    decDeg: -11.623,
    magnitude: 8.0,
    sizeMajorArcmin: 9,
    sizeMinorArcmin: 4,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC ~9×4′",
    constellation: "Virgo",
    angularSizeArcmin: 9,
  },
  {
    id: "m81",
    name: "Bode's Galaxy (M81)",
    type: "galaxy",
    catalogIds: ["M81", "NGC 3031"],
    raHours: 9.926,
    decDeg: 69.065,
    magnitude: 6.9,
    sizeMajorArcmin: 21,
    sizeMinorArcmin: 10,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC ~21×10′",
    constellation: "Ursa Major",
    angularSizeArcmin: 21,
  },
  {
    id: "m82",
    name: "Cigar Galaxy (M82)",
    type: "galaxy",
    catalogIds: ["M82", "NGC 3034"],
    raHours: 9.931,
    decDeg: 69.679,
    magnitude: 8.4,
    sizeMajorArcmin: 11,
    sizeMinorArcmin: 4,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC ~11×4′",
    constellation: "Ursa Major",
    angularSizeArcmin: 11,
  },
  {
    id: "m33",
    name: "Triangulum Galaxy (M33)",
    type: "galaxy",
    catalogIds: ["M33", "NGC 598"],
    raHours: 1.564,
    decDeg: 30.66,
    magnitude: 5.7,
    sizeMajorArcmin: 73,
    sizeMinorArcmin: 45,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "OpenNGC / common ~70′ class",
    constellation: "Triangulum",
    angularSizeArcmin: 73,
  },
  {
    id: "m17",
    name: "Omega Nebula (M17)",
    type: "nebula",
    catalogIds: ["M17", "NGC 6618"],
    raHours: 18.346,
    decDeg: -16.177,
    magnitude: 6.0,
    sizeMajorArcmin: 20,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~20′ bright region",
    constellation: "Sagittarius",
    angularSizeArcmin: 20,
  },
  {
    id: "m20",
    name: "Trifid Nebula (M20)",
    type: "nebula",
    catalogIds: ["M20", "NGC 6514"],
    raHours: 18.045,
    decDeg: -23.03,
    magnitude: 6.3,
    sizeMajorArcmin: 28,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SEDS ~28′",
    constellation: "Sagittarius",
    angularSizeArcmin: 28,
  },
  {
    id: "m8",
    name: "Lagoon Nebula (M8)",
    type: "nebula",
    catalogIds: ["M8", "NGC 6523"],
    raHours: 18.061,
    decDeg: -24.38,
    magnitude: 6.0,
    sizeMajorArcmin: 90,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SEDS extended nebulosity ~90′",
    constellation: "Sagittarius",
    angularSizeArcmin: 90,
  },
  {
    id: "m16",
    name: "Eagle Nebula (M16)",
    type: "nebula",
    catalogIds: ["M16", "NGC 6611"],
    raHours: 18.313,
    decDeg: -13.807,
    magnitude: 6.4,
    // Cluster NGC 6611 is smaller; nebulosity IC 4703 is larger — use bright nebula core
    sizeMajorArcmin: 35,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "Common imaging nebulosity ~30–35′ (distinct from cluster core)",
    constellation: "Serpens",
    angularSizeArcmin: 35,
  },
  {
    id: "m44",
    name: "Beehive Cluster (M44)",
    type: "open_cluster",
    catalogIds: ["M44", "NGC 2632"],
    raHours: 8.668,
    decDeg: 19.983,
    magnitude: 3.7,
    sizeMajorArcmin: 95,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SEDS ~95′",
    constellation: "Cancer",
    angularSizeArcmin: 95,
  },
  {
    id: "m35",
    name: "M35 Open Cluster",
    type: "open_cluster",
    catalogIds: ["M35", "NGC 2168"],
    raHours: 6.149,
    decDeg: 24.333,
    magnitude: 5.3,
    sizeMajorArcmin: 28,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SEDS ~28′",
    constellation: "Gemini",
    angularSizeArcmin: 28,
  },
  {
    id: "m11",
    name: "Wild Duck Cluster (M11)",
    type: "open_cluster",
    catalogIds: ["M11", "NGC 6705"],
    raHours: 18.851,
    decDeg: -6.267,
    magnitude: 6.3,
    sizeMajorArcmin: 14,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~14′",
    constellation: "Scutum",
    angularSizeArcmin: 14,
  },
  {
    id: "m3",
    name: "M3 Globular Cluster",
    type: "globular_cluster",
    catalogIds: ["M3", "NGC 5272"],
    raHours: 13.703,
    decDeg: 28.377,
    magnitude: 6.2,
    sizeMajorArcmin: 18,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~18′",
    constellation: "Canes Venatici",
    angularSizeArcmin: 18,
  },
  {
    id: "m5",
    name: "M5 Globular Cluster",
    type: "globular_cluster",
    catalogIds: ["M5", "NGC 5904"],
    raHours: 15.309,
    decDeg: 2.083,
    magnitude: 5.6,
    sizeMajorArcmin: 23,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~23′",
    constellation: "Serpens",
    angularSizeArcmin: 23,
  },
  {
    id: "m15",
    name: "M15 Globular Cluster",
    type: "globular_cluster",
    catalogIds: ["M15", "NGC 7078"],
    raHours: 21.5,
    decDeg: 12.167,
    magnitude: 6.2,
    sizeMajorArcmin: 18,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~18′",
    constellation: "Pegasus",
    angularSizeArcmin: 18,
  },
  {
    id: "m57",
    name: "Ring Nebula (M57)",
    type: "nebula",
    catalogIds: ["M57", "NGC 6720"],
    raHours: 18.893,
    decDeg: 33.029,
    magnitude: 8.8,
    sizeMajorArcmin: 1.4,
    sizeMinorArcmin: 1.0,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SIMBAD ~1.4×1.0′",
    constellation: "Lyra",
    angularSizeArcmin: 1.4,
  },
  {
    id: "m27",
    name: "Dumbbell Nebula (M27)",
    type: "nebula",
    catalogIds: ["M27", "NGC 6853"],
    raHours: 19.993,
    decDeg: 22.721,
    magnitude: 7.4,
    sizeMajorArcmin: 8,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~8′",
    constellation: "Vulpecula",
    angularSizeArcmin: 8,
  },
  {
    id: "m97",
    name: "Owl Nebula (M97)",
    type: "nebula",
    catalogIds: ["M97", "NGC 3587"],
    raHours: 11.248,
    decDeg: 55.019,
    magnitude: 9.9,
    sizeMajorArcmin: 3.4,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SEDS ~3.4′",
    constellation: "Ursa Major",
    angularSizeArcmin: 3.4,
  },
  {
    id: "ngc2392",
    name: "Eskimo Nebula (NGC 2392)",
    type: "nebula",
    catalogIds: ["NGC 2392"],
    raHours: 7.485,
    decDeg: 20.912,
    magnitude: 9.1,
    sizeMajorArcmin: 0.8,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SIMBAD ~48″ class (~0.8′)",
    constellation: "Gemini",
    angularSizeArcmin: 0.8,
  },
  {
    id: "m1",
    name: "Crab Nebula (M1)",
    type: "nebula",
    catalogIds: ["M1", "NGC 1952"],
    raHours: 5.575,
    decDeg: 22.014,
    magnitude: 8.4,
    sizeMajorArcmin: 6,
    sizeMinorArcmin: 4,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "SIMBAD ~6×4′",
    constellation: "Taurus",
    angularSizeArcmin: 6,
  },
  {
    id: "ngc869",
    name: "Double Cluster (NGC 869)",
    type: "open_cluster",
    catalogIds: ["NGC 869"],
    raHours: 2.317,
    decDeg: 57.133,
    magnitude: 4.3,
    // Pair with NGC 884 spans ~60′; single cluster ~30′
    sizeMajorArcmin: 30,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "SEDS NGC 869 alone ~30′ (pair wider)",
    constellation: "Perseus",
    angularSizeArcmin: 30,
  },
  {
    id: "ngc2244",
    name: "Rosette Cluster (NGC 2244)",
    type: "open_cluster",
    catalogIds: ["NGC 2244"],
    raHours: 6.532,
    decDeg: 4.942,
    magnitude: 4.8,
    sizeMajorArcmin: 24,
    sizeKind: "bright_core",
    sizeVerified: true,
    sizeSource: "OpenNGC cluster ~24′ — not the full Rosette nebulosity",
    constellation: "Monoceros",
    angularSizeArcmin: 24,
  },
  {
    id: "ngc2237",
    name: "Rosette Nebula (NGC 2237)",
    type: "nebula",
    catalogIds: ["NGC 2237"],
    raHours: 6.532,
    decDeg: 4.95,
    magnitude: 9.0,
    sizeMajorArcmin: 80,
    sizeKind: "extended",
    sizeVerified: true,
    sizeSource: "Extended Rosette nebulosity ~80′ (distinct from NGC 2244 cluster)",
    constellation: "Monoceros",
    angularSizeArcmin: 80,
  },
];

export function resolveCatalogId(id: string): string {
  return CATALOG_ID_ALIASES[id] ?? id;
}

export function curatedTargetById(id: string): CuratedTarget | undefined {
  const resolved = resolveCatalogId(id);
  return (
    CURATED_DEEP_SKY_TARGETS.find((t) => t.id === resolved) ??
    CURATED_DEEP_SKY_TARGETS.find((t) => t.aliases?.includes(id))
  );
}

export function curatedTargetsByTypes(types: string[]): CuratedTarget[] {
  if (!types.length) return CURATED_DEEP_SKY_TARGETS;
  const set = new Set(types);
  return CURATED_DEEP_SKY_TARGETS.filter((t) => set.has(t.type));
}

/** Automatic recommendations + rig-fit advice require verified size + coords. */
export function isRecommendEligible(t: CuratedTarget): boolean {
  if (t.recommendEligible === false) return false;
  if (t.sizeVerified !== true) return false;
  return (
    Number.isFinite(t.raHours) &&
    Number.isFinite(t.decDeg) &&
    t.raHours >= 0 &&
    t.raHours < 24 &&
    t.decDeg >= -90 &&
    t.decDeg <= 90
  );
}

export function recommendEligibleTargets(types: string[]): CuratedTarget[] {
  return curatedTargetsByTypes(types).filter(isRecommendEligible);
}

/** Bright & large Explorer filter (replaces Beginner). */
export function isBrightAndLarge(t: CuratedTarget): boolean {
  const mag = t.magnitude;
  const size = t.sizeMajorArcmin ?? t.angularSizeArcmin;
  return (
    mag != null &&
    Number.isFinite(mag) &&
    mag <= 8 &&
    size != null &&
    Number.isFinite(size) &&
    size >= 15
  );
}
