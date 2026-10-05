import imagesManifest from "../../../data/catalog/images.json";
import type { CatalogImageEntry } from "@/lib/catalog/types";
import {
  curatedTargetById,
  resolveCatalogId,
  type CuratedTarget,
} from "@/lib/sky/curatedTargets";

type Manifest = {
  images: Record<string, CatalogImageEntry>;
};

const manifest = imagesManifest as Manifest;

/**
 * DSS2 color cutout via CDS HiPS (hips2fits).
 * Matched by catalog J2000 coordinates — not free-text search.
 * Credit: Digitized Sky Survey / CDS Aladin HiPS.
 */
export function dssCutoutForTarget(target: CuratedTarget): CatalogImageEntry {
  const raDeg = ((target.raHours * 15) % 360 + 360) % 360;
  const decDeg = target.decDeg;
  const sizeArcmin =
    target.sizeMajorArcmin ?? target.angularSizeArcmin ?? 30;
  // Frame ~1.6× object major axis; clamp for tiny PN / huge galaxies
  const fovDeg = Math.min(3.5, Math.max(0.12, (sizeArcmin / 60) * 1.6));
  const pixels = 480;
  const params = new URLSearchParams({
    hips: "CDS/P/DSS2/color",
    ra: raDeg.toFixed(5),
    dec: decDeg.toFixed(5),
    fov: fovDeg.toFixed(4),
    width: String(pixels),
    height: String(pixels),
    format: "jpg",
  });
  return {
    url: `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?${params}`,
    credit: "DSS2 (Digitized Sky Survey)",
    source: "CDS Aladin HiPS / hips2fits",
    matchMethod: "catalog_radec_dss2",
    verifiedAt: "2026-10-04",
  };
}

/** Manual manifest entry only (editorial NASA etc.). */
export function getVerifiedCatalogImage(
  catalogId: string,
): CatalogImageEntry | null {
  const id = resolveCatalogId(catalogId);
  const entry = manifest.images[id];
  if (!entry?.url || !entry.credit) return null;
  return entry;
}

/**
 * Display image: curated manifest override, else DSS2 cutout at catalog coords.
 * Still never uses free-text NASA search as proof of identity.
 */
export function getCatalogDisplayImage(
  catalogId: string,
): CatalogImageEntry | null {
  const curated = getVerifiedCatalogImage(catalogId);
  if (curated) return curated;
  const target = curatedTargetById(catalogId);
  if (!target) return null;
  return dssCutoutForTarget(target);
}
