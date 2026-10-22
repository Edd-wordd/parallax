/** Effective focal length after reducer (&lt;1) or Barlow (&gt;1). */
export function effectiveFocalLengthMm(
  focalLengthMm: number,
  opticsFactor?: number | null,
): number | null {
  if (!Number.isFinite(focalLengthMm) || focalLengthMm <= 0) return null;
  const f =
    opticsFactor != null && Number.isFinite(opticsFactor) && opticsFactor > 0
      ? opticsFactor
      : 1;
  return focalLengthMm * f;
}

/** f-ratio from aperture and (effective) focal length. */
export function fRatio(
  focalLengthMm: number,
  apertureMm: number,
  opticsFactor?: number | null,
): number | null {
  if (!Number.isFinite(apertureMm) || apertureMm <= 0) return null;
  const eff = effectiveFocalLengthMm(focalLengthMm, opticsFactor);
  if (eff == null) return null;
  return eff / apertureMm;
}

export function formatFRatio(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `f/${ratio.toFixed(1)}`;
}

/** Arcsec per pixel when pixel size and effective FL known. */
export function samplingArcsecPerPixel(
  pixelSizeUm: number,
  focalLengthMm: number,
  opticsFactor?: number | null,
): number | null {
  if (!Number.isFinite(pixelSizeUm) || pixelSizeUm <= 0) return null;
  const eff = effectiveFocalLengthMm(focalLengthMm, opticsFactor);
  if (eff == null) return null;
  return (pixelSizeUm / eff) * 206.265;
}
