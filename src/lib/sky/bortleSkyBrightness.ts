/**
 * Approximate sky brightness from a stored Bortle class.
 *
 * Ranges follow the Bortle scale SQM column (John E. Bortle, "Introducing
 * the Bortle Dark-Sky Scale", Sky & Telescope, February 2001), as summarized
 * on the Bortle scale reference table. Classes 8 and 9 are published only as
 * brighter than 18.38 mag/arcsec² — this module does not invent a fainter
 * number for them.
 *
 * This is an estimate from the site's stored class. It is not a measured SQM
 * reading and not a weather product.
 */

export type BortleSkyBrightness = {
  bortle: number;
  /** Display string, e.g. "20.5–21.7" or "< 18.4" */
  display: string;
};

const CLASS_RANGE: Record<number, string> = {
  1: "21.99–22.0",
  2: "21.9–22.0",
  3: "21.7–21.9",
  4: "20.5–21.7",
  5: "19.5–20.5",
  6: "18.9–19.5",
  7: "18.4–18.9",
  8: "< 18.4",
  9: "< 18.4",
};

export function skyBrightnessFromBortle(
  bortle: number | null | undefined,
): BortleSkyBrightness | null {
  if (bortle == null || !Number.isInteger(bortle)) return null;
  const display = CLASS_RANGE[bortle];
  if (!display) return null;
  return { bortle, display };
}

export function formatSkyBrightnessFromBortle(
  bortle: number | null | undefined,
): string {
  const row = skyBrightnessFromBortle(bortle);
  if (!row) return "Unavailable";
  return `${row.display} mag/arcsec² · Estimated from site Bortle ${row.bortle}`;
}
