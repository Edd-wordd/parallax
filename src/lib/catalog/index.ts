/**
 * Canonical deep-sky catalog access for Explorer, detail, recommendations.
 * SoT today: curatedTargets (versioned snapshot); OpenNGC import expands later.
 */

import type { Target } from "@/lib/types";
import {
  CURATED_DEEP_SKY_TARGETS,
  curatedTargetById,
  isBrightAndLarge,
  isRecommendEligible,
  resolveCatalogId,
  type CuratedTarget,
} from "@/lib/sky/curatedTargets";
import {
  getCatalogDisplayImage,
  getVerifiedCatalogImage,
} from "@/lib/catalog/images";

export {
  curatedTargetById,
  isBrightAndLarge,
  isRecommendEligible,
  resolveCatalogId,
  getVerifiedCatalogImage,
  getCatalogDisplayImage,
};
export type { CuratedTarget };
export type {
  CatalogImageEntry,
  ExplorerTargetRow,
  ExplorerVisibilityStatus,
} from "@/lib/catalog/types";

export const CATALOG_VERSION = "parallax-deep-sky 2026-10-04";

/** Full Explorer DSO list (no planets). */
export function listDeepSkyCatalog(): CuratedTarget[] {
  return CURATED_DEEP_SKY_TARGETS;
}

export function catalogObjectToTarget(t: CuratedTarget): Target {
  const size = t.sizeMajorArcmin ?? t.angularSizeArcmin ?? 0;
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    ra: t.raHours,
    dec: t.decDeg,
    magnitude: t.magnitude ?? NaN,
    angular_size: size,
    constellation: t.constellation ?? "—",
    beginner: isBrightAndLarge(t),
  };
}

export function getExplorerTargetById(id: string): Target | undefined {
  const cat = curatedTargetById(id);
  return cat ? catalogObjectToTarget(cat) : undefined;
}
